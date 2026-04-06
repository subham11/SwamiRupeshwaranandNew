import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import { DatabaseService, DATABASE_SERVICE } from '@/common/database';
import { WishlistItemResponseDto, WishlistResponseDto, WishlistCheckResponseDto } from './dto';

// ============================================
// Entity Interfaces (DynamoDB Single-Table)
// ============================================

interface WishlistItemEntity {
  PK: string; // WISHLIST#<userId>
  SK: string; // PRODUCT#<productId>
  GSI1PK: string; // WISHLIST
  GSI1SK: string; // USER#<userId>
  userId: string;
  productId: string;
  productTitle: string;
  productSlug: string;
  productPrice: number;
  productImage?: string;
  addedAt: string;
}

interface ProductEntity {
  PK: string;
  SK: string;
  id: string;
  title: string;
  slug: string;
  price: number;
  images: string[];
  isActive: boolean;
}

@Injectable()
export class WishlistService {
  private readonly logger = new Logger(WishlistService.name);

  constructor(
    @Inject(DATABASE_SERVICE)
    private readonly databaseService: DatabaseService,
  ) {}

  // ============================================
  // Wishlist Operations
  // ============================================

  async addToWishlist(userId: string, productId: string): Promise<WishlistResponseDto> {
    // Validate product exists
    const product = await this.databaseService.get<ProductEntity>(
      `PRODUCT#${productId}`,
      `PRODUCT#${productId}`,
    );

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    if (!product.isActive) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    // Check if already in wishlist (idempotent - just return current state)
    const existing = await this.databaseService.get<WishlistItemEntity>(
      `WISHLIST#${userId}`,
      `PRODUCT#${productId}`,
    );

    if (existing) {
      return this.getWishlist(userId);
    }

    const imageUrl = product.images && product.images.length > 0 ? product.images[0] : undefined;

    const wishlistItem: WishlistItemEntity = {
      PK: `WISHLIST#${userId}`,
      SK: `PRODUCT#${productId}`,
      GSI1PK: 'WISHLIST',
      GSI1SK: `USER#${userId}`,
      userId,
      productId,
      productTitle: product.title,
      productSlug: product.slug,
      productPrice: product.price,
      productImage: imageUrl,
      addedAt: new Date().toISOString(),
    };

    await this.databaseService.put(wishlistItem);

    return this.getWishlist(userId);
  }

  async removeFromWishlist(userId: string, productId: string): Promise<WishlistResponseDto> {
    await this.databaseService.delete(`WISHLIST#${userId}`, `PRODUCT#${productId}`);
    return this.getWishlist(userId);
  }

  async getWishlist(userId: string): Promise<WishlistResponseDto> {
    const result = await this.databaseService.query<WishlistItemEntity>('WISHLIST', {
      keyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
      expressionAttributeValues: {
        ':pk': `WISHLIST#${userId}`,
        ':skPrefix': 'PRODUCT#',
      },
    });

    const items: WishlistItemResponseDto[] = result.items.map((item) => ({
      productId: item.productId,
      productTitle: item.productTitle,
      productSlug: item.productSlug,
      productPrice: item.productPrice,
      productImage: item.productImage,
      addedAt: item.addedAt,
    }));

    return {
      items,
      totalItems: items.length,
    };
  }

  async isInWishlist(userId: string, productId: string): Promise<WishlistCheckResponseDto> {
    const item = await this.databaseService.get<WishlistItemEntity>(
      `WISHLIST#${userId}`,
      `PRODUCT#${productId}`,
    );

    return { isInWishlist: !!item };
  }

  async clearWishlist(userId: string): Promise<WishlistResponseDto> {
    const result = await this.databaseService.query<WishlistItemEntity>('WISHLIST', {
      keyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
      expressionAttributeValues: {
        ':pk': `WISHLIST#${userId}`,
        ':skPrefix': 'PRODUCT#',
      },
    });

    for (const item of result.items) {
      await this.databaseService.delete(item.PK, item.SK);
    }

    return { items: [], totalItems: 0 };
  }

  async getWishlistCount(userId: string): Promise<number> {
    const result = await this.databaseService.query<WishlistItemEntity>('WISHLIST', {
      keyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
      expressionAttributeValues: {
        ':pk': `WISHLIST#${userId}`,
        ':skPrefix': 'PRODUCT#',
      },
    });

    return result.items.length;
  }
}
