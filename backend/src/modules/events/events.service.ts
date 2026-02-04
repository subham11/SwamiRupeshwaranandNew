import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService, DATABASE_SERVICE } from '@/common/database';
import { CreateEventDto, UpdateEventDto, EventResponseDto, EventListResponseDto } from './dto';

interface EventEntity {
  PK: string;
  SK: string;
  GSI1PK: string;
  GSI1SK: string;
  id: string;
  locale: string;
  title: string;
  description: string;
  startDate: string;
  endDate?: string;
  location: string;
  venue?: string;
  image?: string;
  registrationUrl?: string;
  maxParticipants?: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class EventsService {
  private readonly entityType = 'EVENT';

  constructor(
    @Inject(DATABASE_SERVICE)
    private readonly databaseService: DatabaseService,
  ) {}

  async create(createEventDto: CreateEventDto): Promise<EventResponseDto> {
    const id = uuidv4();
    const locale = createEventDto.locale || 'en';

    const event: EventEntity = {
      PK: `${this.entityType}#${id}`,
      SK: `${this.entityType}#${locale}`,
      GSI1PK: `${this.entityType}`,
      GSI1SK: `DATE#${createEventDto.startDate}`,
      id,
      locale,
      title: createEventDto.title,
      description: createEventDto.description,
      startDate: createEventDto.startDate,
      endDate: createEventDto.endDate,
      location: createEventDto.location,
      venue: createEventDto.venue,
      image: createEventDto.image,
      registrationUrl: createEventDto.registrationUrl,
      maxParticipants: createEventDto.maxParticipants,
      status: createEventDto.status || 'upcoming',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.databaseService.put(event);

    return this.mapToResponse(event);
  }

  async findAll(filters: { upcoming?: boolean; locale?: string; limit?: number }): Promise<EventListResponseDto> {
    const result = await this.databaseService.query<EventEntity>(this.entityType, {
      indexName: 'GSI1',
      keyConditionExpression: 'GSI1PK = :pk',
      expressionAttributeValues: {
        ':pk': this.entityType,
      },
      scanIndexForward: true, // Sort by date ascending
      limit: filters.limit || 50,
    });

    let items = result.items;

    // Filter by locale
    if (filters.locale) {
      items = items.filter((item) => item.locale === filters.locale);
    }

    // Filter upcoming events
    if (filters.upcoming) {
      const now = new Date().toISOString();
      items = items.filter((item) => item.startDate >= now || item.status === 'upcoming');
    }

    return {
      items: items.map(this.mapToResponse),
      count: items.length,
    };
  }

  async findById(id: string, locale = 'en'): Promise<EventResponseDto> {
    const event = await this.databaseService.get<EventEntity>(
      `${this.entityType}#${id}`,
      `${this.entityType}#${locale}`,
    );

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    return this.mapToResponse(event);
  }

  async update(id: string, updateEventDto: UpdateEventDto): Promise<EventResponseDto> {
    const locale = updateEventDto.locale || 'en';
    const existing = await this.findById(id, locale);

    if (!existing) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    const fields = [
      'title', 'description', 'startDate', 'endDate', 'location',
      'venue', 'image', 'registrationUrl', 'maxParticipants', 'status'
    ];

    for (const field of fields) {
      if ((updateEventDto as any)[field] !== undefined) {
        updateExpressions.push(`#${field} = :${field}`);
        expressionAttributeNames[`#${field}`] = field;
        expressionAttributeValues[`:${field}`] = (updateEventDto as any)[field];
      }
    }

    updateExpressions.push('updatedAt = :updatedAt');

    const updated = await this.databaseService.update<EventEntity>(this.entityType, {
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

  private mapToResponse(event: EventEntity): EventResponseDto {
    return {
      id: event.id,
      locale: event.locale,
      title: event.title,
      description: event.description,
      startDate: event.startDate,
      endDate: event.endDate,
      location: event.location,
      venue: event.venue,
      image: event.image,
      registrationUrl: event.registrationUrl,
      maxParticipants: event.maxParticipants,
      status: event.status,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    };
  }
}
