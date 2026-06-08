import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { ReserveStockDto } from './dto/reserve-stock.dto';
import { ReleaseStockDto } from './dto/release-stock.dto';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async getStock(productId: string) {
    const item = await this.prisma.inventoryItem.findUnique({ where: { productId } });
    if (!item) {
      throw new NotFoundException('Inventory item not found for this product');
    }
    return item;
  }

  async reserveStock(dto: ReserveStockDto) {
    // Use a transaction for strict consistency
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findUnique({ where: { productId: dto.productId } });
      if (!item) {
        throw new NotFoundException('Inventory item not found');
      }
      if (item.quantityAvailable < dto.quantity) {
        throw new BadRequestException('Insufficient stock');
      }

      const updated = await tx.inventoryItem.update({
        where: { productId: dto.productId },
        data: {
          quantityAvailable: { decrement: dto.quantity },
          quantityReserved: { increment: dto.quantity },
        },
      });

      await tx.stockMovement.create({
        data: {
          inventoryItemId: item.id,
          quantityChange: -dto.quantity,
          movementType: 'RESERVATION',
          referenceId: dto.referenceId,
        },
      });

      return { success: true, quantityAvailable: updated.quantityAvailable, quantityReserved: updated.quantityReserved };
    });
  }

  async releaseStock(dto: ReleaseStockDto) {
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findUnique({ where: { productId: dto.productId } });
      if (!item) {
        throw new NotFoundException('Inventory item not found');
      }

      const updated = await tx.inventoryItem.update({
        where: { productId: dto.productId },
        data: {
          quantityAvailable: { increment: dto.quantity },
          quantityReserved: { decrement: dto.quantity },
        },
      });

      await tx.stockMovement.create({
        data: {
          inventoryItemId: item.id,
          quantityChange: dto.quantity,
          movementType: 'RELEASE',
          referenceId: dto.referenceId,
        },
      });

      return { success: true, quantityAvailable: updated.quantityAvailable, quantityReserved: updated.quantityReserved };
    });
  }
}
