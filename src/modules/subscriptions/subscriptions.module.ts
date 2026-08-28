import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionEntity } from './entities/subscription.entity';
import { TransactionRepository } from './repositories';

@Module({
  imports: [TypeOrmModule.forFeature([TransactionEntity])],
  providers: [TransactionRepository],
  exports: [TransactionRepository],
})
export class SubscriptionsModule {}
