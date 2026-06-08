import { IsString, IsInt, Min } from 'class-validator';

export class ReleaseStockDto {
  @IsString()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsString()
  referenceId: string;
}
