import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FieldEntity } from './entities/field.entity';
import { AvailabilityQueryDto } from './dto/availability-query.dto';
import {
  FieldAvailabilityResponseDto,
  FieldDetailResponseDto,
  FieldSummaryResponseDto,
  PaginatedFieldsResponseDto,
} from './dto/field-response.dto';
import { SearchFieldsQueryDto } from './dto/search-fields-query.dto';
import {
  FieldBlockedSlotRepository,
  FieldCourtRepository,
  FieldImageRepository,
  FieldPricingRepository,
  FieldRepository,
  FieldServiceRepository,
} from './repositories';
import { BookingRepository } from '../bookings/repositories';

@Injectable()
export class FieldsService {
  constructor(
    private readonly fieldsRepository: FieldRepository,
    private readonly blockedSlotsRepository: FieldBlockedSlotRepository,
    private readonly courtsRepository: FieldCourtRepository,
    private readonly imagesRepository: FieldImageRepository,
    private readonly servicesRepository: FieldServiceRepository,
    private readonly pricingRepository: FieldPricingRepository,
    private readonly bookingsRepository: BookingRepository,
  ) {}

  async search(
    query: SearchFieldsQueryDto,
  ): Promise<PaginatedFieldsResponseDto> {
    this.validateSearchQuery(query);
    const serviceNames = [
      ...new Set((query.services ?? []).map((name) => name.toLowerCase())),
    ];
    const { entities, distanceById, total } =
      await this.fieldsRepository.searchActive(query, serviceNames);
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
    const field = await this.fieldsRepository.findActiveById(id);
    if (!field) throw new NotFoundException('Field not found');

    const courts = await this.courtsRepository.findByFieldId(id);
    const [images, services, pricing] = await Promise.all([
      this.imagesRepository.findByFieldId(id),
      this.servicesRepository.findActiveByFieldId(id),
      this.pricingRepository.findOrderedByCourtIds(
        courts.map((court) => court.id),
      ),
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
    const field = await this.fieldsRepository.findActiveById(fieldId);
    if (!field) throw new NotFoundException('Field not found');
    const hasStart = query.startTime !== undefined;
    const hasEnd = query.endTime !== undefined;
    if (hasStart !== hasEnd) {
      throw new BadRequestException(
        'startTime and endTime must be provided together',
      );
    }
    if (query.startTime && query.endTime && query.startTime >= query.endTime) {
      throw new BadRequestException('startTime must be earlier than endTime');
    }

    const courts = await this.courtsRepository.findActiveByFieldId(fieldId);
    const courtIds = courts.map((court) => court.id);
    const [bookings, blockedSlots] = courtIds.length
      ? await Promise.all([
          this.bookingsRepository.findActiveByCourtIdsAndDate(
            courtIds,
            query.date,
          ),
          this.blockedSlotsRepository.findByCourtIdsAndDate(
            courtIds,
            query.date,
          ),
        ])
      : [[], []];

    const requestedCourts = courts.map((court) => {
      const occupied = bookings.filter(
        (booking) => booking.fieldCourtId === court.id,
      );
      const blocked = blockedSlots.filter(
        (slot) => slot.fieldCourtId === court.id,
      );
      const requestedAvailability =
        query.startTime && query.endTime
          ? ![...occupied, ...blocked].some(
              (slot) =>
                slot.startTime < query.endTime! &&
                slot.endTime > query.startTime!,
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
        bookedSlots: [...occupied, ...blocked].map((slot) => ({
          startTime: slot.startTime,
          endTime: slot.endTime,
        })),
      };
    });

    return {
      fieldId,
      date: query.date,
      ...(query.startTime && query.endTime
        ? {
            availableCourtCount: requestedCourts.filter(
              (court) => court.isAvailable,
            ).length,
          }
        : {}),
      courts: requestedCourts,
    };
  }

  private async hydrateSummaries(
    fields: FieldEntity[],
    distanceById: Map<string, number>,
  ): Promise<FieldSummaryResponseDto[]> {
    const ids = fields.map((field) => field.id);
    if (ids.length === 0) return [];
    const [images, services, courts] = await Promise.all([
      this.imagesRepository.findByFieldIds(ids),
      this.servicesRepository.findActiveByFieldIds(ids),
      this.courtsRepository.findByFieldIds(ids),
    ]);
    const courtIds = courts.map((court) => court.id);
    const pricing = courtIds.length
      ? await this.pricingRepository.findByCourtIds(courtIds)
      : [];
    const courtToFieldId = new Map(
      courts.map((court) => [court.id, court.fieldId]),
    );
    return fields.map((field) => {
      const fieldImages = images.filter((image) => image.fieldId === field.id);
      const fieldPricing = pricing.filter(
        (item) => courtToFieldId.get(item.fieldCourtId) === field.id,
      );
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
      throw new BadRequestException(
        'latitude and longitude must be provided together',
      );
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
}
