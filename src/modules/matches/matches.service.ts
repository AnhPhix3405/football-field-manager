import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  ConversationEntity,
  ConversationMemberEntity,
  ConversationType,
  MatchStatus,
  PostEntity,
  PostMatchEntity,
  PostStatus,
} from '../../database/entities';
import {
  ApplicationDecisionResponseDto,
  ApplicationResponseDto,
} from './dto/application-response.dto';
import { DecideApplicationDto } from './dto/decide-application.dto';

@Injectable()
export class MatchesService {
  constructor(
    @InjectRepository(PostEntity)
    private readonly postsRepository: Repository<PostEntity>,
    @InjectRepository(PostMatchEntity)
    private readonly matchesRepository: Repository<PostMatchEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async apply(
    postId: string,
    applicantId: string,
  ): Promise<ApplicationResponseDto> {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const post = await manager
          .getRepository(PostEntity)
          .createQueryBuilder('post')
          .setLock('pessimistic_read')
          .where('post.id = :postId', { postId })
          .getOne();
        if (!post) throw new NotFoundException('Post not found');
        if (post.userId === applicantId) {
          throw new ConflictException('You cannot apply to your own post');
        }
        if (
          post.status !== PostStatus.OPEN ||
          post.acceptedPlayers >= post.playersNeeded
        ) {
          throw new ConflictException(
            'Post is no longer accepting applications',
          );
        }

        const application = manager.getRepository(PostMatchEntity).create({
          postId,
          applicantId,
          status: MatchStatus.PENDING,
          conversationId: null,
        });
        return this.toResponse(
          await manager.getRepository(PostMatchEntity).save(application),
        );
      });
    } catch (error: unknown) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('You have already applied to this post');
      }
      throw error;
    }
  }

  async listForPost(
    postId: string,
    ownerId: string,
  ): Promise<ApplicationResponseDto[]> {
    await this.assertPostOwner(postId, ownerId);
    const applications = await this.matchesRepository.find({
      where: { postId },
      order: { createdAt: 'ASC' },
    });
    return applications.map((application) => this.toResponse(application));
  }

  async listMine(applicantId: string): Promise<ApplicationResponseDto[]> {
    const applications = await this.matchesRepository.find({
      where: { applicantId },
      order: { createdAt: 'DESC' },
    });
    return applications.map((application) => this.toResponse(application));
  }

  async decide(
    postId: string,
    applicationId: string,
    ownerId: string,
    dto: DecideApplicationDto,
  ): Promise<ApplicationDecisionResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      const application = await manager
        .getRepository(PostMatchEntity)
        .createQueryBuilder('application')
        .setLock('pessimistic_write')
        .where('application.id = :applicationId', { applicationId })
        .andWhere('application.postId = :postId', { postId })
        .getOne();
      if (!application) {
        throw new NotFoundException('Application not found');
      }

      const post = await manager
        .getRepository(PostEntity)
        .createQueryBuilder('post')
        .setLock('pessimistic_write')
        .where('post.id = :postId', { postId })
        .getOne();
      if (!post || post.userId !== ownerId) {
        throw new NotFoundException('Post not found');
      }
      if (application.status !== MatchStatus.PENDING) {
        throw new ConflictException('Application has already been decided');
      }

      if (dto.decision === MatchStatus.REJECTED) {
        application.status = MatchStatus.REJECTED;
        const saved = await manager
          .getRepository(PostMatchEntity)
          .save(application);
        return this.toDecisionResponse(saved, post);
      }

      if (
        post.status !== PostStatus.OPEN ||
        post.acceptedPlayers >= post.playersNeeded
      ) {
        throw new ConflictException('Post has reached its player limit');
      }

      const conversation = await manager
        .getRepository(ConversationEntity)
        .save(
          manager.getRepository(ConversationEntity).create({
            type: ConversationType.DIRECT,
            relatedPostId: post.id,
            relatedFieldId: null,
            deletedBySender: null,
            deletedByReceiver: null,
          }),
        );
      await manager.getRepository(ConversationMemberEntity).save([
        manager.getRepository(ConversationMemberEntity).create({
          conversationId: conversation.id,
          userId: ownerId,
        }),
        manager.getRepository(ConversationMemberEntity).create({
          conversationId: conversation.id,
          userId: application.applicantId,
        }),
      ]);

      application.status = MatchStatus.ACCEPTED;
      application.conversationId = conversation.id;
      post.acceptedPlayers += 1;
      if (post.acceptedPlayers >= post.playersNeeded) {
        post.status = PostStatus.MATCHED;
      }

      await manager.getRepository(PostEntity).save(post);
      const saved = await manager
        .getRepository(PostMatchEntity)
        .save(application);
      return this.toDecisionResponse(saved, post);
    });
  }

  private async assertPostOwner(postId: string, ownerId: string): Promise<void> {
    const post = await this.postsRepository.findOne({
      where: { id: postId, userId: ownerId },
    });
    if (!post) throw new NotFoundException('Post not found');
  }

  private toResponse(application: PostMatchEntity): ApplicationResponseDto {
    return {
      id: application.id,
      postId: application.postId,
      applicantId: application.applicantId,
      status: application.status,
      conversationId: application.conversationId,
      createdAt: application.createdAt,
      updatedAt: application.updatedAt,
    };
  }

  private toDecisionResponse(
    application: PostMatchEntity,
    post: PostEntity,
  ): ApplicationDecisionResponseDto {
    return {
      ...this.toResponse(application),
      playersNeeded: post.playersNeeded,
      acceptedPlayers: post.acceptedPlayers,
    };
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: string }).code === '23505'
    );
  }
}
