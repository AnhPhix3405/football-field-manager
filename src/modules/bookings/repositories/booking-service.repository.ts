import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, EntityManager, In, Repository } from 'typeorm';
import { BaseRepository } from '../../../core/base/base.repository';
import { BookingServiceEntity } from '../entities/booking-service.entity';

@Injectable()
export class BookingServiceRepository extends BaseRepository<BookingServiceEntity> {
  constructor(
    @InjectRepository(BookingServiceEntity)
    repository: Repository<BookingServiceEntity>,
  ) {
    super(repository);
  }

  createAndSave(
    manager: EntityManager,
    items: DeepPartial<BookingServiceEntity>[],
  ): Promise<BookingServiceEntity[]> {
    if (items.length === 0) return Promise.resolve([]);
    const repository = manager.getRepository(BookingServiceEntity);
    return repository.save(repository.create(items));
  }

  findByBookingId(
    bookingId: string,
    manager?: EntityManager,
  ): Promise<BookingServiceEntity[]> {
    const repository =
      manager?.getRepository(BookingServiceEntity) ?? this.repo;
    return repository.find({ where: { bookingId } });
  }

  findByBookingIds(bookingIds: string[]): Promise<BookingServiceEntity[]> {
    if (bookingIds.length === 0) return Promise.resolve([]);
    return this.repo.find({ where: { bookingId: In(bookingIds) } });
  }
}
