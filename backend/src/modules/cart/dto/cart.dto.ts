import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';

// ============================================
// Cart DTOs
// ============================================

export class AddToCartDto {
  @ApiProperty({ description: 'Product ID to add' })
  @IsString()
  productId: string;

  @ApiPropertyOptional({ description: 'Quantity to add', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(99)
  quantity?: number;
}

export class UpdateCartItemDto {
  @ApiProperty({ description: 'New quantity', minimum: 1 })
  @IsNumber()
  @Min(1)
  @Max(99)
  quantity: number;
}

export class CartItemResponseDto {
  @ApiProperty() productId: string;
  @ApiProperty() title: string;
  @ApiProperty() titleHi?: string;
  @ApiProperty() slug: string;
  @ApiProperty() price: number;
  @ApiProperty() originalPrice?: number;
  @ApiProperty() discountPercent?: number;
  @ApiProperty() imageUrl?: string;
  @ApiProperty() quantity: number;
  @ApiProperty() stockStatus: string;
  @ApiProperty() subtotal: number;
}

export class CartResponseDto {
  @ApiProperty({ type: [CartItemResponseDto] })
  items: CartItemResponseDto[];

  @ApiProperty() totalItems: number;
  @ApiProperty() totalAmount: number;
  @ApiProperty() currency: string;
}

// ============================================
// Address DTOs
// ============================================

export class UpdateAddressDto {
  @ApiProperty({ description: 'Full name', example: 'John Doe' })
  @IsString()
  fullName: string;

  @ApiProperty({ description: 'Phone number', example: '+91 9876543210' })
  @IsString()
  phone: string;

  @ApiProperty({ description: 'Address line 1', example: '123 Main Street' })
  @IsString()
  addressLine1: string;

  @ApiPropertyOptional({ description: 'Address line 2', example: 'Apartment 4B' })
  @IsOptional()
  @IsString()
  addressLine2?: string;

  @ApiProperty({ description: 'City', example: 'Mumbai' })
  @IsString()
  city: string;

  @ApiProperty({ description: 'State', example: 'Maharashtra' })
  @IsString()
  state: string;

  @ApiProperty({ description: 'PIN code', example: '400001' })
  @IsString()
  pincode: string;

  @ApiPropertyOptional({ description: 'Country', default: 'India' })
  @IsOptional()
  @IsString()
  country?: string;
}

export class AddressResponseDto {
  @ApiProperty() fullName: string;
  @ApiProperty() phone: string;
  @ApiProperty() addressLine1: string;
  @ApiPropertyOptional() addressLine2?: string;
  @ApiProperty() city: string;
  @ApiProperty() state: string;
  @ApiProperty() pincode: string;
  @ApiProperty() country: string;
}
