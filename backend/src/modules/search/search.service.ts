import { Injectable, Inject } from '@nestjs/common';
import { DatabaseService, DATABASE_SERVICE } from '@/common/database';
import {
  SearchQueryDto,
  SearchResultDto,
  SearchProductResultDto,
  SearchEventResultDto,
  SearchPageResultDto,
  SearchEntityType,
} from './dto';

// ============================================
// Entity Interfaces (read-only projections)
// ============================================

interface ProductEntity {
  id: string;
  title: string;
  titleHi?: string;
  subtitle?: string;
  subtitleHi?: string;
  description: string;
  descriptionHi?: string;
  slug: string;
  price: number;
  originalPrice?: number;
  images: string[];
  categoryName: string;
  categoryNameHi?: string;
  isActive: boolean;
}

interface EventEntity {
  id: string;
  title: string;
  titleHi?: string;
  description?: string;
  descriptionHi?: string;
  slug: string;
  startDate?: string;
  endDate?: string;
  imageKey?: string;
  isActive: boolean;
}

interface CmsPageEntity {
  id: string;
  title: string;
  titleHi?: string;
  slug: string;
  excerpt?: string;
  excerptHi?: string;
  status: string;
}

@Injectable()
export class SearchService {
  constructor(
    @Inject(DATABASE_SERVICE)
    private readonly databaseService: DatabaseService,
  ) {}

  // ============================================
  // Global Search
  // ============================================

  async search(query: SearchQueryDto): Promise<SearchResultDto> {
    const searchQuery = (query.q || '').trim().toLowerCase();
    if (!searchQuery) {
      return { products: [], events: [], pages: [], totalResults: 0 };
    }

    const types: SearchEntityType[] = query.types || ['product', 'event', 'page'];
    const limit = query.limit || 10;
    const locale = query.locale || 'en';
    const isHindi = locale === 'hi';

    // Run searches in parallel for requested types
    const [products, events, pages] = await Promise.all([
      types.includes('product') ? this.searchProducts(searchQuery, limit, isHindi) : [],
      types.includes('event') ? this.searchEvents(searchQuery, limit, isHindi) : [],
      types.includes('page') ? this.searchPages(searchQuery, limit, isHindi) : [],
    ]);

    return {
      products,
      events,
      pages,
      totalResults: products.length + events.length + pages.length,
    };
  }

  // ============================================
  // Search Products
  // ============================================

  private async searchProducts(
    query: string,
    limit: number,
    isHindi: boolean,
  ): Promise<SearchProductResultDto[]> {
    const result = await this.databaseService.query<ProductEntity>('PRODUCT', {
      indexName: 'GSI1',
      keyConditionExpression: 'GSI1PK = :pk',
      expressionAttributeValues: { ':pk': 'PRODUCT' },
    });

    const filtered = result.items
      .filter((item) => {
        if (!item.isActive) return false;
        const title = String(isHindi && item.titleHi ? item.titleHi : item.title || '').toLowerCase();
        const description = String(
          isHindi && item.descriptionHi ? item.descriptionHi : item.description || ''
        ).toLowerCase();
        const subtitle = String(
          isHindi && item.subtitleHi ? item.subtitleHi : item.subtitle || ''
        ).toLowerCase();
        return (
          title.includes(query) ||
          description.includes(query) ||
          subtitle.includes(query)
        );
      })
      .slice(0, limit);

    return filtered.map((item) => ({
      id: item.id,
      title: isHindi && item.titleHi ? item.titleHi : item.title,
      subtitle: isHindi && item.subtitleHi ? item.subtitleHi : item.subtitle,
      slug: item.slug,
      price: item.price,
      originalPrice: item.originalPrice,
      images: item.images || [],
      categoryName: isHindi && item.categoryNameHi ? item.categoryNameHi : item.categoryName,
    }));
  }

  // ============================================
  // Search Events
  // ============================================

  private async searchEvents(
    query: string,
    limit: number,
    isHindi: boolean,
  ): Promise<SearchEventResultDto[]> {
    const result = await this.databaseService.query<EventEntity>('EVENT', {
      indexName: 'GSI1',
      keyConditionExpression: 'GSI1PK = :pk',
      expressionAttributeValues: { ':pk': 'EVENT' },
    });

    const filtered = result.items
      .filter((item) => {
        if (!item.isActive) return false;
        const title = String(isHindi && item.titleHi ? item.titleHi : item.title || '').toLowerCase();
        const description = String(
          isHindi && item.descriptionHi ? item.descriptionHi : item.description || ''
        ).toLowerCase();
        return title.includes(query) || description.includes(query);
      })
      .slice(0, limit);

    return filtered.map((item) => ({
      id: item.id,
      title: isHindi && item.titleHi ? item.titleHi : item.title,
      description: isHindi && item.descriptionHi ? item.descriptionHi : item.description,
      slug: item.slug,
      startDate: item.startDate,
      endDate: item.endDate,
      imageKey: item.imageKey,
    }));
  }

  // ============================================
  // Search CMS Pages
  // ============================================

  private async searchPages(
    query: string,
    limit: number,
    isHindi: boolean,
  ): Promise<SearchPageResultDto[]> {
    const result = await this.databaseService.query<CmsPageEntity>('CMS_PAGE', {
      indexName: 'GSI1',
      keyConditionExpression: 'GSI1PK = :pk',
      expressionAttributeValues: { ':pk': 'CMS_PAGE' },
    });

    const filtered = result.items
      .filter((item) => {
        if (item.status !== 'published') return false;
        const title = String(isHindi && item.titleHi ? item.titleHi : item.title || '').toLowerCase();
        const slug = String(item.slug || '').toLowerCase();
        return title.includes(query) || slug.includes(query);
      })
      .slice(0, limit);

    return filtered.map((item) => ({
      id: item.id,
      title: isHindi && item.titleHi ? item.titleHi : item.title,
      slug: item.slug,
      excerpt: isHindi && item.excerptHi ? item.excerptHi : item.excerpt,
    }));
  }
}
