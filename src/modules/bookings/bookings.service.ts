import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import {
  BookingStatus,
  DayType,
  DepositType,
  NotificationType,
  PaymentMethod,
  PaymentStatus,
  TransactionStatus,
  TransactionType,
} from '../../constants/enums/database.enums';
import { FieldEntity } from '../fields/entities/field.entity';
import {
  FieldBlockedSlotRepository,
  FieldCourtRepository,
  FieldPricingRepository,
  FieldRepository,
  FieldServiceRepository,
} from '../fields/repositories';
import { NotificationRepository } from '../notifications/repositories';
import { TransactionEntity } from '../subscriptions/entities/subscription.entity';
import { TransactionRepository } from '../subscriptions/repositories';
import {
  BookingResponseDto,
  PaymentPlaceholderResponseDto,
} from './dto/booking-response.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { ApproveBookingDto, RejectBookingDto } from './dto/decide-booking.dto';
import { BookingServiceEntity } from './entities/booking-service.entity';
import { BookingEntity } from './entities/booking.entity';
import { BookingRepository, BookingServiceRepository } from './repositories';

type SelectedService = Pick<
  BookingServiceEntity,
  'serviceId' | 'quantity' | 'priceSnapshot'
>;

@Injectable()
export class BookingsService {
  constructor(
    private readonly bookingRepository: BookingRepository,
    private readonly bookingServiceRepository: BookingServiceRepository,
    private readonly fieldRepository: FieldRepository,
    private readonly blockedSlotRepository: FieldBlockedSlotRepository,
    private readonly courtRepository: FieldCourtRepository,
    private readonly pricingRepository: FieldPricingRepository,
    private readonly fieldServiceRepository: FieldServiceRepository,
    private readonly transactionRepository: TransactionRepository,
    private readonly notificationRepository: NotificationRepository,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    userId: string,
    dto: CreateBookingDto,
  ): Promise<BookingResponseDto> {
    this.validateBookingTime(dto);
    return this.dataSource.transaction('SERIALIZABLE', async (manager) => {
      const field = await this.fieldRepository.findActiveById(
        dto.fieldId,
        manager,
      );
      if (!field) throw new NotFoundException('Field not found');

      const courts =
        await this.courtRepository.findActiveByFieldIdInTransaction(
          manager,
          field.id,
        );
      const courtIds = courts.map((court) => court.id);
      const [bookedCourtIds, blockedCourtIds] = await Promise.all([
        this.bookingRepository.findConfirmedOccupiedCourtIds(
          courtIds,
          dto.bookingDate,
          dto.startTime,
          dto.endTime,
          manager,
        ),
        this.blockedSlotRepository.findOverlappingCourtIds(
          courtIds,
          dto.bookingDate,
          dto.startTime,
          dto.endTime,
          manager,
        ),
      ]);
      const unavailableCourtIds = new Set([
        ...bookedCourtIds,
        ...blockedCourtIds,
      ]);
      const available = courtIds.length - unavailableCourtIds.size;
      if (available === 0) {
        throw new ConflictException('No court is available for this time slot');
      }

      const selections = await this.resolveServices(manager, dto);
      const booking = await this.bookingRepository.createAndSave(manager, {
        userId,
        fieldId: field.id,
        fieldCourtId: null,
        bookingDate: dto.bookingDate,
        startTime: dto.startTime,
        endTime: dto.endTime,
        status: BookingStatus.PENDING,
        totalPrice: String(this.servicesTotal(selections)),
        paymentMethod: dto.paymentMethod,
        paymentStatus: PaymentStatus.UNPAID,
        depositAmount: '0',
        ownerNote: null,
        cancelledBy: null,
        cancelReason: null,
      });
      const services = await this.bookingServiceRepository.createAndSave(
        manager,
        selections.map((item) => ({ ...item, bookingId: booking.id })),
      );
      return this.toResponse(booking, services, null, 0);
    });
  }

  async listMine(userId: string): Promise<BookingResponseDto[]> {
    const bookings = await this.bookingRepository.findMine(userId);
    return Promise.all(
      bookings.map((booking) => this.hydrateResponse(booking)),
    );
  }

  async listOwnerRequests(ownerId: string): Promise<BookingResponseDto[]> {
    const fieldIds = await this.fieldRepository.findIdsByOwnerId(ownerId);
    const bookings =
      await this.bookingRepository.findPendingByFieldIds(fieldIds);
    return Promise.all(
      bookings.map((booking) => this.hydrateResponse(booking)),
    );
  }

  async approve(
    id: string,
    ownerId: string,
    dto: ApproveBookingDto,
  ): Promise<BookingResponseDto> {
    try {
      return await this.dataSource.transaction(
        'SERIALIZABLE',
        async (manager) => {
          const booking = await this.requirePendingBooking(manager, id);
          const field = await this.requireOwnedField(
            manager,
            booking.fieldId,
            ownerId,
          );
          const court =
            await this.courtRepository.findActiveByIdAndFieldIdWithLock(
              manager,
              dto.fieldCourtId,
              field.id,
            );
          if (!court) throw new NotFoundException('Active court not found');
          const [hasBookingOverlap, hasBlockedSlotOverlap] = await Promise.all([
            this.bookingRepository.hasConfirmedOverlap(
              manager,
              court.id,
              booking.bookingDate,
              booking.startTime,
              booking.endTime,
            ),
            this.blockedSlotRepository.hasOverlap(
              manager,
              court.id,
              booking.bookingDate,
              booking.startTime,
              booking.endTime,
            ),
          ]);
          if (hasBookingOverlap || hasBlockedSlotOverlap) {
            throw new ConflictException(
              'The selected court and time slot are already booked',
            );
          }

          const services = await this.bookingServiceRepository.findByBookingId(
            booking.id,
            manager,
          );
          const fieldPrice = await this.calculateFieldPrice(
            manager,
            court.id,
            booking.bookingDate,
            booking.startTime,
            booking.endTime,
          );
          const totalPrice = this.roundMoney(
            fieldPrice + this.servicesTotal(services),
          );
          const depositAmount = this.calculateDeposit(field, totalPrice);
          if (
            depositAmount > 0 &&
            booking.paymentMethod !== PaymentMethod.VNPAY
          ) {
            throw new BadRequestException(
              'This field requires an online deposit payment method',
            );
          }

          Object.assign(booking, {
            fieldCourtId: court.id,
            status: BookingStatus.CONFIRMED,
            totalPrice: String(totalPrice),
            depositAmount: String(depositAmount),
            paymentStatus:
              depositAmount > 0 ? PaymentStatus.PENDING : PaymentStatus.UNPAID,
            ownerNote: dto.note?.trim() || null,
          });
          const saved = await this.bookingRepository.saveInTransaction(
            manager,
            booking,
          );
          const transaction =
            depositAmount > 0
              ? await this.transactionRepository.createAndSave(manager, {
                  userId: booking.userId,
                  type: TransactionType.BOOKING_DEPOSIT,
                  refId: booking.id,
                  amount: String(depositAmount),
                  status: TransactionStatus.PENDING,
                  gateway: 'placeholder',
                  gatewayRef: `placeholder:${booking.id}`,
                })
              : null;
          await this.notify(
            manager,
            booking,
            NotificationType.BOOKING_CONFIRMED,
            {
              title: 'Booking confirmed',
              content: `Your booking was confirmed for court ${court.name}.`,
            },
          );
          return this.toResponse(saved, services, transaction, fieldPrice);
        },
      );
    } catch (error: unknown) {
      if (this.hasPostgresCode(error, '23P01')) {
        throw new ConflictException(
          'The selected court and time slot are already booked',
        );
      }
      if (this.hasPostgresCode(error, '40001')) {
        throw new ConflictException(
          'Booking availability changed; please try again',
        );
      }
      throw error;
    }
  }

  async reject(
    id: string,
    ownerId: string,
    dto: RejectBookingDto,
  ): Promise<BookingResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      const booking = await this.requirePendingBooking(manager, id);
      await this.requireOwnedField(manager, booking.fieldId, ownerId);
      booking.status = BookingStatus.REJECTED;
      booking.ownerNote = dto.reason?.trim() || null;
      const saved = await this.bookingRepository.saveInTransaction(
        manager,
        booking,
      );
      await this.notify(manager, booking, NotificationType.BOOKING_REJECTED, {
        title: 'Booking rejected',
        content: booking.ownerNote ?? 'Your booking request was rejected.',
      });
      const services = await this.bookingServiceRepository.findByBookingId(
        booking.id,
        manager,
      );
      return this.toResponse(saved, services, null, 0);
    });
  }

  async cancel(id: string, userId: string): Promise<BookingResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      const booking = await this.bookingRepository.findByIdWithLock(
        manager,
        id,
      );
      if (!booking || booking.userId !== userId) {
        throw new NotFoundException('Booking not found');
      }
      if (
        ![BookingStatus.PENDING, BookingStatus.CONFIRMED].includes(
          booking.status,
        )
      ) {
        throw new ConflictException('This booking can no longer be cancelled');
      }
      booking.status = BookingStatus.CANCELLED;
      booking.cancelledBy = userId;
      const transaction = await this.transactionRepository.findBookingDeposit(
        booking.id,
        manager,
      );
      if (transaction?.status === TransactionStatus.PENDING) {
        transaction.status = TransactionStatus.FAILED;
        booking.paymentStatus = PaymentStatus.UNPAID;
        await this.transactionRepository.saveInTransaction(
          manager,
          transaction,
        );
      }
      const saved = await this.bookingRepository.saveInTransaction(
        manager,
        booking,
      );
      const services = await this.bookingServiceRepository.findByBookingId(
        booking.id,
        manager,
      );
      return this.toResponse(
        saved,
        services,
        transaction,
        this.fieldPrice(saved, services),
      );
    });
  }

  async getPaymentPlaceholder(
    id: string,
    userId: string,
  ): Promise<PaymentPlaceholderResponseDto> {
    const booking = await this.bookingRepository.findOwnedByUser(id, userId);
    if (!booking) throw new NotFoundException('Booking not found');
    const transaction =
      await this.transactionRepository.findPendingBookingDeposit(booking.id);
    if (!transaction) {
      throw new ConflictException(
        'No pending placeholder payment exists for this booking',
      );
    }
    return this.toPaymentPlaceholder(transaction);
  }

  private async requirePendingBooking(
    manager: EntityManager,
    id: string,
  ): Promise<BookingEntity> {
    const booking = await this.bookingRepository.findByIdWithLock(manager, id);
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status !== BookingStatus.PENDING) {
      throw new ConflictException('Booking has already been decided');
    }
    return booking;
  }

  private async requireOwnedField(
    manager: EntityManager,
    fieldId: string,
    ownerId: string,
  ): Promise<FieldEntity> {
    const field = await this.fieldRepository.findActiveById(fieldId, manager);
    if (!field || field.ownerId !== ownerId) {
      throw new NotFoundException('Booking not found');
    }
    return field;
  }

  private notify(
    manager: EntityManager,
    booking: BookingEntity,
    type: NotificationType,
    message: { title: string; content: string },
  ) {
    return this.notificationRepository.createAndSave(manager, {
      userId: booking.userId,
      type,
      title: message.title,
      content: message.content,
      refId: booking.id,
      isRead: false,
    });
  }

  private async hydrateResponse(
    booking: BookingEntity,
  ): Promise<BookingResponseDto> {
    const [services, transaction] = await Promise.all([
      this.bookingServiceRepository.findByBookingId(booking.id),
      this.transactionRepository.findBookingDeposit(booking.id),
    ]);
    return this.toResponse(
      booking,
      services,
      transaction,
      this.fieldPrice(booking, services),
    );
  }

  private async calculateFieldPrice(
    manager: EntityManager,
    fieldCourtId: string,
    bookingDate: string,
    startTime: string,
    endTime: string,
  ): Promise<number> {
    const rules = await this.pricingRepository.findRulesForCourt(
      manager,
      fieldCourtId,
      this.dayType(bookingDate),
    );
    let cursor = this.toMinutes(startTime);
    const end = this.toMinutes(endTime);
    let price = 0;
    while (cursor < end) {
      const rule = rules.find(
        (item) =>
          this.toMinutes(item.startTime) <= cursor &&
          this.toMinutes(item.endTime) > cursor,
      );
      if (!rule) {
        throw new ConflictException(
          'No pricing rule covers the requested time slot',
        );
      }
      const segmentEnd = Math.min(end, this.toMinutes(rule.endTime));
      price += ((segmentEnd - cursor) / 60) * Number(rule.price);
      cursor = segmentEnd;
    }
    return this.roundMoney(price);
  }

  private async resolveServices(
    manager: EntityManager,
    dto: CreateBookingDto,
  ): Promise<SelectedService[]> {
    if (dto.services.length === 0) return [];
    const services = await this.fieldServiceRepository.findActiveByIdsForField(
      manager,
      dto.services.map((item) => item.serviceId),
      dto.fieldId,
    );
    if (services.length !== dto.services.length) {
      throw new BadRequestException(
        'One or more services do not belong to the field',
      );
    }
    return dto.services.map((selection) => {
      const service = services.find((item) => item.id === selection.serviceId);
      if (!service) throw new BadRequestException('Invalid field service');
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
      if (value > 100)
        throw new ConflictException('Deposit percentage exceeds 100');
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
      fieldCourtId: booking.fieldCourtId,
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
      ownerNote: booking.ownerNote,
      services: serviceItems,
      payment:
        transaction?.status === TransactionStatus.PENDING
          ? this.toPaymentPlaceholder(transaction)
          : null,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    };
  }

  private toPaymentPlaceholder(
    transaction: TransactionEntity,
  ): PaymentPlaceholderResponseDto {
    return {
      transactionId: transaction.id,
      gateway: transaction.gateway ?? 'placeholder',
      gatewayReference:
        transaction.gatewayRef ?? `placeholder:${transaction.id}`,
      amount: Number(transaction.amount),
      status: transaction.status,
      paymentUrl: `https://payment.placeholder.local/checkout/${transaction.id}`,
      expiresAt: new Date(transaction.createdAt.getTime() + 15 * 60 * 1000),
    };
  }

  private fieldPrice(booking: BookingEntity, services: BookingServiceEntity[]) {
    return this.roundMoney(
      Number(booking.totalPrice) - this.servicesTotal(services),
    );
  }

  private servicesTotal(
    services: Array<Pick<BookingServiceEntity, 'priceSnapshot' | 'quantity'>>,
  ) {
    return this.roundMoney(
      services.reduce(
        (sum, item) => sum + Number(item.priceSnapshot) * item.quantity,
        0,
      ),
    );
  }

  private validateBookingTime(dto: CreateBookingDto): void {
    if (dto.startTime >= dto.endTime) {
      throw new BadRequestException('startTime must be earlier than endTime');
    }
    if (dto.bookingDate < new Date().toISOString().slice(0, 10)) {
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

  private hasPostgresCode(error: unknown, code: string): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: string }).code === code
    );
  }
}
