import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ContentService } from './content.service';
import {
  CreateContentDto,
  UpdateContentDto,
  ContentResponseDto,
  ContentListResponseDto,
} from './dto';
import { JwtAuthGuard } from '@/common/guards';
import { Public } from '@/common/decorators';

@ApiTags('Content')
@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create new content' })
  @ApiResponse({
    status: 201,
    description: 'Content created successfully',
    type: ContentResponseDto,
  })
  async create(@Body() createContentDto: CreateContentDto): Promise<ContentResponseDto> {
    return this.contentService.create(createContentDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all content' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by content type' })
  @ApiQuery({ name: 'locale', required: false, description: 'Filter by locale' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'List of content',
    type: ContentListResponseDto,
  })
  async findAll(
    @Query('type') type?: string,
    @Query('locale') locale?: string,
    @Query('limit') limit?: number,
  ): Promise<ContentListResponseDto> {
    return this.contentService.findAll({ type, locale, limit });
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get content by ID' })
  @ApiParam({ name: 'id', description: 'Content ID' })
  @ApiResponse({
    status: 200,
    description: 'Content found',
    type: ContentResponseDto,
  })
  async findOne(@Param('id') id: string): Promise<ContentResponseDto> {
    return this.contentService.findById(id);
  }

  @Get('slug/:slug')
  @Public()
  @ApiOperation({ summary: 'Get content by slug' })
  @ApiParam({ name: 'slug', description: 'Content slug' })
  @ApiQuery({ name: 'locale', required: false, description: 'Locale' })
  @ApiResponse({
    status: 200,
    description: 'Content found',
    type: ContentResponseDto,
  })
  async findBySlug(
    @Param('slug') slug: string,
    @Query('locale') locale?: string,
  ): Promise<ContentResponseDto> {
    return this.contentService.findBySlug(slug, locale);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update content' })
  @ApiParam({ name: 'id', description: 'Content ID' })
  @ApiResponse({
    status: 200,
    description: 'Content updated successfully',
    type: ContentResponseDto,
  })
  async update(
    @Param('id') id: string,
    @Body() updateContentDto: UpdateContentDto,
  ): Promise<ContentResponseDto> {
    return this.contentService.update(id, updateContentDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete content' })
  @ApiParam({ name: 'id', description: 'Content ID' })
  @ApiResponse({ status: 200, description: 'Content deleted successfully' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.contentService.delete(id);
  }
}
