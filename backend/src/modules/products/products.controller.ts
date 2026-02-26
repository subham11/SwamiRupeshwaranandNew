import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { ProductReviewsService } from './product-reviews.service';
import {
  CreateProductDto,
  UpdateProductDto,
  CreateProductCategoryDto,
  UpdateProductCategoryDto,
  CreateProductReviewDto,
  AdminUpdateReviewDto,
  ProductResponseDto,
  ProductListResponseDto,
  ProductCategoryResponseDto,
  ProductCategoryListResponseDto,
  ProductReviewResponseDto,
  ProductReviewListResponseDto,
  ProductListQueryDto,
} from './dto';
import { JwtAuthGuard, RolesGuard } from '@/common/guards';
import { Public, AdminOnly, CurrentUser, CurrentUserData } from '@/common/decorators';
import { StorageService, StorageFolder } from '@/common/storage';
import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ============================================
// Upload DTOs (specific to products)
// ============================================

class ProductPresignedUploadDto {
  @ApiProperty({ description: 'Original filename', example: 'product-front.jpg' })
  @IsString()
  fileName!: string;

  @ApiProperty({ description: 'File MIME type', example: 'image/jpeg' })
  @IsString()
  contentType!: string;

  @ApiPropertyOptional({ description: 'Expiration time in seconds', default: 3600 })
  @IsOptional()
  @IsNumber()
  @Min(300)
  @Max(86400)
  expiresIn?: number;
}

class PresignedUploadResponseDto {
  @ApiProperty() uploadUrl!: string;
  @ApiProperty() downloadUrl!: string;
  @ApiProperty() key!: string;
  @ApiProperty() expiresIn!: number;
}

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly reviewsService: ProductReviewsService,
    private readonly storageService: StorageService,
  ) {}

  // ============================================
  // Admin Upload Endpoints
  // ============================================

  @Post('upload/presigned-url')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get presigned URL for product image/video upload (Admin only)' })
  @ApiResponse({ status: 201, type: PresignedUploadResponseDto })
  async getPresignedUploadUrl(
    @Body() dto: ProductPresignedUploadDto,
  ): Promise<PresignedUploadResponseDto> {
    const result = await this.storageService.getPresignedUploadUrl(
      StorageFolder.PRODUCTS,
      dto.fileName,
      dto.contentType,
      dto.expiresIn || 3600,
    );
    return {
      uploadUrl: result.uploadUrl,
      downloadUrl: result.downloadUrl,
      key: result.key,
      expiresIn: result.expiresIn,
    };
  }

  // ============================================
  // Admin Product Endpoints
  // ============================================

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a product (Admin only)' })
  @ApiResponse({ status: 201, type: ProductResponseDto })
  async createProduct(@Body() dto: CreateProductDto): Promise<ProductResponseDto> {
    return this.productsService.createProduct(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update a product (Admin only)' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, type: ProductResponseDto })
  async updateProduct(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    return this.productsService.updateProduct(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete a product (Admin only)' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Deleted' })
  async deleteProduct(@Param('id') id: string): Promise<void> {
    return this.productsService.deleteProduct(id);
  }

  @Get('admin/list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List all products including drafts (Admin only)' })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiResponse({ status: 200, type: ProductListResponseDto })
  async listProductsAdmin(
    @Query() query: ProductListQueryDto,
  ): Promise<ProductListResponseDto> {
    return this.productsService.listProductsAdmin(query);
  }

  // ============================================
  // Admin Category Endpoints
  // ============================================

  @Post('categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a product category (Admin only)' })
  @ApiResponse({ status: 201, type: ProductCategoryResponseDto })
  async createCategory(
    @Body() dto: CreateProductCategoryDto,
  ): Promise<ProductCategoryResponseDto> {
    return this.productsService.createCategory(dto);
  }

  @Put('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update a product category (Admin only)' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiResponse({ status: 200, type: ProductCategoryResponseDto })
  async updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateProductCategoryDto,
  ): Promise<ProductCategoryResponseDto> {
    return this.productsService.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete a product category (Admin only)' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiResponse({ status: 200, description: 'Deleted' })
  async deleteCategory(@Param('id') id: string): Promise<void> {
    return this.productsService.deleteCategory(id);
  }

  // ============================================
  // Admin Review Endpoints
  // ============================================

  @Get('reviews/admin/list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List all reviews (Admin only)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiResponse({ status: 200, type: ProductReviewListResponseDto })
  async listAllReviews(
    @Query('limit') limit?: number,
    @Query('cursor') cursor?: string,
  ): Promise<ProductReviewListResponseDto> {
    return this.reviewsService.listAllReviews(limit, cursor);
  }

  @Put('reviews/:reviewId/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Approve or reject a review (Admin only)' })
  @ApiParam({ name: 'reviewId', description: 'Review ID' })
  @ApiResponse({ status: 200, type: ProductReviewResponseDto })
  async approveReview(
    @Param('reviewId') reviewId: string,
    @Body() dto: AdminUpdateReviewDto,
  ): Promise<ProductReviewResponseDto> {
    return this.reviewsService.adminUpdateReview(reviewId, dto);
  }

  @Delete('reviews/:reviewId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete a review (Admin only)' })
  @ApiParam({ name: 'reviewId', description: 'Review ID' })
  @ApiResponse({ status: 200, description: 'Deleted' })
  async deleteReview(@Param('reviewId') reviewId: string): Promise<void> {
    return this.reviewsService.deleteReview(reviewId);
  }

  // ============================================
  // Public Endpoints
  // ============================================

  @Get('public')
  @Public()
  @ApiOperation({ summary: 'List active products (public)' })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'featured', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'locale', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiResponse({ status: 200, type: ProductListResponseDto })
  async listPublicProducts(
    @Query() query: ProductListQueryDto,
  ): Promise<ProductListResponseDto> {
    return this.productsService.listProducts(query);
  }

  @Get('public/featured')
  @Public()
  @ApiOperation({ summary: 'List featured products for carousel (public)' })
  @ApiResponse({ status: 200, type: ProductListResponseDto })
  async listFeaturedProducts(): Promise<ProductListResponseDto> {
    return this.productsService.listFeaturedProducts();
  }

  @Get('public/categories')
  @Public()
  @ApiOperation({ summary: 'List active product categories (public)' })
  @ApiResponse({ status: 200, type: ProductCategoryListResponseDto })
  async listPublicCategories(): Promise<ProductCategoryListResponseDto> {
    return this.productsService.listCategories(true);
  }

  @Get('public/category/:categorySlug')
  @Public()
  @ApiOperation({ summary: 'List products in a category by slug (public)' })
  @ApiParam({ name: 'categorySlug', description: 'Category slug' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiResponse({ status: 200, type: ProductListResponseDto })
  async listProductsByCategorySlug(
    @Param('categorySlug') categorySlug: string,
    @Query('limit') limit?: number,
    @Query('cursor') cursor?: string,
  ): Promise<ProductListResponseDto> {
    return this.productsService.listProductsByCategorySlug(categorySlug, limit, cursor);
  }

  @Get('public/:slug')
  @Public()
  @ApiOperation({ summary: 'Get product detail by slug (public)' })
  @ApiParam({ name: 'slug', description: 'Product slug' })
  @ApiResponse({ status: 200, type: ProductResponseDto })
  async getProductBySlug(@Param('slug') slug: string): Promise<ProductResponseDto> {
    return this.productsService.getProductBySlug(slug);
  }

  // ============================================
  // User Review Endpoints
  // ============================================

  @Post(':productId/reviews')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Submit a product review (authenticated users)' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiResponse({ status: 201, type: ProductReviewResponseDto })
  async createReview(
    @Param('productId') productId: string,
    @Body() dto: CreateProductReviewDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<ProductReviewResponseDto> {
    return this.reviewsService.createReview(user.sub, user.email, productId, dto);
  }

  @Get(':productId/reviews')
  @Public()
  @ApiOperation({ summary: 'List approved reviews for a product (public)' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiResponse({ status: 200, type: ProductReviewListResponseDto })
  async listProductReviews(
    @Param('productId') productId: string,
    @Query('limit') limit?: number,
    @Query('cursor') cursor?: string,
  ): Promise<ProductReviewListResponseDto> {
    return this.reviewsService.listReviewsByProduct(productId, true, limit, cursor);
  }
}
