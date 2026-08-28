import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { FieldStatus } from '../../../constants/enums/database.enums';
import { BaseRepository } from '../../../core/base/base.repository';
import { SearchFieldsQueryDto } from '../dto/search-fields-query.dto';
import { FieldEntity } from '../entities/field.entity';

const EARTH_RADIUS_KM = 6371;

@Injectable()
export class FieldRepository extends BaseRepository<FieldEntity> {
  constructor(
    @InjectRepository(FieldEntity) repository: Repository<FieldEntity>,
  ) {
    super(repository);
  }

  findActiveById(
    id: string,
    manager?: EntityManager,
  ): Promise<FieldEntity | null> {
    const repository = manager?.getRepository(FieldEntity) ?? this.repo;
    return repository.findOne({ where: { id, status: FieldStatus.ACTIVE } });
  }

  findIdsByOwnerId(ownerId: string): Promise<string[]> {
    return this.repo
      .find({ where: { ownerId }, select: { id: true } })
      .then((fields) => fields.map((field) => field.id));
  }

  async searchActive(
    query: SearchFieldsQueryDto,
    serviceNames: string[],
  ): Promise<{
    entities: FieldEntity[];
    distanceById: Map<string, number>;
    total: number;
  }> {
    const hasCoordinates = query.latitude !== undefined;
    const queryBuilder = this.repo
      .createQueryBuilder('field')
      .where('field.status = :status', { status: FieldStatus.ACTIVE });

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      const priceConditions = ['court.field_id = field.id'];
      if (query.minPrice !== undefined) {
        priceConditions.push('CAST(fp.price AS numeric) >= :minPrice');
        queryBuilder.setParameter('minPrice', query.minPrice);
      }
      if (query.maxPrice !== undefined) {
        priceConditions.push('CAST(fp.price AS numeric) <= :maxPrice');
        queryBuilder.setParameter('maxPrice', query.maxPrice);
      }
      queryBuilder.andWhere(
        `EXISTS (
          SELECT 1
          FROM field_pricing fp
          JOIN field_courts court ON court.id = fp.field_court_id
          WHERE ${priceConditions.join(' AND ')}
        )`,
      );
    }
    if (serviceNames.length > 0) {
      queryBuilder.andWhere(
        `(SELECT COUNT(DISTINCT LOWER(fs.name)) FROM field_services fs
          WHERE fs.field_id = field.id AND LOWER(fs.name) IN (:...serviceNames)) = :serviceCount`,
        { serviceNames, serviceCount: serviceNames.length },
      );
    }

    if (hasCoordinates) {
      const distanceSql = this.distanceSql();
      queryBuilder
        .andWhere('field.lat IS NOT NULL AND field.lng IS NOT NULL')
        .addSelect(distanceSql, 'distance_km')
        .andWhere(`${distanceSql} <= :radiusKm`)
        .setParameters({
          latitude: query.latitude,
          longitude: query.longitude,
          radiusKm: query.radiusKm ?? 10,
        })
        .orderBy('distance_km', 'ASC');
    } else {
      queryBuilder.orderBy('field.updatedAt', 'DESC');
    }

    const total = await queryBuilder.getCount();
    const { entities, raw } = await queryBuilder
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getRawAndEntities();
    const distanceById = new Map<string, number>();
    raw.forEach((row: Record<string, unknown>) => {
      const fieldId = row.field_id;
      if (
        (typeof fieldId === 'string' || typeof fieldId === 'number') &&
        row.distance_km !== undefined
      ) {
        distanceById.set(String(fieldId), Number(row.distance_km));
      }
    });

    return { entities, distanceById, total };
  }

  private distanceSql(): string {
    return `${EARTH_RADIUS_KM} * 2 * ASIN(SQRT(LEAST(1.0,
      POWER(SIN(RADIANS(CAST(field.lat AS double precision) - CAST(:latitude AS double precision)) / 2), 2) +
      COS(RADIANS(CAST(:latitude AS double precision))) *
      COS(RADIANS(CAST(field.lat AS double precision))) *
      POWER(SIN(RADIANS(CAST(field.lng AS double precision) - CAST(:longitude AS double precision)) / 2), 2)
    )))`;
  }
}
