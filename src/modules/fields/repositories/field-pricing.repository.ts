import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import { DayType } from '../../../constants/enums/database.enums';
import { BaseRepository } from '../../../core/base/base.repository';
import { FieldPricingEntity } from '../entities/field.entity';

@Injectable()
export class FieldPricingRepository extends BaseRepository<FieldPricingEntity> {
  constructor(
    @InjectRepository(FieldPricingEntity)
    repository: Repository<FieldPricingEntity>,
  ) {
    super(repository);
  }

  findByCourtIds(courtIds: string[]): Promise<FieldPricingEntity[]> {
    return this.repo.find({ where: { fieldCourtId: In(courtIds) } });
  }

  findOrderedByCourtIds(courtIds: string[]): Promise<FieldPricingEntity[]> {
    return this.repo.find({
      where: { fieldCourtId: In(courtIds) },
      order: { dayType: 'ASC', startTime: 'ASC' },
    });
  }

  findRulesForCourt(
    manager: EntityManager,
    fieldCourtId: string,
    dayType: DayType,
  ): Promise<FieldPricingEntity[]> {
    return manager.getRepository(FieldPricingEntity).find({
      where: { fieldCourtId, dayType },
      order: { startTime: 'ASC' },
    });
  }
}
