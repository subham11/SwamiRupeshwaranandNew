import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { SearchQueryDto, SearchResultDto } from './dto';
import { Public } from '@/common/decorators';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Global search across products, events, and CMS pages (public)' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query string' })
  @ApiQuery({
    name: 'types',
    required: false,
    description: 'Comma-separated entity types: product,event,page',
    example: 'product,event,page',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Max results per type' })
  @ApiQuery({ name: 'locale', required: false, description: 'Locale (en or hi)', example: 'en' })
  @ApiResponse({ status: 200, type: SearchResultDto })
  async search(@Query() query: SearchQueryDto): Promise<SearchResultDto> {
    return this.searchService.search(query);
  }
}
