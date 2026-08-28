import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  FieldBlockedSlotEntity,
  FieldCourtEntity,
  FieldEntity,
  FieldImageEntity,
  FieldPricingEntity,
  FieldServiceEntity,
} from './entities/field.entity';
import { BookingsPersistenceModule } from '../bookings/bookings-persistence.module';
import { FieldsController } from './fields.controller';
import { FieldsService } from './fields.service';
import {
  FieldBlockedSlotRepository,
  FieldCourtRepository,
  FieldImageRepository,
  FieldPricingRepository,
  FieldRepository,
  FieldServiceRepository,
} from './repositories';

@Module({
  imports: [
    BookingsPersistenceModule,
    TypeOrmModule.forFeature([
      FieldEntity,
      FieldBlockedSlotEntity,
      FieldCourtEntity,
      FieldImageEntity,
      FieldServiceEntity,
      FieldPricingEntity,
    ]),
  ],
  controllers: [FieldsController],
  providers: [
    FieldsService,
    FieldBlockedSlotRepository,
    FieldRepository,
    FieldCourtRepository,
    FieldImageRepository,
    FieldServiceRepository,
    FieldPricingRepository,
  ],
  exports: [
    FieldsService,
    FieldBlockedSlotRepository,
    FieldRepository,
    FieldCourtRepository,
    FieldServiceRepository,
    FieldPricingRepository,
  ],
})
export class FieldsModule {}
