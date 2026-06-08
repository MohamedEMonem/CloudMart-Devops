import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Batch vendor profile lookup.
   * Called by the BFF gateway to hydrate order items
   * with vendor store names in a single round trip.
   *
   * GET /api/v1/users/vendors?ids=uuid1,uuid2,uuid3
   */
  async findVendorsByIds(vendorUserIds: string[]) {
    const profiles = await this.prisma.vendorProfile.findMany({
      where: { userId: { in: vendorUserIds } },
      select: {
        userId:    true,
        storeName: true,
        storeSlug: true,
        logoUrl:   true,
        verifiedStatus: true,
      },
    });

    return profiles;
  }
}
