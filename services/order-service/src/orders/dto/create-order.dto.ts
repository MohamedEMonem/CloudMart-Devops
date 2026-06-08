import { Type } from 'class-transformer';
import { IsString, IsArray, IsObject, ValidateNested, IsNumber, Min, MinLength } from 'class-validator';

export class OrderItemDto {
  // ── Vendor ownership ──────────────────────────────
  @IsString()
  vendorId: string;      // ref → Identity Service VendorProfile.userId

  @IsString()
  @MinLength(1)
  vendorName: string;    // denormalized snapshot for display without cross-service calls

  // ── Product fields ────────────────────────────────
  @IsString()
  productId: string;     // ref → Product Catalog Service

  @IsString()
  @MinLength(1)
  productName: string;   // denormalized snapshot at order time

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;
}

export class CreateOrderDto {
  @IsString()
  userId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsObject()
  shippingAddress: Record<string, any>;
}
