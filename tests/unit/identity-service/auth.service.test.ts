/**
 * Unit Tests — Identity Service: AuthService
 *
 * Tests the register and login business logic in isolation
 * by mocking PrismaService and JwtService dependencies.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { AuthService } from '../../../services/identity-service/src/auth/auth.service';
import { PrismaService } from '../../../services/identity-service/src/common/prisma/prisma.service';

// ───────────────────────────────────────────────────────
// Mocks
// ───────────────────────────────────────────────────────

const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
};

const mockJwtService = {
  sign: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;

  let hashSpy: jest.SpyInstance;
  let compareSpy: jest.SpyInstance;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockJwtService.sign.mockReturnValue('mock-jwt-token');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    hashSpy = jest
      .spyOn(bcrypt, 'hash')
      .mockResolvedValue('hashedPass' as never);

    compareSpy = jest
      .spyOn(bcrypt, 'compare')
      .mockResolvedValue(true as never);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ─────────────────────────────────────────────────────
  // Register
  // ─────────────────────────────────────────────────────

  describe('register', () => {
    const registerDto = {
      email: 'test@example.com',
      password: 'SecurePass123',
      firstName: 'John',
      lastName: 'Doe',
    };

    it('should register a new user successfully', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      mockPrismaService.user.create.mockResolvedValue({
        id: 'uuid-1',
        email: registerDto.email,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        role: 'CUSTOMER',
      });

      const result = await service.register(registerDto);

      expect(result).toEqual({
        id: 'uuid-1',
        email: registerDto.email,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        role: 'CUSTOMER',
      });

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });

      expect(hashSpy).toHaveBeenCalledWith(registerDto.password, 12);

      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: registerDto.email,
          passwordHash: 'hashedPass',
          firstName: registerDto.firstName,
          lastName: registerDto.lastName,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      });
    });

    it('should throw ConflictException if email already exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'existing-user',
      });

      await expect(service.register(registerDto)).rejects.toThrow(
        'Email already registered',
      );

      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
    });

    it('should hash the password with cost factor 12', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      mockPrismaService.user.create.mockResolvedValue({
        id: 'uuid-1',
        email: registerDto.email,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        role: 'CUSTOMER',
      });

      await service.register(registerDto);

      expect(hashSpy).toHaveBeenCalledTimes(1);

      expect(hashSpy).toHaveBeenCalledWith(
        registerDto.password,
        12,
      );
    });
  });

  // ─────────────────────────────────────────────────────
  // Login
  // ─────────────────────────────────────────────────────

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'SecurePass123',
    };

    const mockUser = {
      id: 'uuid-1',
      email: 'test@example.com',
      passwordHash: '$2b$12$hashedpassword',
      firstName: 'John',
      lastName: 'Doe',
      role: 'CUSTOMER',
    };

    it('should return access_token and user on valid credentials', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      compareSpy.mockResolvedValue(true as never);

      const result = await service.login(loginDto);

      expect(compareSpy).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.passwordHash,
      );

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });

      expect(result).toEqual({
        access_token: 'mock-jwt-token',
        expiresIn: 900,
        user: {
          id: 'uuid-1',
          email: 'test@example.com',
          name: 'John Doe',
          role: 'CUSTOMER',
        },
      });
    });

    it('should throw UnauthorizedException for non-existent email', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      compareSpy.mockResolvedValue(false as never);

      await expect(service.login(loginDto)).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('should set JWT expiry to 900 seconds (15 minutes)', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      compareSpy.mockResolvedValue(true as never);

      const result = await service.login(loginDto);

      expect(result.expiresIn).toBe(900);
    });
  });
});