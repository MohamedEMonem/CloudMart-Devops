import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  RawOrder,
  CatalogProduct,
  VendorProfile,
  HydratedOrder,
  HydratedOrderItem,
  OrderHistoryResponse,
} from './types/bff-orders.types';

// Internal Docker network base URLs
const ORDER_SERVICE_URL   = 'http://order-service:3000/v1';
const CATALOG_SERVICE_URL = 'http://product-catalog-service:3000/v1';
const IDENTITY_SERVICE_URL = 'http://identity-service:3000/v1';

@Injectable()
export class BffOrdersService {
  private readonly logger = new Logger(BffOrdersService.name);

  constructor(private readonly http: HttpService) {}

  /**
   * Aggregates order history from three microservices into
   * a single hydrated response for the frontend.
   *
   * Flow:
   *   1. Fetch raw orders from Order Service (by userId)
   *   2. Extract unique productIds + vendorIds
   *   3. Parallel-fetch product details + vendor profiles
   *   4. Merge into hydrated response
   */
  async getOrderHistory(userId: string): Promise<OrderHistoryResponse> {
    // ── Step A: Fetch raw orders ─────────────────────────
    this.logger.log(`[BFF] Fetching order history for user ${userId}`);

    let rawOrders: RawOrder[];
    try {
      const { data } = await firstValueFrom(
        this.http.get<RawOrder[]>(`${ORDER_SERVICE_URL}/orders`, {
          params: { userId },
          timeout: 5000,
        }),
      );
      rawOrders = data;
    } catch (error) {
      this.logger.error(`[BFF] Order Service unreachable`, error);
      // If Order Service is down, we can't do anything — fail gracefully
      return { orders: [], totalOrders: 0, fetchedAt: new Date().toISOString() };
    }

    if (!rawOrders || rawOrders.length === 0) {
      return { orders: [], totalOrders: 0, fetchedAt: new Date().toISOString() };
    }

    // ── Step B: Extract unique IDs ──────────────────────
    const productIds = new Set<string>();
    const vendorIds  = new Set<string>();

    for (const order of rawOrders) {
      for (const item of order.items) {
        productIds.add(item.productId);
        vendorIds.add(item.vendorId);
      }
    }

    this.logger.log(`[BFF] Hydrating ${rawOrders.length} orders — ${productIds.size} products, ${vendorIds.size} vendors`);

    // ── Step C: Parallel fetch (fault-tolerant) ─────────
    const [productMap, vendorMap] = await Promise.all([
      this.fetchProducts([...productIds]),
      this.fetchVendors([...vendorIds]),
    ]);

    // ── Step D: Hydrate & map ───────────────────────────
    const hydratedOrders: HydratedOrder[] = rawOrders.map((order) => ({
      id:              order.id,
      status:          order.status,
      totalAmount:     parseFloat(order.totalAmount),
      shippingAddress: order.shippingAddress,
      createdAt:       order.createdAt,
      items: order.items.map((item): HydratedOrderItem => {
        const product = productMap.get(item.productId);
        const vendor  = vendorMap.get(item.vendorId);
        const unitPrice = parseFloat(item.unitPrice);

        return {
          id:           item.id,
          productId:    item.productId,
          productName:  product?.name ?? item.productName,
          productImage: product?.images?.[0] ?? null,
          productSlug:  product?.slug ?? null,
          quantity:     item.quantity,
          unitPrice,
          lineTotal:    unitPrice * item.quantity,
          vendor: {
            id:        item.vendorId,
            storeName: vendor?.storeName ?? 'Store Unavailable',
            storeSlug: vendor?.storeSlug ?? null,
            logoUrl:   vendor?.logoUrl ?? null,
          },
        };
      }),
    }));

    return {
      orders:      hydratedOrders,
      totalOrders: hydratedOrders.length,
      fetchedAt:   new Date().toISOString(),
    };
  }

  // ──────────────────────────────────────────────────────
  // PRIVATE: Fault-tolerant fetchers
  // Each returns a Map for O(1) lookup during hydration.
  // On failure, returns an empty Map — the caller falls
  // back to denormalized data already in the order items.
  // ──────────────────────────────────────────────────────

  private async fetchProducts(productIds: string[]): Promise<Map<string, CatalogProduct>> {
    const map = new Map<string, CatalogProduct>();
    if (productIds.length === 0) return map;

    try {
      // Fetch each product individually. In production, add a
      // batch endpoint (POST /products/batch) to the catalog service.
      const results = await Promise.allSettled(
        productIds.map((id) =>
          firstValueFrom(
            this.http.get<CatalogProduct>(`${CATALOG_SERVICE_URL}/products/${id}`, {
              timeout: 3000,
            }),
          ),
        ),
      );

      for (const result of results) {
        if (result.status === 'fulfilled' && result.value.data) {
          const product = result.value.data;
          map.set(product._id, product);
        }
      }

      this.logger.log(`[BFF] Fetched ${map.size}/${productIds.length} products`);
    } catch (error) {
      this.logger.warn(`[BFF] Product Catalog Service unavailable — using fallback names`);
    }

    return map;
  }

  private async fetchVendors(vendorIds: string[]): Promise<Map<string, VendorProfile>> {
    const map = new Map<string, VendorProfile>();
    if (vendorIds.length === 0) return map;

    try {
      const ids = vendorIds.join(',');
      const { data } = await firstValueFrom(
        this.http.get<VendorProfile[]>(`${IDENTITY_SERVICE_URL}/users/vendors`, {
          params: { ids },
          timeout: 3000,
        }),
      );

      for (const vendor of data) {
        map.set(vendor.userId, vendor);
      }

      this.logger.log(`[BFF] Fetched ${map.size}/${vendorIds.length} vendor profiles`);
    } catch (error) {
      this.logger.warn(`[BFF] Identity Service unavailable — using fallback vendor names`);
    }

    return map;
  }
}
