import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService, DATABASE_SERVICE } from '@/common/database';
import { ProductsService } from './products.service';
import {
  CreateProductReviewDto,
  AdminUpdateReviewDto,
  ProductReviewResponseDto,
  ProductReviewListResponseDto,
} from './dto';

// ============================================
// Entity Interface
// ============================================

interface ProductReviewEntity {
  PK: string; // PRODUCT#<productId>
  SK: string; // REVIEW#<reviewId>
  GSI1PK: string; // REVIEW
  GSI1SK: string; // REVIEW#<createdAt>
  id: string;
  productId: string;
  productTitle: string;
  userId: string;
  userEmail: string;
  rating: number;
  reviewText?: string;
  reviewTextHi?: string;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class ProductReviewsService {
  constructor(
    @Inject(DATABASE_SERVICE) private readonly databaseService: DatabaseService,
    private readonly productsService: ProductsService,
  ) {}

  // ============================================
  // Create Review
  // ============================================

  async createReview(
    userId: string,
    userEmail: string,
    productId: string,
    dto: CreateProductReviewDto,
  ): Promise<ProductReviewResponseDto> {
    // Verify product exists
    const product = await this.productsService.getProductById(productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const now = new Date().toISOString();
    const reviewId = uuidv4();

    const entity: ProductReviewEntity = {
      PK: `PRODUCT#${productId}`,
      SK: `REVIEW#${reviewId}`,
      GSI1PK: 'REVIEW',
      GSI1SK: `REVIEW#${now}`,
      id: reviewId,
      productId,
      productTitle: product.title,
      userId,
      userEmail,
      rating: dto.rating,
      reviewText: dto.reviewText,
      reviewTextHi: dto.reviewTextHi,
      isApproved: false, // Requires admin approval
      createdAt: now,
      updatedAt: now,
    };

    await this.databaseService.put<ProductReviewEntity>(entity);

    // Recalculate product rating (only approved reviews count)
    await this.recalculateRating(productId);

    return this.mapReviewToResponse(entity);
  }

  // ============================================
  // Admin: Update Review (approve/reject/edit)
  // ============================================

  async adminUpdateReview(
    reviewId: string,
    dto: AdminUpdateReviewDto,
  ): Promise<ProductReviewResponseDto> {
    // Find the review by scanning GSI1
    const review = await this.findReviewById(reviewId);
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    const updateExpressions: string[] = ['#updatedAt = :updatedAt'];
    const names: Record<string, string> = { '#updatedAt': 'updatedAt' };
    const values: Record<string, unknown> = { ':updatedAt': new Date().toISOString() };

    if (dto.isApproved !== undefined) {
      updateExpressions.push('#isApproved = :isApproved');
      names['#isApproved'] = 'isApproved';
      values[':isApproved'] = dto.isApproved;
    }

    if (dto.reviewText !== undefined) {
      updateExpressions.push('#reviewText = :reviewText');
      names['#reviewText'] = 'reviewText';
      values[':reviewText'] = dto.reviewText;
    }

    if (dto.reviewTextHi !== undefined) {
      updateExpressions.push('#reviewTextHi = :reviewTextHi');
      names['#reviewTextHi'] = 'reviewTextHi';
      values[':reviewTextHi'] = dto.reviewTextHi;
    }

    const updated = await this.databaseService.update<ProductReviewEntity>('ProductReview', {
      key: { PK: review.PK, SK: review.SK },
      updateExpression: `SET ${updateExpressions.join(', ')}`,
      expressionAttributeNames: names,
      expressionAttributeValues: values,
    });

    // Recalculate product rating if approval status changed
    if (dto.isApproved !== undefined) {
      await this.recalculateRating(review.productId);
    }

    return this.mapReviewToResponse(updated);
  }

  // ============================================
  // Delete Review
  // ============================================

  async deleteReview(reviewId: string): Promise<void> {
    const review = await this.findReviewById(reviewId);
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    await this.databaseService.delete(review.PK, review.SK);

    // Recalculate product rating
    await this.recalculateRating(review.productId);
  }

  // ============================================
  // List Reviews by Product
  // ============================================

  async listReviewsByProduct(
    productId: string,
    approvedOnly: boolean = true,
    limit?: number,
    cursor?: string,
  ): Promise<ProductReviewListResponseDto> {
    const effectiveLimit = limit || 20;
    let lastKey: Record<string, unknown> | undefined;

    if (cursor) {
      try {
        lastKey = JSON.parse(Buffer.from(cursor, 'base64').toString('utf8'));
      } catch {
        lastKey = undefined;
      }
    }

    const result = await this.databaseService.query<ProductReviewEntity>('ProductReview', {
      indexName: undefined,
      keyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      expressionAttributeValues: {
        ':pk': `PRODUCT#${productId}`,
        ':sk': 'REVIEW#',
      },
      scanIndexForward: false,
      limit: effectiveLimit,
      exclusiveStartKey: lastKey,
    });

    let items = result.items;
    if (approvedOnly) {
      items = items.filter((r) => r.isApproved);
    }

    const nextCursor = result.lastKey
      ? Buffer.from(JSON.stringify(result.lastKey)).toString('base64')
      : undefined;

    return {
      items: items.map((r) => this.mapReviewToResponse(r)),
      cursor: nextCursor,
      count: items.length,
    };
  }

  // ============================================
  // List All Reviews (Admin)
  // ============================================

  async listAllReviews(
    limit?: number,
    cursor?: string,
  ): Promise<ProductReviewListResponseDto> {
    const effectiveLimit = limit || 20;
    let lastKey: Record<string, unknown> | undefined;

    if (cursor) {
      try {
        lastKey = JSON.parse(Buffer.from(cursor, 'base64').toString('utf8'));
      } catch {
        lastKey = undefined;
      }
    }

    const result = await this.databaseService.query<ProductReviewEntity>('ProductReview', {
      indexName: 'GSI1',
      keyConditionExpression: 'GSI1PK = :gsi1pk',
      expressionAttributeValues: {
        ':gsi1pk': 'REVIEW',
      },
      scanIndexForward: false,
      limit: effectiveLimit,
      exclusiveStartKey: lastKey,
    });

    const nextCursor = result.lastKey
      ? Buffer.from(JSON.stringify(result.lastKey)).toString('base64')
      : undefined;

    return {
      items: result.items.map((r) => this.mapReviewToResponse(r)),
      cursor: nextCursor,
      count: result.items.length,
    };
  }

  // ============================================
  // Internal Helpers
  // ============================================

  private async findReviewById(reviewId: string): Promise<ProductReviewEntity | null> {
    // Reviews are stored under PRODUCT#<productId>, so we have to scan GSI1
    const result = await this.databaseService.query<ProductReviewEntity>('ProductReview', {
      indexName: 'GSI1',
      keyConditionExpression: 'GSI1PK = :gsi1pk',
      filterExpression: 'id = :id',
      expressionAttributeValues: {
        ':gsi1pk': 'REVIEW',
        ':id': reviewId,
      },
      limit: 1,
    });

    return result.items.length > 0 ? result.items[0] : null;
  }

  private async recalculateRating(productId: string): Promise<void> {
    // Get all approved reviews for this product
    const result = await this.databaseService.query<ProductReviewEntity>('ProductReview', {
      indexName: undefined,
      keyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      filterExpression: 'isApproved = :approved',
      expressionAttributeValues: {
        ':pk': `PRODUCT#${productId}`,
        ':sk': 'REVIEW#',
        ':approved': true,
      },
    });

    const approvedReviews = result.items;
    const totalReviews = approvedReviews.length;
    const avgRating =
      totalReviews > 0
        ? parseFloat(
            (
              approvedReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
            ).toFixed(1),
          )
        : 0;

    await this.productsService.updateProductRatingSummary(productId, avgRating, totalReviews);
  }

  private mapReviewToResponse(entity: ProductReviewEntity): ProductReviewResponseDto {
    return {
      id: entity.id,
      productId: entity.productId,
      productTitle: entity.productTitle,
      userId: entity.userId,
      userEmail: entity.userEmail || '',
      rating: entity.rating,
      reviewText: entity.reviewText,
      reviewTextHi: entity.reviewTextHi,
      isApproved: entity.isApproved,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
