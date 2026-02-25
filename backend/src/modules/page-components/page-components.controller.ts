import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Header } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { PageComponentsService } from './page-components.service';
import {
  CreatePageDto,
  UpdatePageDto,
  PageResponseDto,
  PageListResponseDto,
  PageWithComponentsResponseDto,
  CreatePageComponentDto,
  UpdatePageComponentDto,
  PageComponentResponseDto,
  PageComponentListResponseDto,
  BulkUpdateComponentsDto,
  ReorderComponentsDto,
  ComponentTemplateListResponseDto,
  ComponentType,
} from './dto';
import { JwtAuthGuard, RolesGuard } from '@/common/guards';
import { Public, AdminOnly, EditorOnly } from '@/common/decorators';

@ApiTags('Page Components CMS')
@Controller('cms')
export class PageComponentsController {
  constructor(private readonly pageComponentsService: PageComponentsService) {}

  // ============================================
  // Page Endpoints
  // ============================================

  @Post('pages')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new page (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Page created successfully',
    type: PageResponseDto,
  })
  async createPage(@Body() createPageDto: CreatePageDto): Promise<PageResponseDto> {
    return this.pageComponentsService.createPage(createPageDto);
  }

  @Get('pages')
  @Public()
  @Header('Cache-Control', 'public, max-age=300, s-maxage=600, stale-while-revalidate=60')
  @ApiOperation({ summary: 'Get all pages' })
  @ApiQuery({
    name: 'publishedOnly',
    required: false,
    type: Boolean,
    description: 'Filter published pages only (for public access)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of pages',
    type: PageListResponseDto,
  })
  async findAllPages(
    @Query('publishedOnly') publishedOnly?: boolean,
  ): Promise<PageListResponseDto> {
    return this.pageComponentsService.findAllPages(
      publishedOnly === true || publishedOnly === ('true' as any),
    );
  }

  @Get('pages/by-slug/:slug')
  @Public()
  @Header('Cache-Control', 'public, max-age=300, s-maxage=600, stale-while-revalidate=60')
  @ApiOperation({ summary: 'Get page by slug with all components' })
  @ApiParam({ name: 'slug', description: 'Page slug' })
  @ApiResponse({
    status: 200,
    description: 'Page with components found',
    type: PageWithComponentsResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Page not found' })
  async findPageBySlug(@Param('slug') slug: string): Promise<PageWithComponentsResponseDto | null> {
    return this.pageComponentsService.findPageWithComponentsBySlug(slug);
  }

  @Get('pages/:id')
  @Public()
  @ApiOperation({ summary: 'Get page by ID' })
  @ApiParam({ name: 'id', description: 'Page ID' })
  @ApiResponse({
    status: 200,
    description: 'Page found',
    type: PageResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Page not found' })
  async findPageById(@Param('id') id: string): Promise<PageResponseDto> {
    return this.pageComponentsService.findPageById(id);
  }

  @Get('pages/:id/with-components')
  @Public()
  @ApiOperation({ summary: 'Get page by ID with all components' })
  @ApiParam({ name: 'id', description: 'Page ID' })
  @ApiResponse({
    status: 200,
    description: 'Page with components found',
    type: PageWithComponentsResponseDto,
  })
  async findPageWithComponents(@Param('id') id: string): Promise<PageWithComponentsResponseDto> {
    return this.pageComponentsService.findPageWithComponents(id);
  }

  @Put('pages/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @EditorOnly()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update page (Content Editor+)' })
  @ApiParam({ name: 'id', description: 'Page ID' })
  @ApiResponse({
    status: 200,
    description: 'Page updated successfully',
    type: PageResponseDto,
  })
  async updatePage(
    @Param('id') id: string,
    @Body() updatePageDto: UpdatePageDto,
  ): Promise<PageResponseDto> {
    return this.pageComponentsService.updatePage(id, updatePageDto);
  }

  @Delete('pages/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete page (Admin only)' })
  @ApiParam({ name: 'id', description: 'Page ID' })
  @ApiResponse({ status: 200, description: 'Page deleted successfully' })
  async deletePage(@Param('id') id: string): Promise<void> {
    return this.pageComponentsService.deletePage(id);
  }

  // ============================================
  // Component Endpoints
  // ============================================

  @Post('components')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @EditorOnly()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new component (Content Editor+)' })
  @ApiResponse({
    status: 201,
    description: 'Component created successfully',
    type: PageComponentResponseDto,
  })
  async createComponent(
    @Body() createComponentDto: CreatePageComponentDto,
  ): Promise<PageComponentResponseDto> {
    return this.pageComponentsService.createComponent(createComponentDto);
  }

  @Get('components/page/:pageId')
  @Public()
  @ApiOperation({ summary: 'Get all components for a page' })
  @ApiParam({ name: 'pageId', description: 'Page ID' })
  @ApiResponse({
    status: 200,
    description: 'List of components',
    type: PageComponentListResponseDto,
  })
  async findComponentsByPage(
    @Param('pageId') pageId: string,
  ): Promise<PageComponentListResponseDto> {
    return this.pageComponentsService.findComponentsByPage(pageId);
  }

  @Get('components/global/public')
  @Public()
  @Header('Cache-Control', 'public, max-age=300, s-maxage=600, stale-while-revalidate=60')
  @ApiOperation({ summary: 'Get all global components (public, read-only)' })
  @ApiResponse({
    status: 200,
    description: 'List of global components',
    type: PageComponentListResponseDto,
  })
  async findPublicGlobalComponents(): Promise<PageComponentListResponseDto> {
    return this.pageComponentsService.findGlobalComponents();
  }

  @Get('components/global')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @EditorOnly()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all global components (Content Editor+)' })
  @ApiResponse({
    status: 200,
    description: 'List of global components',
    type: PageComponentListResponseDto,
  })
  async findGlobalComponents(): Promise<PageComponentListResponseDto> {
    return this.pageComponentsService.findGlobalComponents();
  }

  @Get('components/:id')
  @Public()
  @ApiOperation({ summary: 'Get component by ID' })
  @ApiParam({ name: 'id', description: 'Component ID' })
  @ApiResponse({
    status: 200,
    description: 'Component found',
    type: PageComponentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Component not found' })
  async findComponentById(@Param('id') id: string): Promise<PageComponentResponseDto> {
    return this.pageComponentsService.findComponentById(id);
  }

  @Put('components/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @EditorOnly()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update component (Content Editor+)' })
  @ApiParam({ name: 'id', description: 'Component ID' })
  @ApiResponse({
    status: 200,
    description: 'Component updated successfully',
    type: PageComponentResponseDto,
  })
  async updateComponent(
    @Param('id') id: string,
    @Body() updateComponentDto: UpdatePageComponentDto,
  ): Promise<PageComponentResponseDto> {
    return this.pageComponentsService.updateComponent(id, updateComponentDto);
  }

  @Delete('components/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete component (Admin only)' })
  @ApiParam({ name: 'id', description: 'Component ID' })
  @ApiResponse({ status: 200, description: 'Component deleted successfully' })
  async deleteComponent(@Param('id') id: string): Promise<void> {
    return this.pageComponentsService.deleteComponent(id);
  }

  @Put('components/bulk-update')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @EditorOnly()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Bulk update multiple components (Content Editor+)' })
  @ApiResponse({
    status: 200,
    description: 'Components updated successfully',
    type: PageComponentListResponseDto,
  })
  async bulkUpdateComponents(
    @Body() dto: BulkUpdateComponentsDto,
  ): Promise<PageComponentListResponseDto> {
    return this.pageComponentsService.bulkUpdateComponents(dto);
  }

  @Put('components/reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @EditorOnly()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Reorder components within a page (Content Editor+)' })
  @ApiResponse({
    status: 200,
    description: 'Components reordered successfully',
    type: PageComponentListResponseDto,
  })
  async reorderComponents(
    @Body() dto: ReorderComponentsDto,
  ): Promise<PageComponentListResponseDto> {
    return this.pageComponentsService.reorderComponents(dto);
  }

  // ============================================
  // Component Templates Endpoints
  // ============================================

  @Get('templates')
  @Public()
  @ApiOperation({ summary: 'Get all available component templates' })
  @ApiResponse({
    status: 200,
    description: 'List of component templates',
    type: ComponentTemplateListResponseDto,
  })
  getComponentTemplates(): ComponentTemplateListResponseDto {
    return this.pageComponentsService.getComponentTemplates();
  }

  @Get('templates/:componentType')
  @Public()
  @ApiOperation({ summary: 'Get component template by type' })
  @ApiParam({ name: 'componentType', enum: ComponentType })
  @ApiResponse({
    status: 200,
    description: 'Component template found',
  })
  getComponentTemplate(@Param('componentType') componentType: ComponentType) {
    return this.pageComponentsService.getComponentTemplate(componentType);
  }
}
