import { ApiProperty } from '@nestjs/swagger';

// ============================================
// Wishlist Response DTOs
// ============================================

export class WishlistItemResponseDto {
  @ApiProperty({ description: 'Product ID' })
  productId: string;

  @ApiProperty({ description: 'Product title' })
  productTitle: string;

  @ApiProperty({ description: 'Product URL slug' })
  productSlug: string;

  @ApiProperty({ description: 'Product price in INR' })
  productPrice: number;

  @ApiProperty({ description: 'Product image URL', required: false })
  productImage?: string;

  @ApiProperty({ description: 'Date the product was added to wishlist' })
  addedAt: string;
}

export class WishlistResponseDto {
  @ApiProperty({ type: [WishlistItemResponseDto] })
  items: WishlistItemResponseDto[];

  @ApiProperty({ description: 'Total number of items in wishlist' })
  totalItems: number;
}

export class WishlistCheckResponseDto {
  @ApiProperty({ description: 'Whether the product is in the wishlist' })
  isInWishlist: boolean;
}
