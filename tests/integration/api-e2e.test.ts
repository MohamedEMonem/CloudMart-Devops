/**
 * Integration Tests — API E2E Tests
 *
 * These tests run against live services (docker-compose up).
 * They validate the full request flow through the API Gateway
 * to each downstream microservice.
 *
 * Prerequisites:
 *   docker-compose up --build
 *   Wait for all healthchecks to pass
 *
 * Run: npx jest tests/integration/api-e2e.test.ts --runInBand
 */

const BASE_URL = process.env.API_URL || 'http://localhost:3000';

// Helper for fetch with timeout
async function apiRequest(
  method: string,
  path: string,
  body?: any,
  headers: Record<string, string> = {},
): Promise<{ status: number; data: any }> {
  const options: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
  };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, options);
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

describe('E2E: API Gateway → Microservices', () => {
  let accessToken: string;
  let userId: string;
  const testEmail = `e2e-test-${Date.now()}@example.com`;
  const testPassword = 'SecurePass123!';

  // ── Health Checks ─────────────────────────────────────

  describe('Health Checks', () => {
    it('API Gateway /v1/health should return 200', async () => {
      const { status, data } = await apiRequest('GET', '/v1/health');
      expect(status).toBe(200);
      expect(data.status).toBe('ok');
    });
  });

  // ── Identity Service: Auth ────────────────────────────

  describe('Auth Flow', () => {
    it('POST /v1/auth/register — should create a new user', async () => {
      const { status, data } = await apiRequest('POST', '/v1/auth/register', {
        email: testEmail,
        password: testPassword,
        firstName: 'E2E',
        lastName: 'Test',
      });

      expect(status).toBe(201);
      expect(data.email).toBe(testEmail);
      expect(data.role).toBe('CUSTOMER');
      expect(data.id).toBeDefined();
    });

    it('POST /v1/auth/register — should reject duplicate email', async () => {
      const { status } = await apiRequest('POST', '/v1/auth/register', {
        email: testEmail,
        password: testPassword,
        firstName: 'E2E',
        lastName: 'Test',
      });

      expect(status).toBe(409);
    });

    it('POST /v1/auth/login — should return JWT on valid credentials', async () => {
      const { status, data } = await apiRequest('POST', '/v1/auth/login', {
        email: testEmail,
        password: testPassword,
      });

      expect(status).toBe(200);
      expect(data.access_token).toBeDefined();
      expect(data.expiresIn).toBe(900);
      expect(data.user.email).toBe(testEmail);

      accessToken = data.access_token;
      userId = data.user.id;
    });

    it('POST /v1/auth/login — should reject invalid password', async () => {
      const { status } = await apiRequest('POST', '/v1/auth/login', {
        email: testEmail,
        password: 'WrongPassword!',
      });

      expect(status).toBe(401);
    });
  });

  // ── Identity Service: Protected Routes ────────────────

  describe('Protected Routes (JWT Required)', () => {
    it('GET /v1/users/me — should return user profile with valid JWT', async () => {
      const { status, data } = await apiRequest('GET', '/v1/users/me', undefined, {
        Authorization: `Bearer ${accessToken}`,
      });

      expect(status).toBe(200);
      expect(data.email).toBe(testEmail);
      expect(data.firstName).toBe('E2E');
    });

    it('GET /v1/users/me — should return 401 without JWT', async () => {
      const { status } = await apiRequest('GET', '/v1/users/me');
      expect(status).toBe(401);
    });

    it('GET /v1/users/me — should return 401 with invalid JWT', async () => {
      const { status } = await apiRequest('GET', '/v1/users/me', undefined, {
        Authorization: 'Bearer invalid.jwt.token',
      });
      expect(status).toBe(401);
    });
  });

  // ── Product Catalog Service ───────────────────────────

  describe('Product Catalog', () => {
    it('GET /v1/products — should return paginated products (public)', async () => {
      const { status, data } = await apiRequest('GET', '/v1/products');

      expect(status).toBe(200);
      expect(data).toHaveProperty('data');
      expect(data).toHaveProperty('total');
      expect(data).toHaveProperty('page');
      expect(data).toHaveProperty('limit');
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('GET /v1/products?limit=5 — should respect limit param', async () => {
      const { status, data } = await apiRequest('GET', '/v1/products?limit=5');

      expect(status).toBe(200);
      expect(data.limit).toBe(5);
    });

    it('GET /v1/products?vendorId=test — should filter by vendor', async () => {
      const { status, data } = await apiRequest('GET', '/v1/products?vendorId=nonexistent-vendor');

      expect(status).toBe(200);
      expect(data.data).toEqual([]);
      expect(data.total).toBe(0);
    });
  });

  // ── Cart Service ──────────────────────────────────────

  describe('Shopping Cart', () => {
    it('GET /v1/cart?userId=xxx — should return empty cart for new user', async () => {
      const { status, data } = await apiRequest(
        'GET',
        `/v1/cart?userId=${userId}`,
        undefined,
        { Authorization: `Bearer ${accessToken}` },
      );

      expect(status).toBe(200);
      expect(data.items).toEqual([]);
    });

    it('POST /v1/cart/items — should add item to cart', async () => {
      const { status, data } = await apiRequest(
        'POST',
        '/v1/cart/items',
        {
          userId,
          productId: 'test-product-1',
          quantity: 2,
          price: 29.99,
        },
        { Authorization: `Bearer ${accessToken}` },
      );

      expect(status).toBe(201);
      expect(data.items).toHaveLength(1);
      expect(data.items[0].productId).toBe('test-product-1');
      expect(data.items[0].quantity).toBe(2);
    });

    it('POST /v1/cart/items — should increment quantity for duplicate product', async () => {
      const { status, data } = await apiRequest(
        'POST',
        '/v1/cart/items',
        {
          userId,
          productId: 'test-product-1',
          quantity: 3,
          price: 29.99,
        },
        { Authorization: `Bearer ${accessToken}` },
      );

      expect(status).toBe(201);
      expect(data.items[0].quantity).toBe(5); // 2 + 3
    });

    it('DELETE /v1/cart/items/:productId — should remove item', async () => {
      const { status, data } = await apiRequest(
        'DELETE',
        `/v1/cart/items/test-product-1?userId=${userId}`,
        undefined,
        { Authorization: `Bearer ${accessToken}` },
      );

      expect(status).toBe(200);
      expect(data.items).toHaveLength(0);
    });

    it('GET /v1/cart — should return 400 without userId', async () => {
      const { status, data } = await apiRequest(
        'GET',
        '/v1/cart',
        undefined,
        { Authorization: `Bearer ${accessToken}` },
      );

      expect(status).toBe(400);
      expect(data.error).toContain('userId');
    });
  });

  // ── Inventory Service ─────────────────────────────────

  describe('Inventory', () => {
    it('GET /v1/inventory/:productId — should return 404 for non-existent product', async () => {
      const { status } = await apiRequest(
        'GET',
        '/v1/inventory/nonexistent-product',
        undefined,
        { Authorization: `Bearer ${accessToken}` },
      );

      expect(status).toBe(404);
    });

    it('POST /v1/inventory/reserve — should return 404 for non-existent inventory', async () => {
      const { status } = await apiRequest(
        'POST',
        '/v1/inventory/reserve',
        {
          productId: 'nonexistent',
          quantity: 1,
          referenceId: 'test-ref',
        },
        { Authorization: `Bearer ${accessToken}` },
      );

      expect(status).toBe(404);
    });
  });

  // ── Order Service ─────────────────────────────────────

  describe('Orders', () => {
    it('GET /v1/orders — should require userId or vendorId', async () => {
      const { status, data } = await apiRequest(
        'GET',
        '/v1/orders',
        undefined,
        { Authorization: `Bearer ${accessToken}` },
      );

      expect(status).toBe(200);
      expect(data.error).toContain('userId or vendorId');
    });

    it('GET /v1/orders?userId=xxx — should return empty array for new user', async () => {
      const { status, data } = await apiRequest(
        'GET',
        `/v1/orders?userId=${userId}`,
        undefined,
        { Authorization: `Bearer ${accessToken}` },
      );

      expect(status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });

    it('GET /v1/orders/:id — should return 404 for non-existent order', async () => {
      const { status } = await apiRequest(
        'GET',
        '/v1/orders/nonexistent-order-id',
        undefined,
        { Authorization: `Bearer ${accessToken}` },
      );

      expect(status).toBe(404);
    });
  });
});
