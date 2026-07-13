import { Controller, Get, Req, Logger } from '@nestjs/common';
import { Request } from 'express';
import { BffOrdersService } from './bff-orders.service';

@Controller('v1/bff/orders')
export class BffOrdersController {
  private readonly logger = new Logger(BffOrdersController.name);

  constructor(private readonly bffOrdersService: BffOrdersService) {}

  /**
   * GET /v1/bff/orders/history
   *
   * BFF Aggregation Endpoint — Order History
   *
   * Combines data from:
   *   - Order Service   → raw orders + items
   *   - Product Catalog  → product names, images, slugs
   *   - Identity Service → vendor store names, logos
   *
   * Returns a single, fully hydrated response so the
   * frontend makes ONE request instead of 3+.
   *
   * Auth: JWT required — userId extracted from x-user-id header
   *       (injected by JwtAuthMiddleware).
   *
   * Response:
   * {
   *   "orders": [
   *     {
   *       "id": "order-uuid",
   *       "status": "CONFIRMED",
   *       "totalAmount": 158.98,
   *       "createdAt": "2026-06-08T...",
   *       "items": [
   *         {
   *           "productName": "Wireless Mouse",
   *           "productImage": "https://...",
   *           "quantity": 2,
   *           "unitPrice": 29.99,
   *           "lineTotal": 59.98,
   *           "vendor": {
   *             "storeName": "Tech Store EG",
   *             "logoUrl": "https://..."
   *           }
   *         }
   *       ]
   *     }
   *   ],
   *   "totalOrders": 5,
   *   "fetchedAt": "2026-06-08T02:58:00Z"
   * }
   */
  @Get('history')
  async getOrderHistory(@Req() req: Request) {
    // userId was injected by JwtAuthMiddleware into x-user-id header
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return { error: 'Authentication required — no user ID found' };
    }

    this.logger.log(`[BFF] Order history request from user ${userId}`);

    return this.bffOrdersService.getOrderHistory(userId);
  }
}
