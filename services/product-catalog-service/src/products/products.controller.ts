import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * GET /api/v1/products
   * List/search products — supports vendor storefront filtering.
   *
   * Query params:
   *   ?page=1             — pagination
   *   ?limit=20
   *   ?vendorId=uuid      — filter by vendor (vendor storefront)
   *   ?category=ObjectId  — filter by category
   *   ?search=keyword     — full-text search
   *   ?minPrice=10
   *   ?maxPrice=500
   *
   * Examples:
   *   GET /api/v1/products                           → all active products
   *   GET /api/v1/products?vendorId=abc123           → vendor storefront
   *   GET /api/v1/products?vendorId=abc123&category=xyz → vendor + category
   *   GET /api/v1/products?search=wireless+mouse     → full-text search
   *
   * Response: { "data": [...], "total": 150, "page": 1, "limit": 20 }
   */
  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('vendorId') vendorId?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
  ) {
    return this.productsService.findAll({
      page: parseInt(page || '1', 10),
      limit: Math.min(parseInt(limit || '20', 10), 100),
      vendorId,
      category,
      search,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    });
  }

  /**
   * GET /api/v1/products/:id
   * Get a single product by MongoDB ID.
   *
   * Response: { "_id": "...", "vendorId": "...", "name": "Wireless Mouse", "price": 29.99, ... }
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.productsService.findById(id);
  }

  /**
   * POST /api/v1/products
   * Create a new product. Caller must supply their vendorId.
   * In Phase 2, a VendorGuard will enforce vendorId === req.user.id.
   *
   * Request:
   * {
   *   "vendorId": "vendor-uuid",
   *   "vendorName": "Tech Store EG",
   *   "name": "Wireless Mouse",
   *   "slug": "wireless-mouse-techstore",
   *   "description": "...",
   *   "price": 29.99,
   *   "categoryId": "ObjectId"
   * }
   */
  @Post()
  async create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }
}
