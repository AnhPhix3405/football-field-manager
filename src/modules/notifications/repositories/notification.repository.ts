import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, EntityManager, Repository } from 'typeorm';
import { BaseRepository } from '../../../core/base/base.repository';
import { NotificationEntity } from '../entities/notification.entity';

@Injectable()
export class NotificationRepository extends BaseRepository<NotificationEntity> {
  constructor(
    @InjectRepository(NotificationEntity)
    repository: Repository<NotificationEntity>,
  ) {
    super(repository);
  }

  createAndSave(
    manager: EntityManager,
    data: DeepPartial<NotificationEntity>,
  ): Promise<NotificationEntity> {
    const repository = manager.getRepository(NotificationEntity);
    return repository.save(repository.create(data));
  }
}
