import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { TeachingsService } from './teachings.service';
import { CreateTeachingDto, UpdateTeachingDto, TeachingResponseDto, TeachingListResponseDto } from './dto';
import { JwtAuthGuard } from '@/common/guards';
import { Public } from '@/common/decorators';

@ApiTags('Teachings')
@Controller('teachings')
export class TeachingsController {
  constructor(private readonly teachingsService: TeachingsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new teaching' })
  @ApiResponse({
    status: 201,
    description: 'Teaching created successfully',
    type: TeachingResponseDto,
  })
  async create(@Body() createTeachingDto: CreateTeachingDto): Promise<TeachingResponseDto> {
    return this.teachingsService.create(createTeachingDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all teachings' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category' })
  @ApiQuery({ name: 'locale', required: false, description: 'Filter by locale' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'List of teachings',
    type: TeachingListResponseDto,
  })
  async findAll(
    @Query('category') category?: string,
    @Query('locale') locale?: string,
    @Query('limit') limit?: number,
  ): Promise<TeachingListResponseDto> {
    return this.teachingsService.findAll({ category, locale, limit });
  }

  @Get(':slug')
  @Public()
  @ApiOperation({ summary: 'Get teaching by slug' })
  @ApiParam({ name: 'slug', description: 'Teaching slug' })
  @ApiQuery({ name: 'locale', required: false, description: 'Locale' })
  @ApiResponse({
    status: 200,
    description: 'Teaching found',
    type: TeachingResponseDto,
  })
  async findBySlug(
    @Param('slug') slug: string,
    @Query('locale') locale?: string,
  ): Promise<TeachingResponseDto> {
    return this.teachingsService.findBySlug(slug, locale);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update teaching' })
  @ApiParam({ name: 'id', description: 'Teaching ID' })
  @ApiResponse({
    status: 200,
    description: 'Teaching updated successfully',
    type: TeachingResponseDto,
  })
  async update(
    @Param('id') id: string,
    @Body() updateTeachingDto: UpdateTeachingDto,
  ): Promise<TeachingResponseDto> {
    return this.teachingsService.update(id, updateTeachingDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete teaching' })
  @ApiParam({ name: 'id', description: 'Teaching ID' })
  @ApiResponse({ status: 200, description: 'Teaching deleted successfully' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.teachingsService.delete(id);
  }
}
