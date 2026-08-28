import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import { CourtStatus } from '../../../constants/enums/database.enums';
import { BaseRepository } from '../../../core/base/base.repository';
import { FieldCourtEntity } from '../entities/field.entity';

@Injectable()
export class FieldCourtRepository extends BaseRepository<FieldCourtEntity> {
  constructor(
    @InjectRepository(FieldCourtEntity)
    repository: Repository<FieldCourtEntity>,
  ) {
    super(repository);
  }

  findByFieldId(fieldId: string): Promise<FieldCourtEntity[]> {
    return this.repo.find({ where: { fieldId }, order: { name: 'ASC' } });
  }

  findActiveByFieldId(fieldId: string): Promise<FieldCourtEntity[]> {
    return this.repo.find({
      where: { fieldId, status: CourtStatus.ACTIVE },
      order: { name: 'ASC' },
    });
  }

  findByFieldIds(fieldIds: string[]): Promise<FieldCourtEntity[]> {
    return this.repo.find({ where: { fieldId: In(fieldIds) } });
  }

  findActiveByFieldIdInTransaction(
    manager: EntityManager,
    fieldId: string,
  ): Promise<FieldCourtEntity[]> {
    return manager.getRepository(FieldCourtEntity).find({
      where: { fieldId, status: CourtStatus.ACTIVE },
      order: { name: 'ASC' },
    });
  }

  findActiveByIdAndFieldIdWithLock(
    manager: EntityManager,
    id: string,
    fieldId: string,
  ): Promise<FieldCourtEntity | null> {
    return manager
      .getRepository(FieldCourtEntity)
      .createQueryBuilder('court')
      .setLock('pessimistic_write')
      .where('court.id = :id', { id })
      .andWhere('court.fieldId = :fieldId', { fieldId })
      .andWhere('court.status = :status', { status: CourtStatus.ACTIVE })
      .getOne();
  }
}
