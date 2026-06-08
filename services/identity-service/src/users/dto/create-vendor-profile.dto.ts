import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CreateVendorProfileDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  storeName: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  storeSlug: string;

  @IsString()
  @IsOptional()
  businessRegistrationNumber?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsString()
  @IsOptional()
  logoUrl?: string;
}
