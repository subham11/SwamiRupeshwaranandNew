import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsArray,
  IsNumber,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

// ============================================
// Enums
// ============================================
export enum PageStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export enum ComponentType {
  ANNOUNCEMENT_BAR = 'announcement_bar',
  HEADER = 'header',
  FOOTER = 'footer',
  HERO_SECTION = 'hero_section',
  SACRED_TEACHINGS = 'sacred_teachings',
  UPCOMING_EVENTS = 'upcoming_events',
  WORDS_OF_WISDOM = 'words_of_wisdom',
  SERVICES_GRID = 'services_grid',
  GALLERY = 'gallery',
  CONTACT_FORM = 'contact_form',
  DONATION_SECTION = 'donation_section',
  NEWSLETTER_SIGNUP = 'newsletter_signup',
  TEXT_BLOCK = 'text_block',
  IMAGE_BLOCK = 'image_block',
  VIDEO_BLOCK = 'video_block',
  FAQ_SECTION = 'faq_section',
  TESTIMONIALS = 'testimonials',
  CUSTOM = 'custom',
}

export enum FieldType {
  TEXT = 'text',
  TEXTAREA = 'textarea',
  RICHTEXT = 'richtext',
  IMAGE = 'image',
  VIDEO = 'video',
  URL = 'url',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  SELECT = 'select',
  COLOR = 'color',
  DATE = 'date',
  ARRAY = 'array',
  JSON = 'json',
}

// ============================================
// Localized String DTO
// ============================================
export class LocalizedStringDto {
  @ApiProperty({ description: 'English text' })
  @IsString()
  en!: string;

  @ApiPropertyOptional({ description: 'Hindi text' })
  @IsOptional()
  @IsString()
  hi?: string;
}

// ============================================
// Component Field Definition
// ============================================
export class ComponentFieldDefinition {
  @ApiProperty({ description: 'Field key/name' })
  @IsString()
  key!: string;

  @ApiProperty({ description: 'Field label for UI' })
  @IsString()
  label!: string;

  @ApiProperty({ enum: FieldType, description: 'Field type' })
  @IsEnum(FieldType)
  type!: FieldType;

  @ApiPropertyOptional({ description: 'Whether field is required' })
  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @ApiPropertyOptional({ description: 'Whether field supports localization' })
  @IsOptional()
  @IsBoolean()
  localized?: boolean;

  @ApiPropertyOptional({ description: 'Default value' })
  @IsOptional()
  defaultValue?: any;

  @ApiPropertyOptional({ description: 'Placeholder text' })
  @IsOptional()
  @IsString()
  placeholder?: string;

  @ApiPropertyOptional({ description: 'Help text' })
  @IsOptional()
  @IsString()
  helpText?: string;

  @ApiPropertyOptional({ description: 'Options for select fields', type: [String] })
  @IsOptional()
  @IsArray()
  options?: string[];
}

// ============================================
// Component Field Value
// ============================================
export class ComponentFieldValue {
  @ApiProperty({ description: 'Field key' })
  @IsString()
  key!: string;

  @ApiPropertyOptional({ description: 'Simple value (non-localized)' })
  @IsOptional()
  value?: any;

  @ApiPropertyOptional({ description: 'Localized value', type: LocalizedStringDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  localizedValue?: LocalizedStringDto;
}

// ============================================
// Page DTOs
// ============================================
export class CreatePageDto {
  @ApiProperty({ example: 'home', description: 'Page slug (URL-friendly identifier)' })
  @IsString()
  slug!: string;

  @ApiProperty({ type: LocalizedStringDto, description: 'Page title in EN/HI' })
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  title!: LocalizedStringDto;

  @ApiPropertyOptional({ type: LocalizedStringDto, description: 'Page description' })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  description?: LocalizedStringDto;

  @ApiPropertyOptional({ description: 'Path/route for the page', example: '/' })
  @IsOptional()
  @IsString()
  path?: string;

  @ApiPropertyOptional({ description: 'Hero/featured image URL' })
  @IsOptional()
  @IsString()
  heroImage?: string;

  @ApiPropertyOptional({ enum: PageStatus, default: PageStatus.DRAFT })
  @IsOptional()
  @IsEnum(PageStatus)
  status?: PageStatus;

  @ApiPropertyOptional({ description: 'Display order' })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;

  @ApiPropertyOptional({ description: 'SEO meta title', type: LocalizedStringDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  metaTitle?: LocalizedStringDto;

  @ApiPropertyOptional({ description: 'SEO meta description', type: LocalizedStringDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  metaDescription?: LocalizedStringDto;
}

export class UpdatePageDto extends PartialType(CreatePageDto) {}

export class PageResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty({ type: LocalizedStringDto })
  title!: LocalizedStringDto;

  @ApiPropertyOptional({ type: LocalizedStringDto })
  description?: LocalizedStringDto;

  @ApiPropertyOptional()
  path?: string;

  @ApiPropertyOptional()
  heroImage?: string;

  @ApiProperty({ enum: PageStatus })
  status!: PageStatus;

  @ApiProperty()
  displayOrder!: number;

  @ApiPropertyOptional({ type: LocalizedStringDto })
  metaTitle?: LocalizedStringDto;

  @ApiPropertyOptional({ type: LocalizedStringDto })
  metaDescription?: LocalizedStringDto;

  @ApiProperty({ type: [String], description: 'Component IDs attached to this page' })
  componentIds!: string[];

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class PageListResponseDto {
  @ApiProperty({ type: [PageResponseDto] })
  items!: PageResponseDto[];

  @ApiProperty()
  count!: number;
}

// ============================================
// Page Component DTOs
// ============================================
export class CreatePageComponentDto {
  @ApiProperty({ description: 'Page ID this component belongs to' })
  @IsString()
  pageId!: string;

  @ApiProperty({ enum: ComponentType, description: 'Type of component' })
  @IsEnum(ComponentType)
  componentType!: ComponentType;

  @ApiProperty({ type: LocalizedStringDto, description: 'Component name/title' })
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  name!: LocalizedStringDto;

  @ApiPropertyOptional({ type: LocalizedStringDto, description: 'Component description' })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  description?: LocalizedStringDto;

  @ApiPropertyOptional({ type: [ComponentFieldValue], description: 'Component field values' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ComponentFieldValue)
  fields?: ComponentFieldValue[];

  @ApiPropertyOptional({ description: 'Display order within the page' })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;

  @ApiPropertyOptional({ description: 'Whether component is visible' })
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @ApiPropertyOptional({ description: 'Custom CSS classes' })
  @IsOptional()
  @IsString()
  customClasses?: string;

  @ApiPropertyOptional({ description: 'Custom inline styles as JSON' })
  @IsOptional()
  @IsObject()
  customStyles?: Record<string, string>;
}

export class UpdatePageComponentDto extends PartialType(CreatePageComponentDto) {
  @ApiPropertyOptional({ description: 'Page ID (cannot be changed after creation)' })
  @IsOptional()
  pageId?: string;
}

export class PageComponentResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  pageId!: string;

  @ApiProperty({ enum: ComponentType })
  componentType!: ComponentType;

  @ApiProperty({ type: LocalizedStringDto })
  name!: LocalizedStringDto;

  @ApiPropertyOptional({ type: LocalizedStringDto })
  description?: LocalizedStringDto;

  @ApiProperty({ type: [ComponentFieldValue] })
  fields!: ComponentFieldValue[];

  @ApiProperty()
  displayOrder!: number;

  @ApiProperty()
  isVisible!: boolean;

  @ApiPropertyOptional()
  customClasses?: string;

  @ApiPropertyOptional()
  customStyles?: Record<string, string>;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class PageComponentListResponseDto {
  @ApiProperty({ type: [PageComponentResponseDto] })
  items!: PageComponentResponseDto[];

  @ApiProperty()
  count!: number;
}

// ============================================
// Page with Components Response
// ============================================
export class PageWithComponentsResponseDto extends PageResponseDto {
  @ApiProperty({ type: [PageComponentResponseDto], description: 'All components for this page' })
  components!: PageComponentResponseDto[];
}

// ============================================
// Bulk Operations
// ============================================
export class BulkUpdateComponentsDto {
  @ApiProperty({ description: 'Page ID' })
  @IsString()
  pageId!: string;

  @ApiProperty({ type: [UpdatePageComponentDto], description: 'Components to update' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdatePageComponentDto)
  components!: (UpdatePageComponentDto & { id: string })[];
}

export class ReorderComponentsDto {
  @ApiProperty({ description: 'Page ID' })
  @IsString()
  pageId!: string;

  @ApiProperty({ type: [String], description: 'Component IDs in new order' })
  @IsArray()
  @IsString({ each: true })
  componentIds!: string[];
}

// ============================================
// Component Templates
// ============================================
export class ComponentTemplateDto {
  @ApiProperty({ enum: ComponentType })
  componentType!: ComponentType;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  icon!: string;

  @ApiProperty({ type: [ComponentFieldDefinition] })
  fields!: ComponentFieldDefinition[];

  @ApiProperty({ required: false, description: 'Whether this component type is global (site-wide, not page-specific)' })
  isGlobal?: boolean;
}

export class ComponentTemplateListResponseDto {
  @ApiProperty({ type: [ComponentTemplateDto] })
  items!: ComponentTemplateDto[];

  @ApiProperty()
  count!: number;
}
