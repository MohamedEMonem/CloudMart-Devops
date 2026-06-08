import { IsString, IsNumber, IsOptional, IsArray, IsObject, IsBoolean, Min, MinLength } from 'class-validator';

export class CreateProductDto {
  // ── Required vendor fields ──────────────────
  @IsString()
  vendorId: string; // must match authenticated vendor's userId

  @IsString()
  @MinLength(1)
  vendorName: string;

  // ── Core product fields ─────────────────────
  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  @MinLength(1)
  slug: string;

  @IsString()
  @MinLength(1)
  description: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsArray()
  @IsOptional()
  images?: string[];

  @IsString()
  categoryId: string;

  @IsObject()
  @IsOptional()
  attributes?: Record<string, any>;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
