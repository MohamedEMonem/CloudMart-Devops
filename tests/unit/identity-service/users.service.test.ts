/**
 * Unit Tests — Identity Service: UsersService
 *
 * Tests the user profile retrieval and vendor batch lookup
 * by mocking PrismaService.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from '../../../services/identity-service/src/users/users.service';
import { PrismaService } from '../../../services/identity-service/src/common/prisma/prisma.service';

const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
  },
  vendorProfile: {
    findMany: jest.fn(),
  },
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  // ── findById ──────────────────────────────────────────

  describe('findById', () => {
    it('should return the user profile when found', async () => {
      const mockUser = {
        id: 'uuid-1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'CUSTOMER',
        createdAt: new Date('2026-01-01'),
      };
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findById('uuid-1');

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
        },
      });
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.findById('nonexistent-uuid')).rejects.toThrow('User not found');
    });
  });

  // ── findVendorsByIds ──────────────────────────────────

  describe('findVendorsByIds', () => {
    it('should return vendor profiles for given IDs', async () => {
      const mockProfiles = [
        { userId: 'v1', storeName: 'Tech Store EG', storeSlug: 'tech-store-eg', logoUrl: null, verifiedStatus: 'VERIFIED' },
        { userId: 'v2', storeName: 'Fashion Hub', storeSlug: 'fashion-hub', logoUrl: 'https://img.example.com/logo.png', verifiedStatus: 'PENDING_REVIEW' },
      ];
      mockPrismaService.vendorProfile.findMany.mockResolvedValue(mockProfiles);

      const result = await service.findVendorsByIds(['v1', 'v2']);

      expect(result).toEqual(mockProfiles);
      expect(mockPrismaService.vendorProfile.findMany).toHaveBeenCalledWith({
        where: { userId: { in: ['v1', 'v2'] } },
        select: {
          userId: true,
          storeName: true,
          storeSlug: true,
          logoUrl: true,
          verifiedStatus: true,
        },
      });
    });

    it('should return an empty array when no vendor profiles match', async () => {
      mockPrismaService.vendorProfile.findMany.mockResolvedValue([]);

      const result = await service.findVendorsByIds(['nonexistent-vendor']);

      expect(result).toEqual([]);
    });
  });
});
