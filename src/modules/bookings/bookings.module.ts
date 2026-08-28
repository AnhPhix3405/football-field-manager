import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FieldsModule } from '../fields/fields.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { BookingsController } from './bookings.controller';
import { BookingsPersistenceModule } from './bookings-persistence.module';
import { BookingsService } from './bookings.service';

@Module({
  imports: [
    AuthModule,
    BookingsPersistenceModule,
    FieldsModule,
    SubscriptionsModule,
    NotificationsModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
