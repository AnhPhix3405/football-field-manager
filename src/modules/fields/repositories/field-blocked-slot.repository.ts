import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import { BaseRepository } from '../../../core/base/base.repository';
import { FieldBlockedSlotEntity } from '../entities/field.entity';

@Injectable()
export class FieldBlockedSlotRepository extends BaseRepository<FieldBlockedSlotEntity> {
  constructor(
    @InjectRepository(FieldBlockedSlotEntity)
    repository: Repository<FieldBlockedSlotEntity>,
  ) {
    super(repository);
  }

  findByCourtIdsAndDate(
    courtIds: string[],
    blockedDate: string,
  ): Promise<FieldBlockedSlotEntity[]> {
    if (courtIds.length === 0) return Promise.resolve([]);
    return this.repo.find({
      where: { fieldCourtId: In(courtIds), blockedDate },
      order: { startTime: 'ASC' },
    });
  }

  async findOverlappingCourtIds(
    courtIds: string[],
    blockedDate: string,
    startTime: string,
    endTime: string,
    manager?: EntityManager,
  ): Promise<string[]> {
    if (courtIds.length === 0) return [];
    const repository =
      manager?.getRepository(FieldBlockedSlotEntity) ?? this.repo;
    const rows = await repository
      .createQueryBuilder('blockedSlot')
      .select('DISTINCT blockedSlot.fieldCourtId', 'field_court_id')
      .where('blockedSlot.fieldCourtId IN (:...courtIds)', { courtIds })
      .andWhere('blockedSlot.blockedDate = :blockedDate', { blockedDate })
      .andWhere('blockedSlot.startTime < :endTime', { endTime })
      .andWhere('blockedSlot.endTime > :startTime', { startTime })
      .getRawMany<{ field_court_id: string }>();
    return rows.map(({ field_court_id }) => field_court_id);
  }

  async hasOverlap(
    manager: EntityManager,
    fieldCourtId: string,
    blockedDate: string,
    startTime: string,
    endTime: string,
  ): Promise<boolean> {
    const count = await manager
      .getRepository(FieldBlockedSlotEntity)
      .createQueryBuilder('blockedSlot')
      .where('blockedSlot.fieldCourtId = :fieldCourtId', { fieldCourtId })
      .andWhere('blockedSlot.blockedDate = :blockedDate', { blockedDate })
      .andWhere('blockedSlot.startTime < :endTime', { endTime })
      .andWhere('blockedSlot.endTime > :startTime', { startTime })
      .getCount();
    return count > 0;
  }
}
