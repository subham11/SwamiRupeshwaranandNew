import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService, DATABASE_SERVICE } from '@/common/database';
import { StorageService } from '@/common/storage';
import {
  CreateProductDto,
  UpdateProductDto,
  CreateProductCategoryDto,
  UpdateProductCategoryDto,
  ProductResponseDto,
  ProductListResponseDto,
  ProductCategoryResponseDto,
  ProductCategoryListResponseDto,
  ProductListQueryDto,
  StockStatus,
} from './dto';

// ============================================
// Entity Interfaces (DynamoDB Single-Table)
// ============================================

interface ProductEntity {
  PK: string;
  SK: string;
  GSI1PK: string;
  GSI1SK: string;
  GSI2PK: string;
  GSI2SK: string;
  id: string;
  title: string;
  titleHi?: string;
  subtitle?: string;
  subtitleHi?: string;
  description: string;
  descriptionHi?: string;
  slug: string;
  categoryId: string;
  categoryName: string;
  categoryNameHi?: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  images: string[];
  videoKey?: string;
  weight?: string;
  weightHi?: string;
  tags: string[];
  stockStatus: StockStatus;
  isFeatured: boolean;
  isActive: boolean;
  displayOrder: number;
  avgRating: number;
  totalReviews: number;
  purchaseLink?: string;
  purchaseLinkHi?: string;
  createdAt: string;
  updatedAt: string;
}

interface ProductCategoryEntity {
  PK: string;
  SK: string;
  GSI1PK: string;
  GSI1SK: string;
  id: string;
  name: string;
  nameHi?: string;
  description?: string;
  descriptionHi?: string;
  slug: string;
  imageKey?: string;
  isActive: boolean;
  displayOrder: number;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class ProductsService {
  private readonly productEntity = 'PRODUCT';
  private readonly categoryEntity = 'PRODUCT_CATEGORY';

  constructor(
    @Inject(DATABASE_SERVICE)
    private readonly databaseService: DatabaseService,
    private readonly storageService: StorageService,
  ) {}

  // ============================================
  // Slug helpers
  // ============================================

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 80);
  }

  private async ensureUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
    let slug = baseSlug;
    let attempt = 0;
    while (attempt < 10) {
      const existing = await this.findProductBySlugInternal(slug);
      if (!existing || existing.id === excludeId) return slug;
      attempt++;
      slug = `${baseSlug}-${attempt}`;
    }
    return `${baseSlug}-${uuidv4().slice(0, 6)}`;
  }

  private async ensureUniqueCategorySlug(baseSlug: string, excludeId?: string): Promise<string> {
    let slug = baseSlug;
    let attempt = 0;
    while (attempt < 10) {
      const existing = await this.findCategoryBySlugInternal(slug);
      if (!existing || existing.id === excludeId) return slug;
      attempt++;
      slug = `${baseSlug}-${attempt}`;
    }
    return `${baseSlug}-${uuidv4().slice(0, 6)}`;
  }

  // ============================================
  // Product CRUD
  // ============================================

  async createProduct(dto: CreateProductDto): Promise<ProductResponseDto> {
    // Verify category exists
    const category = await this.getCategoryEntityById(dto.categoryId);
    if (!category) {
      throw new NotFoundException(`Product category with ID ${dto.categoryId} not found`);
    }

    const id = uuidv4();
    const slug = await this.ensureUniqueSlug(this.generateSlug(dto.title));
    const now = new Date().toISOString();
    const discountPercent =
      dto.originalPrice && dto.originalPrice > dto.price
        ? Math.round(((dto.originalPrice - dto.price) / dto.originalPrice) * 100)
        : 0;

    const product: ProductEntity = {
      PK: `${this.productEntity}#${id}`,
      SK: `${this.productEntity}#${id}`,
      GSI1PK: this.productEntity,
      GSI1SK: `${this.productEntity}#${now}`,
      GSI2PK: `CATEGORY#${dto.categoryId}`,
      GSI2SK: `${this.productEntity}#${String(dto.displayOrder || 0).padStart(5, '0')}`,
      id,
      title: dto.title,
      titleHi: dto.titleHi,
      subtitle: dto.subtitle,
      subtitleHi: dto.subtitleHi,
      description: dto.description,
      descriptionHi: dto.descriptionHi,
      slug,
      categoryId: dto.categoryId,
      categoryName: category.name,
      categoryNameHi: category.nameHi,
      price: dto.price,
      originalPrice: dto.originalPrice,
      discountPercent,
      images: dto.images || [],
      videoKey: dto.videoKey,
      weight: dto.weight,
      weightHi: dto.weightHi,
      tags: dto.tags || [],
      stockStatus: dto.stockStatus || StockStatus.IN_STOCK,
      isFeatured: dto.isFeatured ?? false,
      isActive: dto.isActive ?? true,
      displayOrder: dto.displayOrder || 0,
      avgRating: 0,
      totalReviews: 0,
      purchaseLink: dto.purchaseLink,
      purchaseLinkHi: dto.purchaseLinkHi,
      createdAt: now,
      updatedAt: now,
    };

    await this.databaseService.put(product);

    // Increment category product count
    await this.updateCategoryProductCount(dto.categoryId, 1);

    return this.mapProductToResponse(product);
  }

  async updateProduct(id: string, dto: UpdateProductDto): Promise<ProductResponseDto> {
    const existing = await this.getProductEntityById(id);
    if (!existing) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // If category changed, validate new category & update counts
    if (dto.categoryId && dto.categoryId !== existing.categoryId) {
      const newCategory = await this.getCategoryEntityById(dto.categoryId);
      if (!newCategory) {
        throw new NotFoundException(`Product category with ID ${dto.categoryId} not found`);
      }
      (dto as any)._categoryName = newCategory.name;
      (dto as any)._categoryNameHi = newCategory.nameHi;
    }

    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    const fieldsToUpdate = [
      'title', 'titleHi', 'subtitle', 'subtitleHi',
      'description', 'descriptionHi', 'categoryId',
      'price', 'originalPrice', 'images', 'videoKey',
      'weight', 'weightHi', 'tags', 'stockStatus',
      'isFeatured', 'isActive', 'displayOrder',
      'purchaseLink', 'purchaseLinkHi',
    ];

    for (const field of fieldsToUpdate) {
      if ((dto as any)[field] !== undefined) {
        updateExpressions.push(`#${field} = :${field}`);
        expressionAttributeNames[`#${field}`] = field;
        expressionAttributeValues[`:${field}`] = (dto as any)[field];
      }
    }

    // Handle category denormalization
    if ((dto as any)._categoryName) {
      updateExpressions.push('categoryName = :categoryName');
      expressionAttributeValues[':categoryName'] = (dto as any)._categoryName;
      if ((dto as any)._categoryNameHi) {
        updateExpressions.push('categoryNameHi = :categoryNameHi');
        expressionAttributeValues[':categoryNameHi'] = (dto as any)._categoryNameHi;
      }
    }

    // Recalculate discount
    const effectivePrice = dto.price ?? existing.price;
    const effectiveOriginalPrice = dto.originalPrice ?? existing.originalPrice;
    if (effectiveOriginalPrice && effectiveOriginalPrice > effectivePrice) {
      const discount = Math.round(
        ((effectiveOriginalPrice - effectivePrice) / effectiveOriginalPrice) * 100,
      );
      updateExpressions.push('discountPercent = :discountPercent');
      expressionAttributeValues[':discountPercent'] = discount;
    }

    // Update slug if title changed
    if (dto.title && dto.title !== existing.title) {
      const newSlug = await this.ensureUniqueSlug(this.generateSlug(dto.title), id);
      updateExpressions.push('slug = :slug');
      expressionAttributeValues[':slug'] = newSlug;
    }

    // Update GSI2 if category or displayOrder changed
    if (dto.categoryId || dto.displayOrder !== undefined) {
      const newCategoryId = dto.categoryId || existing.categoryId;
      const newOrder = dto.displayOrder ?? existing.displayOrder;
      updateExpressions.push('GSI2PK = :gsi2pk');
      expressionAttributeValues[':gsi2pk'] = `CATEGORY#${newCategoryId}`;
      updateExpressions.push('GSI2SK = :gsi2sk');
      expressionAttributeValues[':gsi2sk'] = `${this.productEntity}#${String(newOrder).padStart(5, '0')}`;
    }

    updateExpressions.push('updatedAt = :updatedAt');
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    if (updateExpressions.length === 1) {
      return this.mapProductToResponse(existing);
    }

    const updated = await this.databaseService.update<ProductEntity>(this.productEntity, {
      key: {
        PK: `${this.productEntity}#${id}`,
        SK: `${this.productEntity}#${id}`,
      },
      updateExpression: `SET ${updateExpressions.join(', ')}`,
      expressionAttributeNames:
        Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
      expressionAttributeValues,
    });

    // Update category product counts if category changed
    if (dto.categoryId && dto.categoryId !== existing.categoryId) {
      await this.updateCategoryProductCount(existing.categoryId, -1);
      await this.updateCategoryProductCount(dto.categoryId, 1);
    }

    return this.mapProductToResponse(updated);
  }

  async deleteProduct(id: string): Promise<void> {
    const existing = await this.getProductEntityById(id);
    if (!existing) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    await this.databaseService.delete(
      `${this.productEntity}#${id}`,
      `${this.productEntity}#${id}`,
    );

    // Decrement category product count
    await this.updateCategoryProductCount(existing.categoryId, -1);
  }

  async getProductById(id: string): Promise<ProductResponseDto> {
    const product = await this.getProductEntityById(id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return this.mapProductToResponse(product);
  }

  async getProductBySlug(slug: string): Promise<ProductResponseDto> {
    const product = await this.findProductBySlugInternal(slug);
    if (!product) {
      throw new NotFoundException(`Product with slug "${slug}" not found`);
    }
    return this.mapProductToResponse(product);
  }

  async listProducts(query: ProductListQueryDto): Promise<ProductListResponseDto> {
    const limit = query.limit || 10;

    // If filtering by category, use GSI2
    if (query.categoryId) {
      return this.listProductsByCategory(query.categoryId, limit, query.cursor);
    }

    // Otherwise use GSI1 for all products
    const exclusiveStartKey = query.cursor
      ? JSON.parse(Buffer.from(query.cursor, 'base64').toString())
      : undefined;

    const result = await this.databaseService.query<ProductEntity>(this.productEntity, {
      indexName: 'GSI1',
      keyConditionExpression: 'GSI1PK = :pk',
      expressionAttributeValues: {
        ':pk': this.productEntity,
      },
      scanIndexForward: false,
      limit,
      exclusiveStartKey,
    });

    let items = result.items;

    // Apply filters
    if (query.featured !== undefined) {
      items = items.filter((p) => p.isFeatured === query.featured);
    }
    if (query.search) {
      const searchLower = query.search.toLowerCase();
      items = items.filter(
        (p) =>
          p.title.toLowerCase().includes(searchLower) ||
          p.titleHi?.toLowerCase().includes(searchLower) ||
          p.tags.some((t) => t.toLowerCase().includes(searchLower)),
      );
    }

    // Only active for public
    items = items.filter((p) => p.isActive);

    const cursor = result.lastKey
      ? Buffer.from(JSON.stringify(result.lastKey)).toString('base64')
      : undefined;

    return {
      items: items.map((p) => this.mapProductToResponse(p)),
      count: items.length,
      cursor,
    };
  }

  async listProductsAdmin(query: ProductListQueryDto): Promise<ProductListResponseDto> {
    const limit = query.limit || 50;

    const exclusiveStartKey = query.cursor
      ? JSON.parse(Buffer.from(query.cursor, 'base64').toString())
      : undefined;

    let filterExpression: string | undefined;
    const expressionAttributeValues: Record<string, any> = {
      ':pk': this.productEntity,
    };

    if (query.categoryId) {
      filterExpression = 'categoryId = :categoryId';
      expressionAttributeValues[':categoryId'] = query.categoryId;
    }

    const result = await this.databaseService.query<ProductEntity>(this.productEntity, {
      indexName: 'GSI1',
      keyConditionExpression: 'GSI1PK = :pk',
      filterExpression,
      expressionAttributeValues,
      scanIndexForward: false,
      limit,
      exclusiveStartKey,
    });

    const cursor = result.lastKey
      ? Buffer.from(JSON.stringify(result.lastKey)).toString('base64')
      : undefined;

    return {
      items: result.items.map((p) => this.mapProductToResponse(p)),
      count: result.items.length,
      cursor,
    };
  }

  async listFeaturedProducts(): Promise<ProductListResponseDto> {
    const result = await this.databaseService.query<ProductEntity>(this.productEntity, {
      indexName: 'GSI1',
      keyConditionExpression: 'GSI1PK = :pk',
      filterExpression: 'isFeatured = :featured AND isActive = :active',
      expressionAttributeValues: {
        ':pk': this.productEntity,
        ':featured': true,
        ':active': true,
      },
      scanIndexForward: false,
    });

    return {
      items: result.items.map((p) => this.mapProductToResponse(p)),
      count: result.items.length,
    };
  }

  async listProductsByCategory(
    categoryId: string,
    limit = 10,
    cursor?: string,
  ): Promise<ProductListResponseDto> {
    const exclusiveStartKey = cursor
      ? JSON.parse(Buffer.from(cursor, 'base64').toString())
      : undefined;

    const result = await this.databaseService.query<ProductEntity>(this.productEntity, {
      indexName: 'GSI2',
      keyConditionExpression: 'GSI2PK = :pk',
      filterExpression: 'isActive = :active',
      expressionAttributeValues: {
        ':pk': `CATEGORY#${categoryId}`,
        ':active': true,
      },
      scanIndexForward: true,
      limit,
      exclusiveStartKey,
    });

    const nextCursor = result.lastKey
      ? Buffer.from(JSON.stringify(result.lastKey)).toString('base64')
      : undefined;

    return {
      items: result.items.map((p) => this.mapProductToResponse(p)),
      count: result.items.length,
      cursor: nextCursor,
    };
  }

  async listProductsByCategorySlug(
    categorySlug: string,
    limit = 10,
    cursor?: string,
  ): Promise<ProductListResponseDto> {
    const category = await this.findCategoryBySlugInternal(categorySlug);
    if (!category) {
      throw new NotFoundException(`Category with slug "${categorySlug}" not found`);
    }
    return this.listProductsByCategory(category.id, limit, cursor);
  }

  // ============================================
  // Category CRUD
  // ============================================

  async createCategory(dto: CreateProductCategoryDto): Promise<ProductCategoryResponseDto> {
    const id = uuidv4();
    const slug = await this.ensureUniqueCategorySlug(this.generateSlug(dto.name));
    const now = new Date().toISOString();

    const category: ProductCategoryEntity = {
      PK: `${this.categoryEntity}#${id}`,
      SK: `${this.categoryEntity}#${id}`,
      GSI1PK: this.categoryEntity,
      GSI1SK: `${this.categoryEntity}#${String(dto.displayOrder || 0).padStart(5, '0')}`,
      id,
      name: dto.name,
      nameHi: dto.nameHi,
      description: dto.description,
      descriptionHi: dto.descriptionHi,
      slug,
      imageKey: dto.imageKey,
      isActive: dto.isActive ?? true,
      displayOrder: dto.displayOrder || 0,
      productCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    await this.databaseService.put(category);
    return this.mapCategoryToResponse(category);
  }

  async updateCategory(
    id: string,
    dto: UpdateProductCategoryDto,
  ): Promise<ProductCategoryResponseDto> {
    const existing = await this.getCategoryEntityById(id);
    if (!existing) {
      throw new NotFoundException(`Product category with ID ${id} not found`);
    }

    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    const fieldsToUpdate = [
      'name', 'nameHi', 'description', 'descriptionHi',
      'imageKey', 'isActive', 'displayOrder',
    ];

    for (const field of fieldsToUpdate) {
      if ((dto as any)[field] !== undefined) {
        updateExpressions.push(`#${field} = :${field}`);
        expressionAttributeNames[`#${field}`] = field;
        expressionAttributeValues[`:${field}`] = (dto as any)[field];
      }
    }

    // Update slug if name changed
    if (dto.name && dto.name !== existing.name) {
      const newSlug = await this.ensureUniqueCategorySlug(this.generateSlug(dto.name), id);
      updateExpressions.push('slug = :slug');
      expressionAttributeValues[':slug'] = newSlug;
    }

    // Update GSI1SK if displayOrder changed
    if (dto.displayOrder !== undefined) {
      updateExpressions.push('GSI1SK = :gsi1sk');
      expressionAttributeValues[':gsi1sk'] = `${this.categoryEntity}#${String(dto.displayOrder).padStart(5, '0')}`;
    }

    updateExpressions.push('updatedAt = :updatedAt');
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    if (updateExpressions.length === 1) {
      return this.mapCategoryToResponse(existing);
    }

    const updated = await this.databaseService.update<ProductCategoryEntity>(
      this.categoryEntity,
      {
        key: {
          PK: `${this.categoryEntity}#${id}`,
          SK: `${this.categoryEntity}#${id}`,
        },
        updateExpression: `SET ${updateExpressions.join(', ')}`,
        expressionAttributeNames:
          Object.keys(expressionAttributeNames).length > 0
            ? expressionAttributeNames
            : undefined,
        expressionAttributeValues,
      },
    );

    return this.mapCategoryToResponse(updated);
  }

  async deleteCategory(id: string): Promise<void> {
    const existing = await this.getCategoryEntityById(id);
    if (!existing) {
      throw new NotFoundException(`Product category with ID ${id} not found`);
    }

    if (existing.productCount > 0) {
      throw new ConflictException(
        `Cannot delete category with ${existing.productCount} products. Move or delete products first.`,
      );
    }

    await this.databaseService.delete(
      `${this.categoryEntity}#${id}`,
      `${this.categoryEntity}#${id}`,
    );
  }

  async listCategories(activeOnly = false): Promise<ProductCategoryListResponseDto> {
    const result = await this.databaseService.query<ProductCategoryEntity>(this.categoryEntity, {
      indexName: 'GSI1',
      keyConditionExpression: 'GSI1PK = :pk',
      expressionAttributeValues: {
        ':pk': this.categoryEntity,
      },
      scanIndexForward: true,
    });

    let items = result.items;
    if (activeOnly) {
      items = items.filter((c) => c.isActive);
    }

    return {
      items: items.map((c) => this.mapCategoryToResponse(c)),
      count: items.length,
    };
  }

  async getCategoryById(id: string): Promise<ProductCategoryResponseDto> {
    const category = await this.getCategoryEntityById(id);
    if (!category) {
      throw new NotFoundException(`Product category with ID ${id} not found`);
    }
    return this.mapCategoryToResponse(category);
  }

  // ============================================
  // Rating Summary (called from review service)
  // ============================================

  async updateProductRatingSummary(
    productId: string,
    avgRating: number,
    totalReviews: number,
  ): Promise<void> {
    await this.databaseService.update(this.productEntity, {
      key: {
        PK: `${this.productEntity}#${productId}`,
        SK: `${this.productEntity}#${productId}`,
      },
      updateExpression: 'SET avgRating = :avgRating, totalReviews = :totalReviews, updatedAt = :updatedAt',
      expressionAttributeValues: {
        ':avgRating': avgRating,
        ':totalReviews': totalReviews,
        ':updatedAt': new Date().toISOString(),
      },
    });
  }

  // ============================================
  // Internal helpers
  // ============================================

  private async getProductEntityById(id: string): Promise<ProductEntity | null> {
    return this.databaseService.get<ProductEntity>(
      `${this.productEntity}#${id}`,
      `${this.productEntity}#${id}`,
    );
  }

  private async findProductBySlugInternal(slug: string): Promise<ProductEntity | null> {
    // Scan with slug filter (acceptable for slug lookup which is infrequent)
    const result = await this.databaseService.query<ProductEntity>(this.productEntity, {
      indexName: 'GSI1',
      keyConditionExpression: 'GSI1PK = :pk',
      filterExpression: 'slug = :slug',
      expressionAttributeValues: {
        ':pk': this.productEntity,
        ':slug': slug,
      },
      limit: 1,
    });
    return result.items[0] || null;
  }

  private async getCategoryEntityById(id: string): Promise<ProductCategoryEntity | null> {
    return this.databaseService.get<ProductCategoryEntity>(
      `${this.categoryEntity}#${id}`,
      `${this.categoryEntity}#${id}`,
    );
  }

  private async findCategoryBySlugInternal(slug: string): Promise<ProductCategoryEntity | null> {
    const result = await this.databaseService.query<ProductCategoryEntity>(this.categoryEntity, {
      indexName: 'GSI1',
      keyConditionExpression: 'GSI1PK = :pk',
      filterExpression: 'slug = :slug',
      expressionAttributeValues: {
        ':pk': this.categoryEntity,
        ':slug': slug,
      },
      limit: 1,
    });
    return result.items[0] || null;
  }

  private async updateCategoryProductCount(
    categoryId: string,
    increment: number,
  ): Promise<void> {
    try {
      await this.databaseService.update(this.categoryEntity, {
        key: {
          PK: `${this.categoryEntity}#${categoryId}`,
          SK: `${this.categoryEntity}#${categoryId}`,
        },
        updateExpression: 'SET productCount = if_not_exists(productCount, :zero) + :inc',
        expressionAttributeValues: {
          ':inc': increment,
          ':zero': 0,
        },
      });
    } catch {
      // Non-critical — don't fail the product operation
    }
  }

  // ============================================
  // Response Mappers
  // ============================================

  private mapProductToResponse = (product: ProductEntity): ProductResponseDto => {
    return {
      id: product.id,
      title: product.title,
      titleHi: product.titleHi,
      subtitle: product.subtitle,
      subtitleHi: product.subtitleHi,
      description: product.description,
      descriptionHi: product.descriptionHi,
      slug: product.slug,
      categoryId: product.categoryId,
      categoryName: product.categoryName,
      categoryNameHi: product.categoryNameHi,
      price: product.price,
      originalPrice: product.originalPrice,
      discountPercent: product.discountPercent,
      images: product.images,
      imageUrls: product.images?.map((key) => this.storageService.getPublicUrl(key)) || [],
      videoKey: product.videoKey,
      videoUrl: product.videoKey
        ? this.storageService.getPublicUrl(product.videoKey)
        : undefined,
      weight: product.weight,
      weightHi: product.weightHi,
      tags: product.tags,
      stockStatus: product.stockStatus,
      isFeatured: product.isFeatured,
      isActive: product.isActive,
      displayOrder: product.displayOrder,
      avgRating: product.avgRating,
      totalReviews: product.totalReviews,
      purchaseLink: product.purchaseLink,
      purchaseLinkHi: product.purchaseLinkHi,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  };

  private mapCategoryToResponse = (category: ProductCategoryEntity): ProductCategoryResponseDto => {
    return {
      id: category.id,
      name: category.name,
      nameHi: category.nameHi,
      description: category.description,
      descriptionHi: category.descriptionHi,
      slug: category.slug,
      imageKey: category.imageKey,
      imageUrl: category.imageKey
        ? this.storageService.getPublicUrl(category.imageKey)
        : undefined,
      isActive: category.isActive,
      displayOrder: category.displayOrder,
      productCount: category.productCount,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  };
}
