import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsDateString, IsNumber, IsUrl } from 'class-validator';

export enum EventStatus {
  UPCOMING = 'upcoming',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export class CreateEventDto {
  @ApiPropertyOptional({ example: 'en', description: 'Locale' })
  @IsOptional()
  @IsString()
  locale?: string;

  @ApiProperty({ description: 'Event title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Event description' })
  @IsString()
  description: string;

  @ApiProperty({ example: '2024-03-15T10:00:00Z', description: 'Start date and time' })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({ example: '2024-03-15T18:00:00Z', description: 'End date and time' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ description: 'Event location/city' })
  @IsString()
  location: string;

  @ApiPropertyOptional({ description: 'Venue name' })
  @IsOptional()
  @IsString()
  venue?: string;

  @ApiPropertyOptional({ description: 'Event image URL' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ description: 'Registration URL' })
  @IsOptional()
  @IsUrl()
  registrationUrl?: string;

  @ApiPropertyOptional({ description: 'Maximum participants' })
  @IsOptional()
  @IsNumber()
  maxParticipants?: number;

  @ApiPropertyOptional({ enum: EventStatus, default: EventStatus.UPCOMING })
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;
}

export class UpdateEventDto {
  @ApiPropertyOptional({ example: 'en', description: 'Locale' })
  @IsOptional()
  @IsString()
  locale?: string;

  @ApiPropertyOptional({ description: 'Event title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Event description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Start date and time' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date and time' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Event location/city' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Venue name' })
  @IsOptional()
  @IsString()
  venue?: string;

  @ApiPropertyOptional({ description: 'Event image URL' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ description: 'Registration URL' })
  @IsOptional()
  @IsUrl()
  registrationUrl?: string;

  @ApiPropertyOptional({ description: 'Maximum participants' })
  @IsOptional()
  @IsNumber()
  maxParticipants?: number;

  @ApiPropertyOptional({ enum: EventStatus })
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;
}

export class EventResponseDto {
  @ApiProperty({ description: 'Event ID' })
  id: string;

  @ApiProperty({ description: 'Locale' })
  locale: string;

  @ApiProperty({ description: 'Event title' })
  title: string;

  @ApiProperty({ description: 'Event description' })
  description: string;

  @ApiProperty({ description: 'Start date and time' })
  startDate: string;

  @ApiPropertyOptional({ description: 'End date and time' })
  endDate?: string;

  @ApiProperty({ description: 'Event location/city' })
  location: string;

  @ApiPropertyOptional({ description: 'Venue name' })
  venue?: string;

  @ApiPropertyOptional({ description: 'Event image URL' })
  image?: string;

  @ApiPropertyOptional({ description: 'Registration URL' })
  registrationUrl?: string;

  @ApiPropertyOptional({ description: 'Maximum participants' })
  maxParticipants?: number;

  @ApiProperty({ description: 'Event status' })
  status: string;

  @ApiProperty({ description: 'Created timestamp' })
  createdAt: string;

  @ApiProperty({ description: 'Updated timestamp' })
  updatedAt: string;
}

export class EventListResponseDto {
  @ApiProperty({ type: [EventResponseDto], description: 'List of events' })
  items: EventResponseDto[];

  @ApiProperty({ description: 'Total count' })
  count: number;
}
