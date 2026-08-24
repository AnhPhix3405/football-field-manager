import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  BookingEntity,
  FieldCourtEntity,
  FieldEntity,
  FieldImageEntity,
  FieldPricingEntity,
  FieldServiceEntity,
} from '../../database/entities';
import { FieldsController } from './fields.controller';
import { FieldsService } from './fields.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FieldEntity,
      FieldCourtEntity,
      FieldImageEntity,
      FieldServiceEntity,
      FieldPricingEntity,
      BookingEntity,
    ]),
  ],
  controllers: [FieldsController],
  providers: [FieldsService],
  exports: [FieldsService],
})
export class FieldsModule {}
