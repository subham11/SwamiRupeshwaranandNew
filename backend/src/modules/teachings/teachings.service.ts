import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService, DATABASE_SERVICE } from '@/common/database';
import {
  CreateTeachingDto,
  UpdateTeachingDto,
  TeachingResponseDto,
  TeachingListResponseDto,
} from './dto';

interface TeachingEntity {
  PK: string;
  SK: string;
  GSI1PK: string;
  GSI1SK: string;
  id: string;
  locale: string;
  slug: string;
  title: string;
  content: string;
  excerpt?: string;
  category: string;
  tags?: string[];
  featuredImage?: string;
  audioUrl?: string;
  videoUrl?: string;
  duration?: number;
  status: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class TeachingsService {
  private readonly entityType = 'TEACHING';

  constructor(
    @Inject(DATABASE_SERVICE)
    private readonly databaseService: DatabaseService,
  ) {}

  async create(createTeachingDto: CreateTeachingDto): Promise<TeachingResponseDto> {
    const id = uuidv4();
    const locale = createTeachingDto.locale || 'en';
    const slug = createTeachingDto.slug || this.generateSlug(createTeachingDto.title);

    const teaching: TeachingEntity = {
      PK: `${this.entityType}#${id}`,
      SK: `${this.entityType}#${locale}`,
      GSI1PK: `${this.entityType}#${createTeachingDto.category}`,
      GSI1SK: `${locale}#${slug}`,
      id,
      locale,
      slug,
      title: createTeachingDto.title,
      content: createTeachingDto.content,
      excerpt: createTeachingDto.excerpt,
      category: createTeachingDto.category,
      tags: createTeachingDto.tags,
      featuredImage: createTeachingDto.featuredImage,
      audioUrl: createTeachingDto.audioUrl,
      videoUrl: createTeachingDto.videoUrl,
      duration: createTeachingDto.duration,
      status: createTeachingDto.status || 'draft',
      publishedAt: createTeachingDto.status === 'published' ? new Date().toISOString() : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.databaseService.put(teaching);

    return this.mapToResponse(teaching);
  }

  async findAll(filters: {
    category?: string;
    locale?: string;
    limit?: number;
  }): Promise<TeachingListResponseDto> {
    let result;

    if (filters.category) {
      result = await this.databaseService.query<TeachingEntity>(this.entityType, {
        indexName: 'GSI1',
        keyConditionExpression: 'GSI1PK = :pk',
        expressionAttributeValues: {
          ':pk': `${this.entityType}#${filters.category}`,
        },
        limit: filters.limit || 50,
      });
    } else {
      const items = await this.databaseService.scan<TeachingEntity>(this.entityType);
      result = { items, lastKey: undefined };
    }

    let items = result.items;

    // Filter by locale
    if (filters.locale) {
      items = items.filter((item) => item.locale === filters.locale);
    }

    // Only return published items for public access
    items = items.filter((item) => item.status === 'published');

    return {
      items: items.map(this.mapToResponse),
      count: items.length,
    };
  }

  async findBySlug(slug: string, locale = 'en'): Promise<TeachingResponseDto> {
    const items = await this.databaseService.scan<TeachingEntity>(this.entityType, {
      slug,
      locale,
    });

    if (!items || items.length === 0) {
      throw new NotFoundException(`Teaching with slug ${slug} not found`);
    }

    return this.mapToResponse(items[0]);
  }

  async findById(id: string, locale = 'en'): Promise<TeachingResponseDto> {
    const teaching = await this.databaseService.get<TeachingEntity>(
      `${this.entityType}#${id}`,
      `${this.entityType}#${locale}`,
    );

    if (!teaching) {
      throw new NotFoundException(`Teaching with ID ${id} not found`);
    }

    return this.mapToResponse(teaching);
  }

  async update(id: string, updateTeachingDto: UpdateTeachingDto): Promise<TeachingResponseDto> {
    const locale = updateTeachingDto.locale || 'en';
    const existing = await this.findById(id, locale);

    if (!existing) {
      throw new NotFoundException(`Teaching with ID ${id} not found`);
    }

    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    const fields = [
      'title',
      'content',
      'excerpt',
      'category',
      'tags',
      'featuredImage',
      'audioUrl',
      'videoUrl',
      'duration',
      'status',
      'slug',
    ];

    for (const field of fields) {
      if ((updateTeachingDto as any)[field] !== undefined) {
        updateExpressions.push(`#${field} = :${field}`);
        expressionAttributeNames[`#${field}`] = field;
        expressionAttributeValues[`:${field}`] = (updateTeachingDto as any)[field];
      }
    }

    if (updateTeachingDto.status === 'published' && !existing.publishedAt) {
      updateExpressions.push('publishedAt = :publishedAt');
      expressionAttributeValues[':publishedAt'] = new Date().toISOString();
    }

    updateExpressions.push('updatedAt = :updatedAt');
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    const updated = await this.databaseService.update<TeachingEntity>(this.entityType, {
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
    await this.databaseService.delete(`${this.entityType}#${id}`, `${this.entityType}#${locale}`);
  }

  private mapToResponse(teaching: TeachingEntity): TeachingResponseDto {
    return {
      id: teaching.id,
      locale: teaching.locale,
      slug: teaching.slug,
      title: teaching.title,
      content: teaching.content,
      excerpt: teaching.excerpt,
      category: teaching.category,
      tags: teaching.tags,
      featuredImage: teaching.featuredImage,
      audioUrl: teaching.audioUrl,
      videoUrl: teaching.videoUrl,
      duration: teaching.duration,
      status: teaching.status,
      publishedAt: teaching.publishedAt,
      createdAt: teaching.createdAt,
      updatedAt: teaching.updatedAt,
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
