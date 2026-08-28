import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BOOKING_ENTITIES } from './entities';
import { BookingRepository, BookingServiceRepository } from './repositories';

@Module({
  imports: [TypeOrmModule.forFeature(BOOKING_ENTITIES)],
  providers: [BookingRepository, BookingServiceRepository],
  exports: [BookingRepository, BookingServiceRepository],
})
export class BookingsPersistenceModule {}
