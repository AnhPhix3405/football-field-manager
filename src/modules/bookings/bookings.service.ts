import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import {
  BookingEntity,
  BookingServiceEntity,
  BookingStatus,
  CourtStatus,
  DayType,
  DepositType,
  FieldCourtEntity,
  FieldEntity,
  FieldPricingEntity,
  FieldServiceEntity,
  FieldStatus,
  PaymentMethod,
  PaymentStatus,
  TransactionEntity,
  TransactionStatus,
  TransactionType,
} from '../../database/entities';
import {
  BookingResponseDto,
  PaymentPlaceholderResponseDto,
} from './dto/booking-response.dto';
import { CreateBookingDto } from './dto/create-booking.dto';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(BookingEntity)
    private readonly bookingsRepository: Repository<BookingEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async create(userId: string, dto: CreateBookingDto): Promise<BookingResponseDto> {
    this.validateBookingTime(dto);
    try {
      return await this.dataSource.transaction('SERIALIZABLE', async (manager) => {
        const field = await manager.getRepository(FieldEntity).findOne({
          where: { id: dto.fieldId, status: FieldStatus.ACTIVE },
        });
        if (!field) throw new NotFoundException('Field not found');

        const court = await manager
          .getRepository(FieldCourtEntity)
          .createQueryBuilder('court')
          .setLock('pessimistic_write')
          .where('court.id = :courtId', { courtId: dto.fieldCourtId })
          .andWhere('court.fieldId = :fieldId', { fieldId: dto.fieldId })
          .andWhere('court.status = :status', { status: CourtStatus.ACTIVE })
          .getOne();
        if (!court) throw new NotFoundException('Active court not found');

        const overlap = await manager
          .getRepository(BookingEntity)
          .createQueryBuilder('booking')
          .where('booking.fieldCourtId = :courtId', { courtId: court.id })
          .andWhere('booking.bookingDate = :bookingDate', {
            bookingDate: dto.bookingDate,
          })
          .andWhere('booking.status IN (:...activeStatuses)', {
            activeStatuses: [BookingStatus.PENDING, BookingStatus.CONFIRMED],
          })
          .andWhere('booking.startTime < :endTime', { endTime: dto.endTime })
          .andWhere('booking.endTime > :startTime', { startTime: dto.startTime })
          .getOne();
        if (overlap) {
          throw new ConflictException('The selected court and time slot are already booked');
        }

        const fieldPrice = await this.calculateFieldPrice(manager, dto);
        const selectedServices = await this.resolveServices(manager, dto);
        const servicesPrice = selectedServices.reduce(
          (total, item) => total + Number(item.priceSnapshot) * item.quantity,
          0,
        );
        const totalPrice = this.roundMoney(fieldPrice + servicesPrice);
        const depositAmount = this.calculateDeposit(field, totalPrice);
        if (depositAmount > 0 && dto.paymentMethod !== PaymentMethod.DEPOSIT_ONLINE) {
          throw new BadRequestException(
            'This field requires an online deposit payment method',
          );
        }

        const booking = await manager.getRepository(BookingEntity).save(
          manager.getRepository(BookingEntity).create({
            userId,
            fieldId: field.id,
            fieldCourtId: court.id,
            bookingDate: dto.bookingDate,
            startTime: dto.startTime,
            endTime: dto.endTime,
            status: BookingStatus.PENDING,
            totalPrice: String(totalPrice),
            paymentMethod: dto.paymentMethod,
            paymentStatus:
              depositAmount > 0 ? PaymentStatus.PENDING : PaymentStatus.NOT_REQUIRED,
            depositAmount: String(depositAmount),
            ownerNote: null,
          }),
        );

        const bookingServices = selectedServices.map((item) =>
          manager.getRepository(BookingServiceEntity).create({
            bookingId: booking.id,
            serviceId: item.serviceId,
            quantity: item.quantity,
            priceSnapshot: item.priceSnapshot,
          }),
        );
        if (bookingServices.length > 0) {
          await manager.getRepository(BookingServiceEntity).save(bookingServices);
        }

        const transaction =
          depositAmount > 0
            ? await manager.getRepository(TransactionEntity).save(
                manager.getRepository(TransactionEntity).create({
                  userId,
                  type: TransactionType.BOOKING_DEPOSIT,
                  refId: booking.id,
                  amount: String(depositAmount),
                  status: TransactionStatus.PENDING,
                  gateway: 'placeholder',
                  gatewayRef: `placeholder:${booking.id}`,
                }),
              )
            : null;
        return this.toResponse(booking, bookingServices, transaction, fieldPrice);
      });
    } catch (error: unknown) {
      if (this.isBookingOverlapViolation(error)) {
        throw new ConflictException('The selected court and time slot are already booked');
      }
      if (this.isSerializationFailure(error)) {
        throw new ConflictException('Booking availability changed; please try again');
      }
      throw error;
    }
  }

  async listMine(userId: string): Promise<BookingResponseDto[]> {
    const bookings = await this.bookingsRepository.find({
      where: { userId },
      order: { bookingDate: 'DESC', startTime: 'DESC' },
    });
    return Promise.all(bookings.map((booking) => this.hydrateResponse(booking)));
  }

  async cancel(id: string, userId: string): Promise<BookingResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      const booking = await manager
        .getRepository(BookingEntity)
        .createQueryBuilder('booking')
        .setLock('pessimistic_write')
        .where('booking.id = :id', { id })
        .andWhere('booking.userId = :userId', { userId })
        .getOne();
      if (!booking) throw new NotFoundException('Booking not found');
      if (![BookingStatus.PENDING, BookingStatus.CONFIRMED].includes(booking.status)) {
        throw new ConflictException('This booking can no longer be cancelled');
      }
      booking.status = BookingStatus.CANCELLED;

      const transaction = await manager.getRepository(TransactionEntity).findOne({
        where: {
          type: TransactionType.BOOKING_DEPOSIT,
          refId: booking.id,
        },
      });
      if (transaction?.status === TransactionStatus.PENDING) {
        transaction.status = TransactionStatus.FAILED;
        booking.paymentStatus = PaymentStatus.NOT_REQUIRED;
        await manager.getRepository(TransactionEntity).save(transaction);
      }
      const saved = await manager.getRepository(BookingEntity).save(booking);
      const services = await manager.getRepository(BookingServiceEntity).find({
        where: { bookingId: booking.id },
      });
      return this.toResponse(saved, services, transaction, this.fieldPrice(saved, services));
    });
  }

  async getPaymentPlaceholder(
    id: string,
    userId: string,
  ): Promise<PaymentPlaceholderResponseDto> {
    const booking = await this.bookingsRepository.findOne({ where: { id, userId } });
    if (!booking) throw new NotFoundException('Booking not found');
    const transaction = await this.dataSource.getRepository(TransactionEntity).findOne({
      where: { type: TransactionType.BOOKING_DEPOSIT, refId: booking.id },
    });
    if (!transaction || transaction.status !== TransactionStatus.PENDING) {
      throw new ConflictException('No pending placeholder payment exists for this booking');
    }
    return this.toPaymentPlaceholder(transaction);
  }

  private async hydrateResponse(booking: BookingEntity): Promise<BookingResponseDto> {
    const [services, transaction] = await Promise.all([
      this.dataSource.getRepository(BookingServiceEntity).find({
        where: { bookingId: booking.id },
      }),
      this.dataSource.getRepository(TransactionEntity).findOne({
        where: { type: TransactionType.BOOKING_DEPOSIT, refId: booking.id },
      }),
    ]);
    return this.toResponse(booking, services, transaction, this.fieldPrice(booking, services));
  }

  private async calculateFieldPrice(
    manager: EntityManager,
    dto: CreateBookingDto,
  ): Promise<number> {
    const dayType = this.dayType(dto.bookingDate);
    const rules = await manager.getRepository(FieldPricingEntity).find({
      where: { fieldId: dto.fieldId, dayType },
      order: { startTime: 'ASC' },
    });
    let cursor = this.toMinutes(dto.startTime);
    const end = this.toMinutes(dto.endTime);
    let price = 0;
    while (cursor < end) {
      const rule = rules.find(
        (item) =>
          this.toMinutes(item.startTime) <= cursor &&
          this.toMinutes(item.endTime) > cursor,
      );
      if (!rule) {
        throw new ConflictException('No pricing rule covers the requested time slot');
      }
      const segmentEnd = Math.min(end, this.toMinutes(rule.endTime));
      price += ((segmentEnd - cursor) / 60) * Number(rule.price);
      cursor = segmentEnd;
    }
    return this.roundMoney(price);
  }

  private async resolveServices(manager: EntityManager, dto: CreateBookingDto) {
    if (dto.services.length === 0) return [];
    const ids = dto.services.map((item) => item.serviceId);
    const services = await manager.getRepository(FieldServiceEntity).find({
      where: { id: In(ids), fieldId: dto.fieldId },
    });
    if (services.length !== ids.length) {
      throw new BadRequestException('One or more services do not belong to the field');
    }
    return dto.services.map((selection) => {
      const service = services.find((item) => item.id === selection.serviceId)!;
      return {
        serviceId: service.id,
        quantity: selection.quantity,
        priceSnapshot: service.price,
      };
    });
  }

  private calculateDeposit(field: FieldEntity, totalPrice: number): number {
    if (!field.requireDeposit) return 0;
    const value = Number(field.depositValue);
    if (!Number.isFinite(value) || value <= 0 || field.depositType === null) {
      throw new ConflictException('The field deposit configuration is invalid');
    }
    if (field.depositType === DepositType.PERCENTAGE) {
      if (value > 100) throw new ConflictException('Deposit percentage exceeds 100');
      return this.roundMoney((totalPrice * value) / 100);
    }
    return this.roundMoney(Math.min(value, totalPrice));
  }

  private toResponse(
    booking: BookingEntity,
    services: BookingServiceEntity[],
    transaction: TransactionEntity | null,
    fieldPrice: number,
  ): BookingResponseDto {
    const serviceItems = services.map((item) => ({
      serviceId: item.serviceId,
      quantity: item.quantity,
      priceSnapshot: Number(item.priceSnapshot),
      subtotal: this.roundMoney(Number(item.priceSnapshot) * item.quantity),
    }));
    return {
      id: booking.id,
      userId: booking.userId,
      fieldId: booking.fieldId,
      fieldCourtId: booking.fieldCourtId!,
      bookingDate: booking.bookingDate,
      startTime: booking.startTime,
      endTime: booking.endTime,
      status: booking.status,
      fieldPrice,
      servicesPrice: this.roundMoney(
        serviceItems.reduce((sum, item) => sum + item.subtotal, 0),
      ),
      totalPrice: Number(booking.totalPrice),
      depositAmount: Number(booking.depositAmount),
      paymentMethod: booking.paymentMethod,
      paymentStatus: booking.paymentStatus,
      services: serviceItems,
      payment:
        transaction?.status === TransactionStatus.PENDING
          ? this.toPaymentPlaceholder(transaction)
          : null,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    };
  }

  private toPaymentPlaceholder(transaction: TransactionEntity): PaymentPlaceholderResponseDto {
    return {
      transactionId: transaction.id,
      gateway: transaction.gateway ?? 'placeholder',
      gatewayReference: transaction.gatewayRef!,
      amount: Number(transaction.amount),
      status: transaction.status,
      paymentUrl: `https://payment.placeholder.local/checkout/${transaction.id}`,
      expiresAt: new Date(transaction.createdAt.getTime() + 15 * 60 * 1000),
    };
  }

  private fieldPrice(booking: BookingEntity, services: BookingServiceEntity[]): number {
    const servicesPrice = services.reduce(
      (sum, item) => sum + Number(item.priceSnapshot) * item.quantity,
      0,
    );
    return this.roundMoney(Number(booking.totalPrice) - servicesPrice);
  }

  private validateBookingTime(dto: CreateBookingDto): void {
    if (dto.startTime >= dto.endTime) {
      throw new BadRequestException('startTime must be earlier than endTime');
    }
    const today = new Date().toISOString().slice(0, 10);
    if (dto.bookingDate < today) {
      throw new BadRequestException('bookingDate must not be in the past');
    }
  }

  private dayType(date: string): DayType {
    const day = new Date(`${date}T00:00:00Z`).getUTCDay();
    return day === 0 || day === 6 ? DayType.WEEKEND : DayType.WEEKDAY;
  }

  private toMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private roundMoney(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  private isBookingOverlapViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: string }).code === '23P01'
    );
  }

  private isSerializationFailure(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: string }).code === '40001'
    );
  }
}
