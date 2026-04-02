import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, Min, Max, IsArray } from 'class-validator';
import { Transform, Type } from 'class-transformer';

// ============================================
// Search Entity Types
// ============================================

export type SearchEntityType = 'product' | 'event' | 'page';

// ============================================
// Query DTO
// ============================================

export class SearchQueryDto {
  @ApiProperty({ description: 'Search query string', example: 'meditation' })
  @IsString()
  q!: string;

  @ApiPropertyOptional({
    description: 'Entity types to search (comma-separated)',
    example: 'product,event,page',
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
  @IsArray()
  types?: SearchEntityType[];

  @ApiPropertyOptional({ description: 'Maximum results per type', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number;

  @ApiPropertyOptional({ description: 'Locale for results', default: 'en', example: 'en' })
  @IsOptional()
  @IsString()
  locale?: string;
}

// ============================================
// Response DTOs
// ============================================

export class SearchProductResultDto {
  @ApiProperty() id!: string;
  @ApiProperty() title!: string;
  @ApiPropertyOptional() subtitle?: string;
  @ApiProperty() slug!: string;
  @ApiProperty() price!: number;
  @ApiPropertyOptional() originalPrice?: number;
  @ApiProperty() images!: string[];
  @ApiProperty() categoryName!: string;
}

export class SearchEventResultDto {
  @ApiProperty() id!: string;
  @ApiProperty() title!: string;
  @ApiPropertyOptional() description?: string;
  @ApiProperty() slug!: string;
  @ApiPropertyOptional() startDate?: string;
  @ApiPropertyOptional() endDate?: string;
  @ApiPropertyOptional() imageKey?: string;
}

export class SearchPageResultDto {
  @ApiProperty() id!: string;
  @ApiProperty() title!: string;
  @ApiProperty() slug!: string;
  @ApiPropertyOptional() excerpt?: string;
}

export class SearchResultDto {
  @ApiProperty({ type: [SearchProductResultDto] })
  products!: SearchProductResultDto[];

  @ApiProperty({ type: [SearchEventResultDto] })
  events!: SearchEventResultDto[];

  @ApiProperty({ type: [SearchPageResultDto] })
  pages!: SearchPageResultDto[];

  @ApiProperty() totalResults!: number;
}
