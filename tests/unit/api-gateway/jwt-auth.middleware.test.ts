/**
 * Unit Tests — API Gateway: JwtAuthMiddleware
 *
 * Tests the gateway-level JWT validation and header injection
 * that provides single-point authentication for all services.
 */
import { UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { JwtAuthMiddleware } from '../../../services/api-gateway/src/middleware/jwt-auth.middleware';

describe('JwtAuthMiddleware', () => {
  let middleware: JwtAuthMiddleware;
  let mockReq: any;
  let mockRes: any;
  let mockNext: jest.Mock;

  const JWT_SECRET = 'test-secret';

  beforeEach(() => {
    process.env.JWT_SECRET = JWT_SECRET;
    middleware = new JwtAuthMiddleware();
    mockReq = { headers: {} };
    mockRes = {};
    mockNext = jest.fn();
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
  });

  it('should call next() and inject x-user headers for a valid JWT', () => {
    const token = jwt.sign(
      { sub: 'user-1', email: 'test@example.com', role: 'CUSTOMER' },
      JWT_SECRET,
      { expiresIn: '15m' },
    );
    mockReq.headers.authorization = `Bearer ${token}`;

    middleware.use(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockReq.headers['x-user-id']).toBe('user-1');
    expect(mockReq.headers['x-user-email']).toBe('test@example.com');
    expect(mockReq.headers['x-user-role']).toBe('CUSTOMER');
  });

  it('should throw UnauthorizedException when Authorization header is missing', () => {
    expect(() => middleware.use(mockReq, mockRes, mockNext)).toThrow(UnauthorizedException);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should throw UnauthorizedException when Authorization header lacks Bearer prefix', () => {
    mockReq.headers.authorization = 'Basic some-token';

    expect(() => middleware.use(mockReq, mockRes, mockNext)).toThrow(UnauthorizedException);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should throw UnauthorizedException for an expired JWT', () => {
    const token = jwt.sign(
      { sub: 'user-1', email: 'test@example.com', role: 'CUSTOMER' },
      JWT_SECRET,
      { expiresIn: '-1s' }, // already expired
    );
    mockReq.headers.authorization = `Bearer ${token}`;

    expect(() => middleware.use(mockReq, mockRes, mockNext)).toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException for a JWT signed with wrong secret', () => {
    const token = jwt.sign(
      { sub: 'user-1', email: 'test@example.com', role: 'CUSTOMER' },
      'wrong-secret',
      { expiresIn: '15m' },
    );
    mockReq.headers.authorization = `Bearer ${token}`;

    expect(() => middleware.use(mockReq, mockRes, mockNext)).toThrow(UnauthorizedException);
  });

  it('should inject VENDOR role from JWT payload', () => {
    const token = jwt.sign(
      { sub: 'vendor-1', email: 'vendor@example.com', role: 'VENDOR' },
      JWT_SECRET,
      { expiresIn: '15m' },
    );
    mockReq.headers.authorization = `Bearer ${token}`;

    middleware.use(mockReq, mockRes, mockNext);

    expect(mockReq.headers['x-user-role']).toBe('VENDOR');
  });
});
