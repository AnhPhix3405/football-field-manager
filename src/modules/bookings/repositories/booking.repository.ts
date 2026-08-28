import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, EntityManager, In, Repository } from 'typeorm';
import { BookingStatus } from '../../../constants/enums/database.enums';
import { BaseRepository } from '../../../core/base/base.repository';
import { BookingEntity } from '../entities/booking.entity';

@Injectable()
export class BookingRepository extends BaseRepository<BookingEntity> {
  constructor(
    @InjectRepository(BookingEntity) repository: Repository<BookingEntity>,
  ) {
    super(repository);
  }

  findActiveByCourtIdsAndDate(
    courtIds: string[],
    bookingDate: string,
  ): Promise<BookingEntity[]> {
    return this.repo.find({
      where: {
        fieldCourtId: In(courtIds),
        bookingDate,
        status: BookingStatus.CONFIRMED,
      },
      order: { startTime: 'ASC' },
    });
  }

  findMine(userId: string): Promise<BookingEntity[]> {
    return this.repo.find({
      where: { userId },
      order: { bookingDate: 'DESC', startTime: 'DESC' },
    });
  }

  findPendingByFieldIds(fieldIds: string[]): Promise<BookingEntity[]> {
    if (fieldIds.length === 0) return Promise.resolve([]);
    return this.repo.find({
      where: { fieldId: In(fieldIds), status: BookingStatus.PENDING },
      order: { createdAt: 'ASC' },
    });
  }

  findOwnedByUser(id: string, userId: string): Promise<BookingEntity | null> {
    return this.repo.findOne({ where: { id, userId } });
  }

  findByIdWithLock(
    manager: EntityManager,
    id: string,
  ): Promise<BookingEntity | null> {
    return manager
      .getRepository(BookingEntity)
      .createQueryBuilder('booking')
      .setLock('pessimistic_write')
      .where('booking.id = :id', { id })
      .getOne();
  }

  createAndSave(
    manager: EntityManager,
    data: DeepPartial<BookingEntity>,
  ): Promise<BookingEntity> {
    const repository = manager.getRepository(BookingEntity);
    return repository.save(repository.create(data));
  }

  saveInTransaction(
    manager: EntityManager,
    booking: BookingEntity,
  ): Promise<BookingEntity> {
    return manager.getRepository(BookingEntity).save(booking);
  }

  async hasConfirmedOverlap(
    manager: EntityManager,
    fieldCourtId: string,
    bookingDate: string,
    startTime: string,
    endTime: string,
  ): Promise<boolean> {
    const overlap = await manager
      .getRepository(BookingEntity)
      .createQueryBuilder('booking')
      .where('booking.fieldCourtId = :fieldCourtId', { fieldCourtId })
      .andWhere('booking.bookingDate = :bookingDate', { bookingDate })
      .andWhere('booking.status = :status', {
        status: BookingStatus.CONFIRMED,
      })
      .andWhere('booking.startTime < :endTime', { endTime })
      .andWhere('booking.endTime > :startTime', { startTime })
      .getOne();
    return overlap !== null;
  }

  async findConfirmedOccupiedCourtIds(
    courtIds: string[],
    bookingDate: string,
    startTime: string,
    endTime: string,
    manager?: EntityManager,
  ): Promise<string[]> {
    if (courtIds.length === 0) return [];
    const repository = manager?.getRepository(BookingEntity) ?? this.repo;
    const occupiedRows = await repository
      .createQueryBuilder('booking')
      .select('DISTINCT booking.fieldCourtId', 'field_court_id')
      .where('booking.fieldCourtId IN (:...courtIds)', { courtIds })
      .andWhere('booking.bookingDate = :bookingDate', { bookingDate })
      .andWhere('booking.status = :status', {
        status: BookingStatus.CONFIRMED,
      })
      .andWhere('booking.startTime < :endTime', { endTime })
      .andWhere('booking.endTime > :startTime', { startTime })
      .getRawMany<{ field_court_id: string }>();
    return occupiedRows.map(({ field_court_id }) => field_court_id);
  }
}
