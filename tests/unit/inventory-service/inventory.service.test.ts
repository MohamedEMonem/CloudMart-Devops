/**
 * Unit Tests — Inventory Service: InventoryService
 *
 * Tests stock retrieval, reservation, and release logic
 * by mocking PrismaService with transaction support.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { InventoryService } from '../../../services/inventory-service/src/inventory/inventory.service';
import { PrismaService } from '../../../services/inventory-service/src/common/prisma/prisma.service';

const mockTx = {
  inventoryItem: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  stockMovement: {
    create: jest.fn(),
  },
};

const mockPrismaService = {
  inventoryItem: {
    findUnique: jest.fn(),
  },
  $transaction: jest.fn((fn: (tx: any) => Promise<any>) => fn(mockTx)),
};

describe('InventoryService', () => {
  let service: InventoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    jest.clearAllMocks();
    // Re-assign $transaction after clearAllMocks
    mockPrismaService.$transaction.mockImplementation((fn: any) => fn(mockTx));
  });

  // ── getStock ──────────────────────────────────────────

  describe('getStock', () => {
    it('should return inventory item when found', async () => {
      const mockItem = { id: 'inv-1', productId: 'p1', quantityAvailable: 100, quantityReserved: 5 };
      mockPrismaService.inventoryItem.findUnique.mockResolvedValue(mockItem);

      const result = await service.getStock('p1');

      expect(result).toEqual(mockItem);
      expect(mockPrismaService.inventoryItem.findUnique).toHaveBeenCalledWith({
        where: { productId: 'p1' },
      });
    });

    it('should throw NotFoundException when inventory item does not exist', async () => {
      mockPrismaService.inventoryItem.findUnique.mockResolvedValue(null);

      await expect(service.getStock('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ── reserveStock ──────────────────────────────────────

  describe('reserveStock', () => {
    const reserveDto = { productId: 'p1', quantity: 5, referenceId: 'order-123' };

    it('should reserve stock successfully when sufficient stock is available', async () => {
      mockTx.inventoryItem.findUnique.mockResolvedValue({
        id: 'inv-1',
        productId: 'p1',
        quantityAvailable: 100,
        quantityReserved: 0,
      });
      mockTx.inventoryItem.update.mockResolvedValue({
        quantityAvailable: 95,
        quantityReserved: 5,
      });
      mockTx.stockMovement.create.mockResolvedValue({});

      const result = await service.reserveStock(reserveDto);

      expect(result).toEqual({ success: true, quantityAvailable: 95, quantityReserved: 5 });
      expect(mockTx.inventoryItem.update).toHaveBeenCalledWith({
        where: { productId: 'p1' },
        data: {
          quantityAvailable: { decrement: 5 },
          quantityReserved: { increment: 5 },
        },
      });
      expect(mockTx.stockMovement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          quantityChange: -5,
          movementType: 'RESERVATION',
          referenceId: 'order-123',
        }),
      });
    });

    it('should throw BadRequestException when stock is insufficient', async () => {
      mockTx.inventoryItem.findUnique.mockResolvedValue({
        id: 'inv-1',
        productId: 'p1',
        quantityAvailable: 3,
        quantityReserved: 0,
      });

      await expect(service.reserveStock(reserveDto)).rejects.toThrow(BadRequestException);
      expect(mockTx.inventoryItem.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when inventory item does not exist', async () => {
      mockTx.inventoryItem.findUnique.mockResolvedValue(null);

      await expect(service.reserveStock(reserveDto)).rejects.toThrow(NotFoundException);
    });
  });

  // ── releaseStock ──────────────────────────────────────

  describe('releaseStock', () => {
    const releaseDto = { productId: 'p1', quantity: 3, referenceId: 'order-123' };

    it('should release reserved stock successfully', async () => {
      mockTx.inventoryItem.findUnique.mockResolvedValue({
        id: 'inv-1',
        productId: 'p1',
        quantityAvailable: 95,
        quantityReserved: 5,
      });
      mockTx.inventoryItem.update.mockResolvedValue({
        quantityAvailable: 98,
        quantityReserved: 2,
      });
      mockTx.stockMovement.create.mockResolvedValue({});

      const result = await service.releaseStock(releaseDto);

      expect(result).toEqual({ success: true, quantityAvailable: 98, quantityReserved: 2 });
      expect(mockTx.inventoryItem.update).toHaveBeenCalledWith({
        where: { productId: 'p1' },
        data: {
          quantityAvailable: { increment: 3 },
          quantityReserved: { decrement: 3 },
        },
      });
      expect(mockTx.stockMovement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          quantityChange: 3,
          movementType: 'RELEASE',
          referenceId: 'order-123',
        }),
      });
    });

    it('should throw NotFoundException when releasing for non-existent product', async () => {
      mockTx.inventoryItem.findUnique.mockResolvedValue(null);

      await expect(service.releaseStock(releaseDto)).rejects.toThrow(NotFoundException);
    });
  });
});
