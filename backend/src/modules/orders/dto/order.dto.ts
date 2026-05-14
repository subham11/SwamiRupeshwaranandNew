import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';

// ============================================
// Order Status
// ============================================
export enum OrderStatus {
  CREATED = 'created',
  PAYMENT_PENDING = 'payment_pending',
  PAID = 'paid',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

// ============================================
// DTOs
// ============================================

export class VerifyProductOrderPaymentDto {
  @ApiProperty()
  @IsString()
  razorpayOrderId: string;

  @ApiProperty()
  @IsString()
  razorpayPaymentId: string;

  @ApiProperty()
  @IsString()
  razorpaySignature: string;

  @ApiProperty()
  @IsString()
  orderId: string;
}

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: OrderStatus })
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  adminNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  trackingNumber?: string;
}

// ============================================
// Response DTOs
// ============================================

export class CheckoutResponseDto {
  @ApiProperty()
  orderId: string;

  @ApiProperty()
  razorpayOrderId: string;

  @ApiProperty({ description: 'Amount in paise (INR × 100)' })
  amount: number;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  razorpayKeyId: string;
}

export class OrderPaymentVerificationResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty()
  orderId: string;

  @ApiProperty()
  status: string;
}

export class OrderItemResponseDto {
  productId: string;
  variantId?: string;
  variantLabel?: string;
  variantLabelHi?: string;
  title: string;
  titleHi?: string;
  slug: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  subtotal: number;
}

export class OrderResponseDto {
  id: string;
  userId: string;
  userEmail: string;
  status: OrderStatus;
  items: OrderItemResponseDto[];
  totalItems: number;
  totalAmount: number;
  currency: string;
  shippingAddress: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  paymentStatus: string;
  trackingNumber?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}
