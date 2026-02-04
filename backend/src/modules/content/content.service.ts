import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService, DATABASE_SERVICE } from '@/common/database';
import { CreateContentDto, UpdateContentDto, ContentResponseDto, ContentListResponseDto } from './dto';

interface ContentEntity {
  PK: string;
  SK: string;
  GSI1PK: string;
  GSI1SK: string;
  id: string;
  type: string;
  locale: string;
  slug: string;
  title: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  metadata?: Record<string, any>;
  status: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class ContentService {
  private readonly entityType = 'CONTENT';

  constructor(
    @Inject(DATABASE_SERVICE)
    private readonly databaseService: DatabaseService,
  ) {}

  async create(createContentDto: CreateContentDto): Promise<ContentResponseDto> {
    const id = uuidv4();
    const locale = createContentDto.locale || 'en';
    const slug = createContentDto.slug || this.generateSlug(createContentDto.title);

    const content: ContentEntity = {
      PK: `${this.entityType}#${id}`,
      SK: `${this.entityType}#${locale}`,
      GSI1PK: `${this.entityType}#${createContentDto.type}`,
      GSI1SK: `${locale}#${slug}`,
      id,
      type: createContentDto.type,
      locale,
      slug,
      title: createContentDto.title,
      content: createContentDto.content,
      excerpt: createContentDto.excerpt,
      featuredImage: createContentDto.featuredImage,
      metadata: createContentDto.metadata,
      status: createContentDto.status || 'draft',
      publishedAt: createContentDto.status === 'published' ? new Date().toISOString() : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.databaseService.put(content);

    return this.mapToResponse(content);
  }

  async findAll(filters: { type?: string; locale?: string; limit?: number }): Promise<ContentListResponseDto> {
    let result;

    if (filters.type) {
      result = await this.databaseService.query<ContentEntity>(this.entityType, {
        indexName: 'GSI1',
        keyConditionExpression: 'GSI1PK = :pk',
        expressionAttributeValues: {
          ':pk': `${this.entityType}#${filters.type}`,
        },
        limit: filters.limit || 50,
      });
    } else {
      const items = await this.databaseService.scan<ContentEntity>(this.entityType);
      result = { items, lastKey: undefined };
    }

    // Filter by locale if specified
    let items = result.items;
    if (filters.locale) {
      items = items.filter((item) => item.locale === filters.locale);
    }

    return {
      items: items.map(this.mapToResponse),
      count: items.length,
    };
  }

  async findById(id: string, locale = 'en'): Promise<ContentResponseDto> {
    const content = await this.databaseService.get<ContentEntity>(
      `${this.entityType}#${id}`,
      `${this.entityType}#${locale}`,
    );

    if (!content) {
      throw new NotFoundException(`Content with ID ${id} not found`);
    }

    return this.mapToResponse(content);
  }

  async findBySlug(slug: string, locale = 'en'): Promise<ContentResponseDto> {
    // Search across all content types
    const items = await this.databaseService.scan<ContentEntity>(this.entityType, {
      slug,
      locale,
    });

    if (!items || items.length === 0) {
      throw new NotFoundException(`Content with slug ${slug} not found`);
    }

    return this.mapToResponse(items[0]);
  }

  async update(id: string, updateContentDto: UpdateContentDto): Promise<ContentResponseDto> {
    const locale = updateContentDto.locale || 'en';
    const existing = await this.findById(id, locale);

    if (!existing) {
      throw new NotFoundException(`Content with ID ${id} not found`);
    }

    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    const fields = ['title', 'content', 'excerpt', 'featuredImage', 'metadata', 'status', 'slug'];

    for (const field of fields) {
      if ((updateContentDto as any)[field] !== undefined) {
        updateExpressions.push(`#${field} = :${field}`);
        expressionAttributeNames[`#${field}`] = field;
        expressionAttributeValues[`:${field}`] = (updateContentDto as any)[field];
      }
    }

    if (updateContentDto.status === 'published' && !existing.publishedAt) {
      updateExpressions.push('publishedAt = :publishedAt');
      expressionAttributeValues[':publishedAt'] = new Date().toISOString();
    }

    updateExpressions.push('updatedAt = :updatedAt');
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    const updated = await this.databaseService.update<ContentEntity>(this.entityType, {
      key: {
        PK: `${this.entityType}#${id}`,
        SK: `${this.entityType}#${locale}`,
      },
      updateExpression: `SET ${updateExpressions.join(', ')}`,
      expressionAttributeNames,
      expressionAttributeValues,
    });

    return this.mapToResponse(updated);
  }

  async delete(id: string, locale = 'en'): Promise<void> {
    await this.databaseService.delete(
      `${this.entityType}#${id}`,
      `${this.entityType}#${locale}`,
    );
  }

  private mapToResponse(content: ContentEntity): ContentResponseDto {
    return {
      id: content.id,
      type: content.type,
      locale: content.locale,
      slug: content.slug,
      title: content.title,
      content: content.content,
      excerpt: content.excerpt,
      featuredImage: content.featuredImage,
      metadata: content.metadata,
      status: content.status,
      publishedAt: content.publishedAt,
      createdAt: content.createdAt,
      updatedAt: content.updatedAt,
    };
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
}
