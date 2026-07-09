/**
 * Unit Tests — Order Service: OrdersService
 *
 * Tests order creation, state machine transitions,
 * and saga event handling (payment.failed, payment.completed).
 */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { OrdersService } from '../../../services/order-service/src/orders/orders.service';
import { PrismaService } from '../../../services/order-service/src/common/prisma/prisma.service';
import { RealtimePublisher } from '../../../services/order-service/src/realtime/realtime-publisher.service';
import { OrderStatus } from '../../../services/order-service/src/orders/dto/update-order-status.dto';

const mockPrismaService = {
  order: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  orderItem: {
    findMany: jest.fn(),
  },
  outboxMessage: {
    create: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn(),
};

const mockRmqClient = {
  emit: jest.fn(),
};

const mockRealtimePublisher = {
  publishOrderStatusUpdate: jest.fn(),
};

describe('OrdersService', () => {
  let service: OrdersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: 'RABBITMQ_SERVICE', useValue: mockRmqClient },
        { provide: RealtimePublisher, useValue: mockRealtimePublisher },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    jest.clearAllMocks();
  });

  // ── findById ──────────────────────────────────────────

  describe('findById', () => {
    it('should return the order with items and vendor splits', async () => {
      const mockOrder = {
        id: 'order-1',
        userId: 'user-1',
        status: 'PENDING',
        totalAmount: 100,
        items: [{ productId: 'p1', quantity: 2 }],
        vendorSplits: [{ vendorId: 'v1', subtotal: 100 }],
      };
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);

      const result = await service.findById('order-1');

      expect(result).toEqual(mockOrder);
      expect(mockPrismaService.order.findUnique).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        include: { items: true, vendorSplits: true },
      });
    });

    it('should throw NotFoundException when order does not exist', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ── findByUser ────────────────────────────────────────

  describe('findByUser', () => {
    it('should return all orders for a user sorted by date desc', async () => {
      const mockOrders = [
        { id: 'order-2', status: 'CONFIRMED' },
        { id: 'order-1', status: 'PENDING' },
      ];
      mockPrismaService.order.findMany.mockResolvedValue(mockOrders);

      const result = await service.findByUser('user-1');

      expect(result).toEqual(mockOrders);
      expect(mockPrismaService.order.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  // ── updateStatus (State Machine) ──────────────────────

  describe('updateStatus', () => {
    it('should transition PENDING → CONFIRMED', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue({
        id: 'order-1',
        userId: 'user-1',
        status: 'PENDING',
      });
      mockPrismaService.order.update.mockResolvedValue({
        id: 'order-1',
        status: 'CONFIRMED',
        updatedAt: new Date(),
      });

      const result = await service.updateStatus('order-1', { status: OrderStatus.CONFIRMED });

      expect(result.status).toBe('CONFIRMED');
      expect(mockRealtimePublisher.publishOrderStatusUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: 'order-1',
          previousStatus: 'PENDING',
          status: 'CONFIRMED',
        }),
      );
    });

    it('should transition PENDING → CANCELLED', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue({
        id: 'order-1',
        userId: 'user-1',
        status: 'PENDING',
      });
      mockPrismaService.order.update.mockResolvedValue({
        id: 'order-1',
        status: 'CANCELLED',
        updatedAt: new Date(),
      });

      const result = await service.updateStatus('order-1', { status: OrderStatus.CANCELLED });

      expect(result.status).toBe('CANCELLED');
    });

    it('should reject DELIVERED → PENDING (invalid transition)', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue({
        id: 'order-1',
        userId: 'user-1',
        status: 'DELIVERED',
      });

      await expect(
        service.updateStatus('order-1', { status: OrderStatus.PENDING }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject CANCELLED → CONFIRMED (terminal state)', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue({
        id: 'order-1',
        userId: 'user-1',
        status: 'CANCELLED',
      });

      await expect(
        service.updateStatus('order-1', { status: OrderStatus.CONFIRMED }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException for non-existent order', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);

      await expect(
        service.updateStatus('nonexistent', { status: OrderStatus.CONFIRMED }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── Saga: handlePaymentFailed ─────────────────────────

  describe('handlePaymentFailed', () => {
    it('should cancel the order and publish WebSocket update', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue({
        id: 'order-1',
        userId: 'user-1',
        status: 'PENDING',
      });
      mockPrismaService.order.update.mockResolvedValue({});

      await service.handlePaymentFailed({
        orderId: 'order-1',
        userId: 'user-1',
        reason: 'Card declined',
        failedAt: new Date().toISOString(),
        items: [],
      });

      expect(mockPrismaService.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: { status: 'CANCELLED' },
      });
      expect(mockRealtimePublisher.publishOrderStatusUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: 'order-1',
          status: 'CANCELLED',
        }),
      );
    });

    it('should skip cancellation if order is already cancelled', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue({
        id: 'order-1',
        userId: 'user-1',
        status: 'CANCELLED',
      });

      await service.handlePaymentFailed({
        orderId: 'order-1',
        userId: 'user-1',
        reason: 'Card declined',
        failedAt: new Date().toISOString(),
        items: [],
      });

      expect(mockPrismaService.order.update).not.toHaveBeenCalled();
    });
  });

  // ── Saga: handlePaymentCompleted ──────────────────────

  describe('handlePaymentCompleted', () => {
    it('should confirm the order and publish WebSocket update', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue({
        id: 'order-1',
        userId: 'user-1',
        status: 'PENDING',
      });
      mockPrismaService.order.update.mockResolvedValue({});

      await service.handlePaymentCompleted({
        orderId: 'order-1',
        userId: 'user-1',
        paymentId: 'pay-1',
        gatewayTransactionId: 'txn-1',
        amount: 100,
        completedAt: new Date().toISOString(),
      });

      expect(mockPrismaService.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: { status: 'CONFIRMED' },
      });
      expect(mockRealtimePublisher.publishOrderStatusUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: 'order-1',
          status: 'CONFIRMED',
        }),
      );
    });
  });
});
