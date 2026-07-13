import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

interface JwtPayload {
  sub: string;    // userId
  email: string;
  role: string;   // CUSTOMER | VENDOR | ADMIN
  iat: number;
  exp: number;
}

/**
 * Gateway-level JWT Guard
 *
 * Validates the token using the shared JWT_SECRET. If valid,
 * injects `x-user-id`, `x-user-email`, and `x-user-role` headers
 * into the request so downstream microservices can trust the caller
 * identity WITHOUT each service needing its own JWT logic.
 *
 * This is the single point of authentication for the entire platform.
 */
@Injectable()
export class JwtAuthMiddleware implements NestMiddleware {
  private readonly jwtSecret: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'default-secret';
  }

  use(req: Request, _res: Response, next: NextFunction) {
    // Public routes that do not require a JWT — allow them to pass through immediately
    const publicRoutes = [
      '/api/v1/auth/login',
      '/api/v1/auth/register',
      '/api/v1/health',
    ];

    if (publicRoutes.some((route) => req.path.startsWith(route))) {
      return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or malformed Authorization header');
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, this.jwtSecret) as JwtPayload;

      // Inject trusted identity headers for downstream services
      req.headers['x-user-id']    = decoded.sub;
      req.headers['x-user-email'] = decoded.email;
      req.headers['x-user-role']  = decoded.role;

      next();
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
