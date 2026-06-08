// ──────────────────────────────────────────────
// Proxy Route Configuration
// Maps external paths → internal Docker service URLs
// ──────────────────────────────────────────────

export interface ProxyRoute {
  /** Path prefix to match (e.g. '/api/v1/auth') */
  context: string;
  /** Internal Docker network target */
  target: string;
}

export const PROXY_ROUTES: ProxyRoute[] = [
  // ── Identity & Auth ──────────────────────────────
  {
    context: '/api/v1/auth',
    target:  'http://identity-service:3000',
  },
  {
    context: '/api/v1/users',
    target:  'http://identity-service:3000',
  },

  // ── Product Catalog ──────────────────────────────
  {
    context: '/api/v1/products',
    target:  'http://product-catalog-service:3000',
  },
  {
    context: '/api/v1/categories',
    target:  'http://product-catalog-service:3000',
  },

  // ── Inventory ────────────────────────────────────
  {
    context: '/api/v1/inventory',
    target:  'http://inventory-service:3000',
  },

  // ── Shopping Cart ────────────────────────────────
  {
    context: '/api/v1/cart',
    target:  'http://cart-service:3000',
  },

  // ── Orders ───────────────────────────────────────
  {
    context: '/api/v1/orders',
    target:  'http://order-service:3000',
  },

  // ── Payments ─────────────────────────────────────
  {
    context: '/api/v1/payments',
    target:  'http://payment-service:3000',
  },
];
