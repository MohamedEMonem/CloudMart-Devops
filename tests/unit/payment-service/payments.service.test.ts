/**
 * Unit Tests — Payment Service: PaymentsService
 *
 * Tests payment processing, saga event handling,
 * refund logic, and gateway selection.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PaymentsService } from '../../../services/payment-service/src/payments/payments.service';
import { StripeGateway } from '../../../services/payment-service/src/gateways/stripe.gateway';
import { PaypalGateway } from '../../../services/payment-service/src/gateways/paypal.gateway';

const mockStripeGateway = {
  charge: jest.fn(),
  refund: jest.fn(),
  getStatus: jest.fn(),
};

const mockPaypalGateway = {
  charge: jest.fn(),
  refund: jest.fn(),
  getStatus: jest.fn(),
};

const mockRmqClient = {
  emit: jest.fn(),
};

describe('PaymentsService', () => {
  let service: PaymentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: StripeGateway, useValue: mockStripeGateway },
        { provide: PaypalGateway, useValue: mockPaypalGateway },
        { provide: 'RABBITMQ_SERVICE', useValue: mockRmqClient },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    jest.clearAllMocks();
  });

  // ── processPayment (REST) ─────────────────────────────

  describe('processPayment', () => {
    it('should process payment via Stripe gateway', async () => {
      mockStripeGateway.charge.mockResolvedValue({
        paymentId: 'pay-1',
        status: 'completed',
        gatewayTransactionId: 'txn-stripe-1',
      });

      const result = await service.processPayment({
        orderId: 'order-1',
        amount: 99.99,
        currency: 'USD',
        paymentMethod: 'stripe',
        gatewayToken: 'tok_visa',
      });

      expect(result.paymentId).toBe('pay-1');
      expect(mockStripeGateway.charge).toHaveBeenCalledWith({
        orderId: 'order-1',
        amount: 99.99,
        currency: 'USD',
        token: 'tok_visa',
      });
    });

    it('should process payment via PayPal gateway', async () => {
      mockPaypalGateway.charge.mockResolvedValue({
        paymentId: 'pay-2',
        status: 'completed',
      });

      const result = await service.processPayment({
        orderId: 'order-1',
        amount: 50.00,
        currency: 'USD',
        paymentMethod: 'paypal',
        gatewayToken: 'paypal-token',
      });

      expect(result.paymentId).toBe('pay-2');
      expect(mockPaypalGateway.charge).toHaveBeenCalled();
    });

    it('should throw BadRequestException for unsupported payment method', async () => {
      await expect(
        service.processPayment({
          orderId: 'order-1',
          amount: 50.00,
          currency: 'USD',
          paymentMethod: 'bitcoin',
          gatewayToken: 'btc-token',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── processOrderPayment (Saga) ────────────────────────

  describe('processOrderPayment', () => {
    const orderCreatedEvent = {
      orderId: 'order-1',
      userId: 'user-1',
      totalAmount: 150.00,
      items: [
        { productId: 'p1', vendorId: 'v1', productName: 'Mouse', quantity: 2, unitPrice: 50.00 },
        { productId: 'p2', vendorId: 'v1', productName: 'Pad', quantity: 1, unitPrice: 50.00 },
      ],
      vendorSplits: [],
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    it('should emit payment.completed on successful charge', async () => {
      mockStripeGateway.charge.mockResolvedValue({
        paymentId: 'pay-1',
        gatewayTransactionId: 'txn-1',
      });

      await service.processOrderPayment(orderCreatedEvent);

      expect(mockRmqClient.emit).toHaveBeenCalledWith(
        'payment.completed',
        expect.objectContaining({
          orderId: 'order-1',
          userId: 'user-1',
          paymentId: 'pay-1',
        }),
      );
    });

    it('should emit payment.failed when charge throws an error', async () => {
      mockStripeGateway.charge.mockRejectedValue(new Error('Card declined'));

      await service.processOrderPayment(orderCreatedEvent);

      expect(mockRmqClient.emit).toHaveBeenCalledWith(
        'payment.failed',
        expect.objectContaining({
          orderId: 'order-1',
          reason: 'Card declined',
          items: orderCreatedEvent.items,
        }),
      );
    });

    it('should carry original items in payment.failed for compensation', async () => {
      mockStripeGateway.charge.mockRejectedValue(new Error('Insufficient funds'));

      await service.processOrderPayment(orderCreatedEvent);

      const emittedEvent = mockRmqClient.emit.mock.calls[0][1];
      expect(emittedEvent.items).toHaveLength(2);
      expect(emittedEvent.items[0].productId).toBe('p1');
    });
  });

  // ── refundPayment ─────────────────────────────────────

  describe('refundPayment', () => {
    it('should call stripe gateway refund', async () => {
      mockStripeGateway.refund.mockResolvedValue({ refundId: 'ref-1', status: 'refunded' });

      const result = await service.refundPayment({
        paymentId: 'pay-1',
        amount: 50.00,
        reason: 'Customer request',
      });

      expect(result.refundId).toBe('ref-1');
      expect(mockStripeGateway.refund).toHaveBeenCalledWith({
        paymentId: 'pay-1',
        amount: 50.00,
        reason: 'Customer request',
      });
    });
  });

  // ── getPaymentStatus ──────────────────────────────────

  describe('getPaymentStatus', () => {
    it('should return payment status from gateway', async () => {
      mockStripeGateway.getStatus.mockResolvedValue({ paymentId: 'pay-1', status: 'completed' });

      const result = await service.getPaymentStatus('pay-1');

      expect(result.status).toBe('completed');
    });
  });
});
