import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * GET /api/v1/users/me
   * Get the authenticated user's profile.
   *
   * Headers:  Authorization: Bearer <jwt>
   * Response: { "id": "uuid", "email": "user@example.com", "firstName": "John", "lastName": "Doe", "role": "CUSTOMER" }
   */
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getProfile(@Request() req: any) {
    return this.usersService.findById(req.user.id);
  }

  /**
   * GET /api/v1/users/vendors?ids=uuid1,uuid2,uuid3
   * Batch lookup vendor profiles by user IDs.
   * Used internally by the BFF gateway to hydrate order items.
   *
   * Response: [{ "userId": "...", "storeName": "Tech Store EG", "storeSlug": "tech-store-eg", "logoUrl": "..." }]
   */
  @Get('vendors')
  async getVendorProfiles(@Query('ids') ids: string) {
    if (!ids) return [];
    const vendorIds = ids.split(',').filter(Boolean);
    if (vendorIds.length === 0) return [];
    return this.usersService.findVendorsByIds(vendorIds);
  }
}
