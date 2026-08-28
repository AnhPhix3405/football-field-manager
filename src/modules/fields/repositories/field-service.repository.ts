import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import { BaseRepository } from '../../../core/base/base.repository';
import { FieldServiceEntity } from '../entities/field.entity';

@Injectable()
export class FieldServiceRepository extends BaseRepository<FieldServiceEntity> {
  constructor(
    @InjectRepository(FieldServiceEntity)
    repository: Repository<FieldServiceEntity>,
  ) {
    super(repository);
  }

  findActiveByFieldId(fieldId: string): Promise<FieldServiceEntity[]> {
    return this.repo.find({
      where: { fieldId, isActive: true },
      order: { name: 'ASC' },
    });
  }

  findActiveByFieldIds(fieldIds: string[]): Promise<FieldServiceEntity[]> {
    return this.repo.find({ where: { fieldId: In(fieldIds), isActive: true } });
  }

  findActiveByIdsForField(
    manager: EntityManager,
    ids: string[],
    fieldId: string,
  ): Promise<FieldServiceEntity[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return manager.getRepository(FieldServiceEntity).find({
      where: { id: In(ids), fieldId, isActive: true },
    });
  }
}
