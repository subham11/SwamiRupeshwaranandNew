import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  Min,
  Max,
  MinLength,
  MaxLength,
  IsInt,
  ArrayMaxSize,
} from 'class-validator';

// ============================================
// Enums
// ============================================

export enum StockStatus {
  IN_STOCK = 'in_stock',
  OUT_OF_STOCK = 'out_of_stock',
  LIMITED = 'limited',
}

// ============================================
// Product DTOs
// ============================================

export class CreateProductDto {
  @ApiProperty({ description: 'Product title (English)', example: 'Raw Wild Forest Honey' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ description: 'Product title (Hindi)', example: 'कच्चा जंगली शहद' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  titleHi?: string;

  @ApiPropertyOptional({ description: 'Short subtitle (English)', example: 'Pure & Unprocessed' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  subtitle?: string;

  @ApiPropertyOptional({ description: 'Short subtitle (Hindi)', example: 'शुद्ध और अप्रसंस्कृत' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  subtitleHi?: string;

  @ApiProperty({ description: 'Full description (English)' })
  @IsString()
  @MinLength(10)
  description!: string;

  @ApiPropertyOptional({ description: 'Full description (Hindi)' })
  @IsOptional()
  @IsString()
  descriptionHi?: string;

  @ApiProperty({ description: 'Category ID', example: 'cat-uuid' })
  @IsString()
  categoryId!: string;

  @ApiProperty({ description: 'Selling price in INR', example: 499 })
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiPropertyOptional({ description: 'Original / MRP price in INR', example: 699 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  originalPrice?: number;

  @ApiPropertyOptional({ description: 'Image S3 keys (max 5)', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(5)
  images?: string[];

  @ApiPropertyOptional({ description: 'Video S3 key' })
  @IsOptional()
  @IsString()
  videoKey?: string;

  @ApiPropertyOptional({ description: 'Product weight/size label', example: '500g' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  weight?: string;

  @ApiPropertyOptional({ description: 'Product weight/size label (Hindi)', example: '500 ग्राम' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  weightHi?: string;

  @ApiPropertyOptional({ description: 'Search/filter tags', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ enum: StockStatus, default: StockStatus.IN_STOCK })
  @IsOptional()
  @IsEnum(StockStatus)
  stockStatus?: StockStatus;

  @ApiPropertyOptional({ description: 'Show in home carousel', default: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ description: 'Published or draft', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Display order', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @ApiPropertyOptional({ description: 'External purchase link' })
  @IsOptional()
  @IsString()
  purchaseLink?: string;

  @ApiPropertyOptional({ description: 'External purchase link (Hindi)' })
  @IsOptional()
  @IsString()
  purchaseLinkHi?: string;
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}

// ============================================
// Product Category DTOs
// ============================================

export class CreateProductCategoryDto {
  @ApiProperty({ description: 'Category name (English)', example: 'Honey' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ description: 'Category name (Hindi)', example: 'शहद' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nameHi?: string;

  @ApiPropertyOptional({ description: 'Category description (English)' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: 'Category description (Hindi)' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  descriptionHi?: string;

  @ApiPropertyOptional({ description: 'Category thumbnail S3 key' })
  @IsOptional()
  @IsString()
  imageKey?: string;

  @ApiPropertyOptional({ description: 'Active/inactive', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Display order', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;
}

export class UpdateProductCategoryDto extends PartialType(CreateProductCategoryDto) {}

// ============================================
// Product Review DTOs
// ============================================

export class CreateProductReviewDto {
  @ApiProperty({ description: 'Rating 1-5', example: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @ApiPropertyOptional({ description: 'Review text (English)' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reviewText?: string;

  @ApiPropertyOptional({ description: 'Review text (Hindi)' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reviewTextHi?: string;
}

export class AdminUpdateReviewDto {
  @ApiPropertyOptional({ description: 'Approve or reject review' })
  @IsOptional()
  @IsBoolean()
  isApproved?: boolean;

  @ApiPropertyOptional({ description: 'Review text (English)' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reviewText?: string;

  @ApiPropertyOptional({ description: 'Review text (Hindi)' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reviewTextHi?: string;
}

// ============================================
// Query DTOs
// ============================================

export class ProductListQueryDto {
  @ApiPropertyOptional({ description: 'Filter by category ID' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Filter featured only' })
  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @ApiPropertyOptional({ description: 'Search text' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Locale for response fields', example: 'hi' })
  @IsOptional()
  @IsString()
  locale?: string;

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;

  @ApiPropertyOptional({ description: 'Cursor for pagination (base64 lastEvaluatedKey)' })
  @IsOptional()
  @IsString()
  cursor?: string;
}

// ============================================
// Response DTOs
// ============================================

export class ProductResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() title!: string;
  @ApiPropertyOptional() titleHi?: string;
  @ApiPropertyOptional() subtitle?: string;
  @ApiPropertyOptional() subtitleHi?: string;
  @ApiProperty() description!: string;
  @ApiPropertyOptional() descriptionHi?: string;
  @ApiProperty() slug!: string;
  @ApiProperty() categoryId!: string;
  @ApiProperty() categoryName!: string;
  @ApiPropertyOptional() categoryNameHi?: string;
  @ApiProperty() price!: number;
  @ApiPropertyOptional() originalPrice?: number;
  @ApiPropertyOptional() discountPercent?: number;
  @ApiPropertyOptional({ type: [String] }) images?: string[];
  @ApiPropertyOptional({ type: [String] }) imageUrls?: string[];
  @ApiPropertyOptional() videoKey?: string;
  @ApiPropertyOptional() videoUrl?: string;
  @ApiPropertyOptional() weight?: string;
  @ApiPropertyOptional() weightHi?: string;
  @ApiPropertyOptional({ type: [String] }) tags?: string[];
  @ApiProperty({ enum: StockStatus }) stockStatus!: StockStatus;
  @ApiProperty() isFeatured!: boolean;
  @ApiProperty() isActive!: boolean;
  @ApiProperty() displayOrder!: number;
  @ApiPropertyOptional() avgRating?: number;
  @ApiPropertyOptional() totalReviews?: number;
  @ApiPropertyOptional() purchaseLink?: string;
  @ApiPropertyOptional() purchaseLinkHi?: string;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
}

export class ProductListResponseDto {
  @ApiProperty({ type: [ProductResponseDto] }) items!: ProductResponseDto[];
  @ApiProperty() count!: number;
  @ApiPropertyOptional() cursor?: string;
}

export class ProductCategoryResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiPropertyOptional() nameHi?: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() descriptionHi?: string;
  @ApiProperty() slug!: string;
  @ApiPropertyOptional() imageKey?: string;
  @ApiPropertyOptional() imageUrl?: string;
  @ApiProperty() isActive!: boolean;
  @ApiProperty() displayOrder!: number;
  @ApiPropertyOptional() productCount?: number;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
}

export class ProductCategoryListResponseDto {
  @ApiProperty({ type: [ProductCategoryResponseDto] }) items!: ProductCategoryResponseDto[];
  @ApiProperty() count!: number;
}

export class ProductReviewResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() productId!: string;
  @ApiPropertyOptional() productTitle?: string;
  @ApiProperty() userId!: string;
  @ApiProperty() userEmail!: string;
  @ApiProperty() rating!: number;
  @ApiPropertyOptional() reviewText?: string;
  @ApiPropertyOptional() reviewTextHi?: string;
  @ApiProperty() isApproved!: boolean;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
}

export class ProductReviewListResponseDto {
  @ApiProperty({ type: [ProductReviewResponseDto] }) items!: ProductReviewResponseDto[];
  @ApiProperty() count!: number;
  @ApiPropertyOptional() cursor?: string;
}
