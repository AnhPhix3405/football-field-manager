import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  BookingEntity,
  BookingStatus,
  CourtStatus,
  FieldCourtEntity,
  FieldEntity,
  FieldImageEntity,
  FieldPricingEntity,
  FieldServiceEntity,
  FieldStatus,
} from '../../database/entities';
import { AvailabilityQueryDto } from './dto/availability-query.dto';
import {
  FieldAvailabilityResponseDto,
  FieldDetailResponseDto,
  FieldSummaryResponseDto,
  PaginatedFieldsResponseDto,
} from './dto/field-response.dto';
import { SearchFieldsQueryDto } from './dto/search-fields-query.dto';

const EARTH_RADIUS_KM = 6371;

@Injectable()
export class FieldsService {
  constructor(
    @InjectRepository(FieldEntity)
    private readonly fieldsRepository: Repository<FieldEntity>,
    @InjectRepository(FieldCourtEntity)
    private readonly courtsRepository: Repository<FieldCourtEntity>,
    @InjectRepository(FieldImageEntity)
    private readonly imagesRepository: Repository<FieldImageEntity>,
    @InjectRepository(FieldServiceEntity)
    private readonly servicesRepository: Repository<FieldServiceEntity>,
    @InjectRepository(FieldPricingEntity)
    private readonly pricingRepository: Repository<FieldPricingEntity>,
    @InjectRepository(BookingEntity)
    private readonly bookingsRepository: Repository<BookingEntity>,
  ) {}

  async search(query: SearchFieldsQueryDto): Promise<PaginatedFieldsResponseDto> {
    this.validateSearchQuery(query);
    const hasCoordinates = query.latitude !== undefined;
    const serviceNames = [
      ...new Set((query.services ?? []).map((name) => name.toLowerCase())),
    ];
    const qb = this.fieldsRepository
      .createQueryBuilder('field')
      .where('field.status = :status', { status: FieldStatus.ACTIVE });

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      const priceConditions = ['fp.field_id = field.id'];
      if (query.minPrice !== undefined) {
        priceConditions.push('CAST(fp.price AS numeric) >= :minPrice');
        qb.setParameter('minPrice', query.minPrice);
      }
      if (query.maxPrice !== undefined) {
        priceConditions.push('CAST(fp.price AS numeric) <= :maxPrice');
        qb.setParameter('maxPrice', query.maxPrice);
      }
      qb.andWhere(
        `EXISTS (SELECT 1 FROM field_pricing fp WHERE ${priceConditions.join(' AND ')})`,
      );
    }
    if (serviceNames.length > 0) {
      qb.andWhere(
        `(SELECT COUNT(DISTINCT LOWER(fs.name)) FROM field_services fs
          WHERE fs.field_id = field.id AND LOWER(fs.name) IN (:...serviceNames)) = :serviceCount`,
        { serviceNames, serviceCount: serviceNames.length },
      );
    }

    if (hasCoordinates) {
      const distanceSql = this.distanceSql();
      qb.andWhere('field.lat IS NOT NULL AND field.lng IS NOT NULL')
        .addSelect(distanceSql, 'distance_km')
        .andWhere(`${distanceSql} <= :radiusKm`)
        .setParameters({
          latitude: query.latitude,
          longitude: query.longitude,
          radiusKm: query.radiusKm ?? 10,
        })
        .orderBy('distance_km', 'ASC');
    } else {
      qb.orderBy('field.updatedAt', 'DESC');
    }

    const total = await qb.getCount();
    const { entities, raw } = await qb
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getRawAndEntities();
    const distanceById = new Map<string, number>();
    raw.forEach((row: Record<string, unknown>) => {
      if (row.field_id && row.distance_km !== undefined) {
        distanceById.set(String(row.field_id), Number(row.distance_km));
      }
    });
    const items = await this.hydrateSummaries(entities, distanceById);

    return {
      items,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    };
  }

  async findOne(id: string): Promise<FieldDetailResponseDto> {
    const field = await this.fieldsRepository.findOne({
      where: { id, status: FieldStatus.ACTIVE },
    });
    if (!field) throw new NotFoundException('Field not found');

    const [courts, images, services, pricing] = await Promise.all([
      this.courtsRepository.find({ where: { fieldId: id }, order: { name: 'ASC' } }),
      this.imagesRepository.find({ where: { fieldId: id } }),
      this.servicesRepository.find({ where: { fieldId: id }, order: { name: 'ASC' } }),
      this.pricingRepository.find({
        where: { fieldId: id },
        order: { dayType: 'ASC', startTime: 'ASC' },
      }),
    ]);
    const thumbnail = images.find((image) => image.isThumbnail) ?? images[0];

    return {
      id: field.id,
      ownerId: field.ownerId,
      name: field.name,
      address: field.address,
      district: field.district,
      latitude: field.lat === null ? null : Number(field.lat),
      longitude: field.lng === null ? null : Number(field.lng),
      description: field.description,
      minimumHourlyPrice:
        pricing.length === 0
          ? null
          : Math.min(...pricing.map((item) => Number(item.price))),
      thumbnailUrl: thumbnail?.url ?? null,
      services: services.map((service) => service.name),
      images: images.map((image) => image.url),
      requireDeposit: field.requireDeposit,
      depositType: field.depositType,
      depositValue:
        field.depositValue === null ? null : Number(field.depositValue),
      courts: courts.map((court) => ({
        id: court.id,
        name: court.name,
        type: court.type,
        status: court.status,
      })),
      availableServices: services.map((service) => ({
        id: service.id,
        name: service.name,
        price: Number(service.price),
        unit: service.unit,
      })),
      pricing: pricing.map((item) => ({
        id: item.id,
        dayType: item.dayType,
        startTime: item.startTime,
        endTime: item.endTime,
        price: Number(item.price),
      })),
    };
  }

  async availability(
    fieldId: string,
    query: AvailabilityQueryDto,
  ): Promise<FieldAvailabilityResponseDto> {
    const field = await this.fieldsRepository.findOne({
      where: { id: fieldId, status: FieldStatus.ACTIVE },
    });
    if (!field) throw new NotFoundException('Field not found');
    const hasStart = query.startTime !== undefined;
    const hasEnd = query.endTime !== undefined;
    if (hasStart !== hasEnd) {
      throw new BadRequestException('startTime and endTime must be provided together');
    }
    if (query.startTime && query.endTime && query.startTime >= query.endTime) {
      throw new BadRequestException('startTime must be earlier than endTime');
    }

    const courts = await this.courtsRepository.find({
      where: { fieldId, status: CourtStatus.ACTIVE },
      order: { name: 'ASC' },
    });
    const courtIds = courts.map((court) => court.id);
    const bookings = courtIds.length
      ? await this.bookingsRepository.find({
          where: {
            fieldCourtId: In(courtIds),
            bookingDate: query.date,
            status: In([BookingStatus.PENDING, BookingStatus.CONFIRMED]),
          },
          order: { startTime: 'ASC' },
        })
      : [];

    return {
      fieldId,
      date: query.date,
      courts: courts.map((court) => {
        const occupied = bookings.filter(
          (booking) => booking.fieldCourtId === court.id,
        );
        const requestedAvailability =
          query.startTime && query.endTime
            ? !occupied.some(
                (booking) =>
                  booking.startTime < query.endTime! &&
                  booking.endTime > query.startTime!,
              )
            : undefined;
        return {
          id: court.id,
          name: court.name,
          type: court.type,
          status: court.status,
          ...(requestedAvailability === undefined
            ? {}
            : { isAvailable: requestedAvailability }),
          bookedSlots: occupied.map((booking) => ({
            startTime: booking.startTime,
            endTime: booking.endTime,
          })),
        };
      }),
    };
  }

  private async hydrateSummaries(
    fields: FieldEntity[],
    distanceById: Map<string, number>,
  ): Promise<FieldSummaryResponseDto[]> {
    const ids = fields.map((field) => field.id);
    if (ids.length === 0) return [];
    const [images, services, pricing] = await Promise.all([
      this.imagesRepository.find({ where: { fieldId: In(ids) } }),
      this.servicesRepository.find({ where: { fieldId: In(ids) } }),
      this.pricingRepository.find({ where: { fieldId: In(ids) } }),
    ]);
    return fields.map((field) => {
      const fieldImages = images.filter((image) => image.fieldId === field.id);
      const fieldPricing = pricing.filter((item) => item.fieldId === field.id);
      const thumbnail =
        fieldImages.find((image) => image.isThumbnail) ?? fieldImages[0];
      const distance = distanceById.get(field.id);
      return {
        id: field.id,
        name: field.name,
        address: field.address,
        district: field.district,
        latitude: field.lat === null ? null : Number(field.lat),
        longitude: field.lng === null ? null : Number(field.lng),
        ...(distance === undefined
          ? {}
          : { distanceKm: Number(distance.toFixed(2)) }),
        minimumHourlyPrice:
          fieldPricing.length === 0
            ? null
            : Math.min(...fieldPricing.map((item) => Number(item.price))),
        thumbnailUrl: thumbnail?.url ?? null,
        services: services
          .filter((service) => service.fieldId === field.id)
          .map((service) => service.name),
      };
    });
  }

  private validateSearchQuery(query: SearchFieldsQueryDto): void {
    if ((query.latitude === undefined) !== (query.longitude === undefined)) {
      throw new BadRequestException('latitude and longitude must be provided together');
    }
    if (query.radiusKm !== undefined && query.latitude === undefined) {
      throw new BadRequestException('radiusKm requires latitude and longitude');
    }
    if (
      query.minPrice !== undefined &&
      query.maxPrice !== undefined &&
      query.minPrice > query.maxPrice
    ) {
      throw new BadRequestException('minPrice must not exceed maxPrice');
    }
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
