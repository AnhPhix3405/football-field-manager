import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { BaseRepository } from '../../../core/base/base.repository';
import { FieldImageEntity } from '../entities/field.entity';

@Injectable()
export class FieldImageRepository extends BaseRepository<FieldImageEntity> {
  constructor(
    @InjectRepository(FieldImageEntity)
    repository: Repository<FieldImageEntity>,
  ) {
    super(repository);
  }

  findByFieldId(fieldId: string): Promise<FieldImageEntity[]> {
    return this.repo.find({ where: { fieldId } });
  }

  findByFieldIds(fieldIds: string[]): Promise<FieldImageEntity[]> {
    return this.repo.find({ where: { fieldId: In(fieldIds) } });
  }
}
