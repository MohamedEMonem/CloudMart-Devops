import { IsString, IsNumber, IsEnum, Min } from 'class-validator';

enum PaymentMethod {
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
}

export class ProcessPaymentDto {
  @IsString()
  orderId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  currency: string;

  @IsEnum(PaymentMethod)
  paymentMethod: string;

  @IsString()
  gatewayToken: string;
}
