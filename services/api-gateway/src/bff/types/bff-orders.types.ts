// ──────────────────────────────────────────────
// BFF Type Contracts
// TypeScript interfaces for the payloads returned
// by internal microservices. Keeps the gateway
// type-safe without sharing Prisma/Mongoose types.
// ──────────────────────────────────────────────

// ── Order Service Response Types ─────────────────

export interface RawOrderItem {
  id: string;
  orderId: string;
  vendorId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: string; // Decimal comes back as string from Prisma
}

export interface RawOrder {
  id: string;
  userId: string;
  status: string;
  totalAmount: string;
  shippingAddress: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  items: RawOrderItem[];
}

// ── Product Catalog Service Response Types ───────

export interface CatalogProduct {
  _id: string;
  vendorId: string;
  vendorName: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  images: string[];
  categoryId: string;
  isActive: boolean;
}

// ── Identity Service Response Types ──────────────

export interface VendorProfile {
  userId: string;
  storeName: string;
  storeSlug: string;
  logoUrl: string | null;
  verifiedStatus: string;
}

// ── Hydrated Output Types ────────────────────────

export interface HydratedOrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string | null;
  productSlug: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  vendor: {
    id: string;
    storeName: string;
    storeSlug: string | null;
    logoUrl: string | null;
  };
}

export interface HydratedOrder {
  id: string;
  status: string;
  totalAmount: number;
  shippingAddress: Record<string, any>;
  createdAt: string;
  items: HydratedOrderItem[];
}

export interface OrderHistoryResponse {
  orders: HydratedOrder[];
  totalOrders: number;
  fetchedAt: string;
}
