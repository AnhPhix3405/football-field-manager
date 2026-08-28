import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, EntityManager, Repository } from 'typeorm';
import {
  TransactionStatus,
  TransactionType,
} from '../../../constants/enums/database.enums';
import { BaseRepository } from '../../../core/base/base.repository';
import { TransactionEntity } from '../entities/subscription.entity';

@Injectable()
export class TransactionRepository extends BaseRepository<TransactionEntity> {
  constructor(
    @InjectRepository(TransactionEntity)
    repository: Repository<TransactionEntity>,
  ) {
    super(repository);
  }

  createAndSave(
    manager: EntityManager,
    data: DeepPartial<TransactionEntity>,
  ): Promise<TransactionEntity> {
    const repository = manager.getRepository(TransactionEntity);
    return repository.save(repository.create(data));
  }

  findBookingDeposit(
    bookingId: string,
    manager?: EntityManager,
  ): Promise<TransactionEntity | null> {
    const repository = manager?.getRepository(TransactionEntity) ?? this.repo;
    return repository.findOne({
      where: { type: TransactionType.BOOKING_DEPOSIT, refId: bookingId },
    });
  }

  findPendingBookingDeposit(
    bookingId: string,
  ): Promise<TransactionEntity | null> {
    return this.repo.findOne({
      where: {
        type: TransactionType.BOOKING_DEPOSIT,
        refId: bookingId,
        status: TransactionStatus.PENDING,
      },
    });
  }

  saveInTransaction(
    manager: EntityManager,
    transaction: TransactionEntity,
  ): Promise<TransactionEntity> {
    return manager.getRepository(TransactionEntity).save(transaction);
  }
}
