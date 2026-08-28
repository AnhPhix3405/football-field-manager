import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { MatchStatus, PostStatus } from '../../constants/enums/database.enums';
import {
  ConversationMemberRepository,
  ConversationRepository,
} from '../chat/repositories';
import { PostEntity } from '../posts/entities/post.entity';
import { PostMatchEntity } from '../posts/entities/post-match.entity';
import { PostMatchRepository, PostRepository } from '../posts/repositories';
import {
  ApplicationDecisionResponseDto,
  ApplicationResponseDto,
} from './dto/application-response.dto';
import { DecideApplicationDto } from './dto/decide-application.dto';

@Injectable()
export class MatchesService {
  constructor(
    private readonly postsRepository: PostRepository,
    private readonly matchesRepository: PostMatchRepository,
    private readonly conversationsRepository: ConversationRepository,
    private readonly membersRepository: ConversationMemberRepository,
    private readonly dataSource: DataSource,
  ) {}

  async apply(
    postId: string,
    applicantId: string,
  ): Promise<ApplicationResponseDto> {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const post = await this.postsRepository.findByIdWithLock(
          manager,
          postId,
          'pessimistic_read',
        );
        if (!post) throw new NotFoundException('Post not found');
        if (post.userId === applicantId) {
          throw new ConflictException('You cannot apply to your own post');
        }
        const acceptedPlayers =
          await this.matchesRepository.countAcceptedByPostId(postId, manager);
        if (
          post.status !== PostStatus.OPEN ||
          acceptedPlayers >= post.maxPlayers
        ) {
          throw new ConflictException(
            'Post is no longer accepting applications',
          );
        }

        const application = this.matchesRepository.createPending(
          manager,
          postId,
          applicantId,
        );
        return this.toResponse(
          await this.matchesRepository.saveInTransaction(manager, application),
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
    const applications = await this.matchesRepository.findByPostId(postId);
    return applications.map((application) => this.toResponse(application));
  }

  async listMine(applicantId: string): Promise<ApplicationResponseDto[]> {
    const applications =
      await this.matchesRepository.findByApplicantId(applicantId);
    return applications.map((application) => this.toResponse(application));
  }

  async decide(
    postId: string,
    applicationId: string,
    ownerId: string,
    dto: DecideApplicationDto,
  ): Promise<ApplicationDecisionResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      const application =
        await this.matchesRepository.findByIdAndPostIdWithWriteLock(
          manager,
          applicationId,
          postId,
        );
      if (!application) {
        throw new NotFoundException('Application not found');
      }

      const post = await this.postsRepository.findByIdWithLock(
        manager,
        postId,
        'pessimistic_write',
      );
      if (!post || post.userId !== ownerId) {
        throw new NotFoundException('Post not found');
      }
      if (application.status !== MatchStatus.PENDING) {
        throw new ConflictException('Application has already been decided');
      }

      if (dto.decision === MatchStatus.REJECTED) {
        application.status = MatchStatus.REJECTED;
        const saved = await this.matchesRepository.saveInTransaction(
          manager,
          application,
        );
        return this.toDecisionResponse(saved, post);
      }

      const acceptedPlayers =
        await this.matchesRepository.countAcceptedByPostId(postId, manager);
      if (
        post.status !== PostStatus.OPEN ||
        acceptedPlayers >= post.maxPlayers
      ) {
        throw new ConflictException('Post has reached its player limit');
      }

      const conversation =
        await this.conversationsRepository.createDirectForPost(
          manager,
          post.id,
        );
      await this.membersRepository.addMembers(manager, conversation.id, [
        ownerId,
        application.applicantId,
      ]);

      application.status = MatchStatus.ACCEPTED;
      application.conversationId = conversation.id;
      if (acceptedPlayers + 1 >= post.maxPlayers) {
        post.status = PostStatus.MATCHED;
      }

      await this.postsRepository.saveInTransaction(manager, post);
      const saved = await this.matchesRepository.saveInTransaction(
        manager,
        application,
      );
      return this.toDecisionResponse(saved, post);
    });
  }

  private async assertPostOwner(
    postId: string,
    ownerId: string,
  ): Promise<void> {
    const post = await this.postsRepository.findOwnedById(postId, ownerId);
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
      maxPlayers: post.maxPlayers,
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
