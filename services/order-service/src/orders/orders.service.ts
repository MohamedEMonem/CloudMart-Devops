import { Injectable, Inject, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderCreatedEvent, PaymentFailedEvent, PaymentCompletedEvent } from '../events/order-created.event';
import { RealtimePublisher } from '../realtime/realtime-publisher.service';

// Valid state transitions for the order state machine
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING:   [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  CONFIRMED: [OrderStatus.PAID,      OrderStatus.CANCELLED],
  PAID:      [OrderStatus.SHIPPED,   OrderStatus.CANCELLED],
  SHIPPED:   [OrderStatus.DELIVERED],
  DELIVERED: [],
  CANCELLED: [],
};

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject('RABBITMQ_SERVICE') private readonly rmqClient: ClientProxy,
    private readonly realtimePublisher: RealtimePublisher,
  ) {}

  // ──────────────────────────────────────────────────────
  // CREATE ORDER + TRANSACTIONAL OUTBOX
  //
  // The dual-write problem:
  //   tx.order.create()    → succeeds
  //   rmqClient.emit()     → fails (RMQ down, network error)
  //   Result: order exists but no event → Inventory never reserves stock
  //
  // Solution: write the event to an OutboxMessage table inside
  // the SAME Prisma $transaction. A background relay (see
  // outbox-relay.service.ts) polls for PENDING outbox rows
  // and publishes them to RabbitMQ. If the app crashes after
  // the DB commit, the relay picks up the unsent row later.
  // ──────────────────────────────────────────────────────
  async create(dto: CreateOrderDto) {
    const totalAmount = dto.items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );

    const vendorSplitMap = new Map<string, number>();
    for (const item of dto.items) {
      const lineTotal = item.unitPrice * item.quantity;
      vendorSplitMap.set(
        item.vendorId,
        (vendorSplitMap.get(item.vendorId) ?? 0) + lineTotal,
      );
    }

    const DEFAULT_COMMISSION = 0.10;

    // ── Atomic transaction: Order + Items + Splits + Outbox ──
    const { order, outboxEvent } = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          userId:          dto.userId,
          totalAmount,
          shippingAddress: dto.shippingAddress,
          items: {
            create: dto.items.map((item) => ({
              vendorId:    item.vendorId,
              productId:   item.productId,
              productName: item.productName,
              quantity:    item.quantity,
              unitPrice:   item.unitPrice,
            })),
          },
          vendorSplits: {
            create: Array.from(vendorSplitMap.entries()).map(([vendorId, subtotal]) => {
              const commissionAmount = subtotal * DEFAULT_COMMISSION;
              return {
                vendorId,
                subtotal,
                commissionRate:   DEFAULT_COMMISSION,
                commissionAmount,
                vendorPayout:     subtotal - commissionAmount,
                status:           'PENDING',
              };
            }),
          },
        },
        include: { items: true, vendorSplits: true },
      });

      // Build the event payload
      const eventPayload: OrderCreatedEvent = {
        orderId:      order.id,
        userId:       order.userId,
        totalAmount:  Number(order.totalAmount),
        items: order.items.map((i) => ({
          productId:   i.productId,
          vendorId:    i.vendorId,
          productName: i.productName,
          quantity:    i.quantity,
          unitPrice:   Number(i.unitPrice),
        })),
        vendorSplits: order.vendorSplits.map((s) => ({
          vendorId:         s.vendorId,
          subtotal:         Number(s.subtotal),
          commissionAmount: Number(s.commissionAmount),
          vendorPayout:     Number(s.vendorPayout),
        })),
        createdAt: order.createdAt.toISOString(),
      };

      // ── Write to outbox (same transaction!) ──────────────
      const outboxEvent = await tx.outboxMessage.create({
        data: {
          eventType: 'order.created',
          payload:   eventPayload as any,
          status:    'PENDING',
        },
      });

      return { order, outboxEvent };
    });

    // ── Best-effort immediate publish ──────────────────────
    // If RMQ is available, publish right away and mark as SENT.
    // If this fails, the relay will pick it up later — no data loss.
    try {
      this.rmqClient.emit('order.created', outboxEvent.payload);
      await this.prisma.outboxMessage.update({
        where: { id: outboxEvent.id },
        data:  { status: 'SENT', processedAt: new Date() },
      });
      this.logger.log(`order.created emitted immediately for order ${order.id}`);
    } catch (error) {
      this.logger.warn(`Immediate emit failed for order ${order.id} — relay will handle it`);
    }

    return order;
  }

  // ──────────────────────────────────────────────────────
  // SAGA COMPENSATION: Handle payment.failed
  // Transitions the order to CANCELLED when payment fails.
  // ──────────────────────────────────────────────────────
  async handlePaymentFailed(event: PaymentFailedEvent) {
    this.logger.warn(`[Saga] Cancelling order ${event.orderId} — reason: ${event.reason}`);

    const order = await this.prisma.order.findUnique({ where: { id: event.orderId } });
    if (!order) {
      this.logger.error(`[Saga] Order ${event.orderId} not found for cancellation`);
      return;
    }

    // Only cancel if still in a cancellable state
    if (order.status === OrderStatus.CANCELLED) {
      this.logger.log(`[Saga] Order ${event.orderId} already cancelled — skipping`);
      return;
    }

    await this.prisma.order.update({
      where: { id: event.orderId },
      data:  { status: OrderStatus.CANCELLED },
    });

    // Push real-time update to frontend via WebSocket
    this.realtimePublisher.publishOrderStatusUpdate({
      orderId:        event.orderId,
      userId:         order.userId,
      previousStatus: order.status,
      status:         'CANCELLED',
      updatedAt:      new Date().toISOString(),
    });

    this.logger.log(`[Saga] Order ${event.orderId} transitioned to CANCELLED`);
  }

  // ──────────────────────────────────────────────────────
  // SAGA SUCCESS: Handle payment.completed
  // Transitions the order to CONFIRMED when payment succeeds.
  // ──────────────────────────────────────────────────────
  async handlePaymentCompleted(event: PaymentCompletedEvent) {
    this.logger.log(`[Saga] Confirming order ${event.orderId} — payment: ${event.paymentId}`);

    const order = await this.prisma.order.findUnique({ where: { id: event.orderId } });
    const previousStatus = order?.status || 'PENDING';

    await this.prisma.order.update({
      where: { id: event.orderId },
      data:  { status: OrderStatus.CONFIRMED },
    });

    this.realtimePublisher.publishOrderStatusUpdate({
      orderId:        event.orderId,
      userId:         event.userId,
      previousStatus,
      status:         'CONFIRMED',
      updatedAt:      new Date().toISOString(),
    });

    this.logger.log(`[Saga] Order ${event.orderId} transitioned to CONFIRMED`);
  }

  // ── Existing methods (unchanged) ─────────────────────

  async findById(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true, vendorSplits: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async findByUser(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByVendor(vendorId: string) {
    return this.prisma.orderItem.findMany({
      where: { vendorId },
      include: {
        order: {
          select: {
            id: true, status: true, totalAmount: true,
            shippingAddress: true, createdAt: true,
          },
        },
      },
      orderBy: { orderId: 'desc' },
    });
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');

    const nextStatus = dto.status as OrderStatus;
    const allowed    = VALID_TRANSITIONS[order.status];

    if (!allowed.includes(nextStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${order.status} to ${nextStatus}. ` +
        `Allowed transitions: ${allowed.length ? allowed.join(', ') : 'none'}`,
      );
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data:  { status: nextStatus },
    });

    // Push real-time update to frontend via WebSocket
    this.realtimePublisher.publishOrderStatusUpdate({
      orderId:        id,
      userId:         order.userId,
      previousStatus: order.status,
      status:         nextStatus,
      updatedAt:      updated.updatedAt.toISOString(),
    });

    return updated;
  }
}
