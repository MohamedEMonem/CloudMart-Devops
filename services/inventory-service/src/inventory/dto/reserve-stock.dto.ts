import { IsString, IsInt, Min } from 'class-validator';

export class ReserveStockDto {
  @IsString()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsString()
  referenceId: string;
}
