import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService, DATABASE_SERVICE } from '@/common/database';
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
  ComponentTemplateDto,
  ComponentTemplateListResponseDto,
  PageStatus,
  ComponentType,
  FieldType,
  LocalizedStringDto,
  ComponentFieldValue,
  // ComponentFieldDefinition, // removed unused import
} from './dto';

// ============================================
// Entity Interfaces
// ============================================
interface PageEntity {
  PK: string;
  SK: string;
  GSI1PK: string;
  GSI1SK: string;
  id: string;
  slug: string;
  title: LocalizedStringDto;
  description?: LocalizedStringDto;
  path?: string;
  heroImage?: string;
  status: PageStatus;
  displayOrder: number;
  metaTitle?: LocalizedStringDto;
  metaDescription?: LocalizedStringDto;
  componentIds: string[];
  createdAt: string;
  updatedAt: string;
}

interface PageComponentEntity {
  PK: string;
  SK: string;
  GSI1PK: string;
  GSI1SK: string;
  id: string;
  pageId: string;
  componentType: ComponentType;
  name: LocalizedStringDto;
  description?: LocalizedStringDto;
  fields: ComponentFieldValue[];
  displayOrder: number;
  isVisible: boolean;
  customClasses?: string;
  customStyles?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Component Templates Definition
// ============================================
const COMPONENT_TEMPLATES: ComponentTemplateDto[] = [
  {
    componentType: ComponentType.ANNOUNCEMENT_BAR,
    name: 'Announcement Bar',
    description: 'Top announcement banner with scrolling text',
    icon: '📢',
    isGlobal: true,
    fields: [
      {
        key: 'text',
        label: 'Text',
        type: FieldType.RICHTEXT,
        required: true,
        localized: true,
        placeholder: 'Enter announcement text...',
      },
      {
        key: 'ariaLabel',
        label: 'Aria Label',
        type: FieldType.TEXT,
        required: false,
        localized: false,
        defaultValue: 'Announcements',
      },
      { key: 'bgColor', label: 'Background Color', type: FieldType.COLOR, defaultValue: '#f97316' },
      { key: 'textColor', label: 'Text Color', type: FieldType.COLOR, defaultValue: '#ffffff' },
      { key: 'link', label: 'Link URL', type: FieldType.URL, required: false },
      {
        key: 'isScrolling',
        label: 'Enable Scrolling',
        type: FieldType.BOOLEAN,
        defaultValue: true,
      },
    ],
  },
  {
    componentType: ComponentType.HEADER,
    name: 'Header',
    description: 'Site-wide header with logo, navigation, and contact info',
    icon: '🔝',
    isGlobal: true,
    fields: [
      { key: 'logoImage', label: 'Logo Image', type: FieldType.IMAGE, helpText: 'Upload a logo image (leave blank to use the default ॐ symbol)' },
      { key: 'brandName', label: 'Brand Name', type: FieldType.TEXT, required: true, localized: true, defaultValue: 'Swami Rupeshwaranand' },
      { key: 'brandTagline', label: 'Brand Tagline', type: FieldType.TEXT, localized: true, defaultValue: 'Path to Inner Peace' },
      { key: 'contactPhone', label: 'Contact Phone', type: FieldType.TEXT, defaultValue: '+91 1234567890' },
      { key: 'contactEmail', label: 'Contact Email', type: FieldType.TEXT, defaultValue: 'info@example.org' },
      { key: 'ctaButtonLabel', label: 'CTA Button Label', type: FieldType.TEXT, localized: true, defaultValue: 'Donate' },
      { key: 'ctaButtonLink', label: 'CTA Button Link', type: FieldType.URL, defaultValue: '/donation' },
      { key: 'socialLinks', label: 'Social Media Links', type: FieldType.JSON, helpText: 'Array of objects: { platform, url, icon }. e.g. [{"platform":"YouTube","url":"https://youtube.com/...","icon":"youtube"}]' },
    ],
  },
  {
    componentType: ComponentType.FOOTER,
    name: 'Footer',
    description: 'Site-wide footer with links, contact info, and social media',
    icon: '🔻',
    isGlobal: true,
    fields: [
      { key: 'aboutDescription', label: 'About Description', type: FieldType.RICHTEXT, localized: true, helpText: 'Short description shown in the footer' },
      { key: 'contactAddress', label: 'Contact Address', type: FieldType.TEXTAREA, localized: true, defaultValue: 'Sri Pitambara Peeth' },
      { key: 'contactPhone', label: 'Contact Phone', type: FieldType.TEXT, defaultValue: '+91 1234567890' },
      { key: 'contactEmail', label: 'Contact Email', type: FieldType.TEXT, defaultValue: 'info@example.org' },
      { key: 'quickLinks', label: 'Quick Links', type: FieldType.JSON, helpText: 'Array of link objects: { label: {en, hi}, href }' },
      { key: 'offeringLinks', label: 'Offering Links', type: FieldType.JSON, helpText: 'Array of link objects: { label: {en, hi}, href }' },
      { key: 'socialLinks', label: 'Social Media Links', type: FieldType.JSON, helpText: 'Array of objects: { platform, url, icon }' },
      { key: 'copyrightText', label: 'Copyright Text', type: FieldType.TEXT, localized: true, defaultValue: 'All rights reserved.' },
      { key: 'newsletterLabel', label: 'Newsletter Label', type: FieldType.TEXT, localized: true, defaultValue: 'Subscribe to Newsletter' },
    ],
  },
  {
    componentType: ComponentType.HERO_SECTION,
    name: 'Hero Section',
    description: 'Main hero banner with slides',
    icon: '🖼️',
    fields: [
      {
        key: 'slides',
        label: 'Hero Slides',
        type: FieldType.JSON,
        required: true,
        helpText: 'Array of slide objects: { imageUrl, heading: {en,hi}, subheading: {en,hi}, ctaText: {en,hi}, ctaLink }',
      },
      {
        key: 'overlayOpacity',
        label: 'Overlay Opacity',
        type: FieldType.NUMBER,
        defaultValue: 0.5,
      },
      {
        key: 'enableParallax',
        label: 'Enable Parallax',
        type: FieldType.BOOLEAN,
        defaultValue: true,
      },
    ],
  },
  {
    componentType: ComponentType.SACRED_TEACHINGS,
    name: 'Sacred Teachings',
    description: 'Display sacred teachings section',
    icon: '📖',
    fields: [
      {
        key: 'title',
        label: 'Section Title',
        type: FieldType.TEXT,
        required: true,
        localized: true,
      },
      { key: 'subtitle', label: 'Subtitle', type: FieldType.TEXT, localized: true },
      {
        key: 'teachings',
        label: 'Teachings (JSON)',
        type: FieldType.JSON,
        helpText: 'Array of teaching objects',
      },
      {
        key: 'layout',
        label: 'Layout',
        type: FieldType.SELECT,
        options: ['grid', 'carousel', 'list'],
        defaultValue: 'grid',
      },
      { key: 'maxItems', label: 'Max Items', type: FieldType.NUMBER, defaultValue: 6 },
    ],
  },
  {
    componentType: ComponentType.UPCOMING_EVENTS,
    name: 'Upcoming Events',
    description: 'Shows upcoming events list',
    icon: '📅',
    fields: [
      {
        key: 'title',
        label: 'Section Title',
        type: FieldType.TEXT,
        required: true,
        localized: true,
      },
      { key: 'subtitle', label: 'Subtitle', type: FieldType.TEXT, localized: true },
      {
        key: 'events',
        label: 'Events',
        type: FieldType.JSON,
        helpText: 'Array of event objects: { title: {en,hi}, description: {en,hi}, date, location: {en,hi}, imageUrl, link }',
      },
      { key: 'viewAllLink', label: 'View All Link', type: FieldType.URL },
    ],
  },
  {
    componentType: ComponentType.WORDS_OF_WISDOM,
    name: 'Words of Wisdom',
    description: 'Inspirational quotes section',
    icon: '💬',
    fields: [
      {
        key: 'title',
        label: 'Section Title',
        type: FieldType.TEXT,
        required: true,
        localized: true,
      },
      {
        key: 'quotes',
        label: 'Quotes (JSON)',
        type: FieldType.JSON,
        helpText: 'Array of quote objects with text and author',
      },
      { key: 'autoRotate', label: 'Auto Rotate', type: FieldType.BOOLEAN, defaultValue: true },
      {
        key: 'rotateInterval',
        label: 'Rotate Interval (seconds)',
        type: FieldType.NUMBER,
        defaultValue: 5,
      },
      { key: 'backgroundImage', label: 'Background Image', type: FieldType.IMAGE },
    ],
  },
  {
    componentType: ComponentType.SERVICES_GRID,
    name: 'Services Grid',
    description: 'Grid of services/offerings',
    icon: '🙏',
    fields: [
      {
        key: 'title',
        label: 'Section Title',
        type: FieldType.TEXT,
        required: true,
        localized: true,
      },
      { key: 'subtitle', label: 'Subtitle', type: FieldType.TEXT, localized: true },
      {
        key: 'columns',
        label: 'Columns',
        type: FieldType.SELECT,
        options: ['2', '3', '4'],
        defaultValue: '3',
      },
      { key: 'maxItems', label: 'Max Items', type: FieldType.NUMBER, defaultValue: 12 },
      {
        key: 'showDescription',
        label: 'Show Description',
        type: FieldType.BOOLEAN,
        defaultValue: true,
      },
    ],
  },
  {
    componentType: ComponentType.GALLERY,
    name: 'Gallery',
    description: 'Image/video gallery section',
    icon: '🖼️',
    fields: [
      {
        key: 'title',
        label: 'Section Title',
        type: FieldType.TEXT,
        required: true,
        localized: true,
      },
      {
        key: 'layout',
        label: 'Layout',
        type: FieldType.SELECT,
        options: ['masonry', 'grid', 'carousel'],
        defaultValue: 'masonry',
      },
      {
        key: 'images',
        label: 'Images (JSON)',
        type: FieldType.JSON,
        helpText: 'Array of image objects',
      },
      {
        key: 'enableLightbox',
        label: 'Enable Lightbox',
        type: FieldType.BOOLEAN,
        defaultValue: true,
      },
    ],
  },
  {
    componentType: ComponentType.TEXT_BLOCK,
    name: 'Text Block',
    description: 'Rich text content block',
    icon: '📝',
    fields: [
      { key: 'title', label: 'Title', type: FieldType.TEXT, localized: true },
      {
        key: 'content',
        label: 'Content',
        type: FieldType.RICHTEXT,
        required: true,
        localized: true,
      },
      {
        key: 'alignment',
        label: 'Alignment',
        type: FieldType.SELECT,
        options: ['left', 'center', 'right'],
        defaultValue: 'left',
      },
    ],
  },
  {
    componentType: ComponentType.IMAGE_BLOCK,
    name: 'Image Block',
    description: 'Single image with optional caption',
    icon: '📷',
    fields: [
      { key: 'image', label: 'Image', type: FieldType.IMAGE, required: true },
      { key: 'alt', label: 'Alt Text', type: FieldType.TEXT, required: true, localized: true },
      { key: 'caption', label: 'Caption', type: FieldType.TEXT, localized: true },
      { key: 'link', label: 'Link URL', type: FieldType.URL },
      {
        key: 'width',
        label: 'Width',
        type: FieldType.SELECT,
        options: ['full', '3/4', '1/2', '1/3'],
        defaultValue: 'full',
      },
    ],
  },
  {
    componentType: ComponentType.VIDEO_BLOCK,
    name: 'Video Block',
    description: 'Embedded video (YouTube/Vimeo)',
    icon: '🎬',
    fields: [
      { key: 'videoUrl', label: 'Video URL', type: FieldType.URL, required: true },
      { key: 'title', label: 'Title', type: FieldType.TEXT, localized: true },
      { key: 'description', label: 'Description', type: FieldType.TEXTAREA, localized: true },
      { key: 'thumbnail', label: 'Custom Thumbnail', type: FieldType.IMAGE },
      { key: 'autoplay', label: 'Autoplay', type: FieldType.BOOLEAN, defaultValue: false },
    ],
  },
  {
    componentType: ComponentType.CONTACT_FORM,
    name: 'Contact Form',
    description: 'Contact form section',
    icon: '✉️',
    fields: [
      {
        key: 'title',
        label: 'Section Title',
        type: FieldType.TEXT,
        required: true,
        localized: true,
      },
      { key: 'subtitle', label: 'Subtitle', type: FieldType.TEXT, localized: true },
      { key: 'successMessage', label: 'Success Message', type: FieldType.TEXT, localized: true },
      { key: 'recipientEmail', label: 'Recipient Email', type: FieldType.TEXT },
    ],
  },
  {
    componentType: ComponentType.DONATION_SECTION,
    name: 'Donation Section',
    description: 'Donation/contribution section',
    icon: '🙏',
    fields: [
      {
        key: 'title',
        label: 'Section Title',
        type: FieldType.TEXT,
        required: true,
        localized: true,
      },
      { key: 'description', label: 'Description', type: FieldType.TEXTAREA, localized: true },
      {
        key: 'amounts',
        label: 'Preset Amounts (comma-separated)',
        type: FieldType.TEXT,
        defaultValue: '101,501,1100,2100,5100',
      },
      {
        key: 'customAmountEnabled',
        label: 'Allow Custom Amount',
        type: FieldType.BOOLEAN,
        defaultValue: true,
      },
    ],
  },
  {
    componentType: ComponentType.NEWSLETTER_SIGNUP,
    name: 'Newsletter Signup',
    description: 'Newsletter subscription form',
    icon: '📧',
    fields: [
      {
        key: 'title',
        label: 'Section Title',
        type: FieldType.TEXT,
        required: true,
        localized: true,
      },
      { key: 'description', label: 'Description', type: FieldType.TEXT, localized: true },
      {
        key: 'buttonText',
        label: 'Button Text',
        type: FieldType.TEXT,
        localized: true,
        defaultValue: 'Subscribe',
      },
      { key: 'successMessage', label: 'Success Message', type: FieldType.TEXT, localized: true },
    ],
  },
  {
    componentType: ComponentType.FAQ_SECTION,
    name: 'FAQ Section',
    description: 'Frequently asked questions accordion',
    icon: '❓',
    fields: [
      {
        key: 'title',
        label: 'Section Title',
        type: FieldType.TEXT,
        required: true,
        localized: true,
      },
      {
        key: 'faqs',
        label: 'FAQs (JSON)',
        type: FieldType.JSON,
        helpText: 'Array of FAQ objects with question and answer',
      },
      {
        key: 'allowMultipleOpen',
        label: 'Allow Multiple Open',
        type: FieldType.BOOLEAN,
        defaultValue: false,
      },
    ],
  },
  {
    componentType: ComponentType.TESTIMONIALS,
    name: 'Testimonials',
    description: 'User testimonials/reviews section',
    icon: '⭐',
    fields: [
      {
        key: 'title',
        label: 'Section Title',
        type: FieldType.TEXT,
        required: true,
        localized: true,
      },
      {
        key: 'testimonials',
        label: 'Testimonials (JSON)',
        type: FieldType.JSON,
        helpText: 'Array of testimonial objects',
      },
      {
        key: 'layout',
        label: 'Layout',
        type: FieldType.SELECT,
        options: ['carousel', 'grid'],
        defaultValue: 'carousel',
      },
      { key: 'autoRotate', label: 'Auto Rotate', type: FieldType.BOOLEAN, defaultValue: true },
    ],
  },
  {
    componentType: ComponentType.CUSTOM,
    name: 'Custom Component',
    description: 'Custom HTML/component',
    icon: '⚙️',
    fields: [
      { key: 'componentName', label: 'Component Name', type: FieldType.TEXT, required: true },
      { key: 'props', label: 'Props (JSON)', type: FieldType.JSON },
      { key: 'customHtml', label: 'Custom HTML', type: FieldType.RICHTEXT },
    ],
  },
];

@Injectable()
export class PageComponentsService {
  private readonly pageEntityType = 'CMS_PAGE';
  private readonly componentEntityType = 'CMS_COMPONENT';

  constructor(
    @Inject(DATABASE_SERVICE)
    private readonly databaseService: DatabaseService,
  ) {}

  // ============================================
  // Page Methods
  // ============================================

  async createPage(dto: CreatePageDto): Promise<PageResponseDto> {
    // Check if slug already exists
    const existingPage = await this.findPageBySlug(dto.slug);
    if (existingPage) {
      throw new BadRequestException(`Page with slug "${dto.slug}" already exists`);
    }

    const id = uuidv4();
    const page: PageEntity = {
      PK: `${this.pageEntityType}#${id}`,
      SK: `${this.pageEntityType}#${id}`,
      GSI1PK: this.pageEntityType,
      GSI1SK: `ORDER#${String(dto.displayOrder || 0).padStart(3, '0')}#${dto.slug}`,
      id,
      slug: dto.slug,
      title: dto.title,
      description: dto.description,
      path: dto.path || `/${dto.slug}`,
      heroImage: dto.heroImage,
      status: dto.status || PageStatus.DRAFT,
      displayOrder: dto.displayOrder || 0,
      metaTitle: dto.metaTitle,
      metaDescription: dto.metaDescription,
      componentIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.databaseService.put(page);
    return this.mapPageToResponse(page);
  }

  async findAllPages(publishedOnly = false): Promise<PageListResponseDto> {
    const result = await this.databaseService.query<PageEntity>(this.pageEntityType, {
      indexName: 'GSI1',
      keyConditionExpression: 'GSI1PK = :pk',
      expressionAttributeValues: {
        ':pk': this.pageEntityType,
      },
      scanIndexForward: true,
    });

    let items = result.items;
    if (publishedOnly) {
      items = items.filter((item) => item.status === PageStatus.PUBLISHED);
    }

    return {
      items: items.map(this.mapPageToResponse),
      count: items.length,
    };
  }

  async findPageById(id: string): Promise<PageResponseDto> {
    const page = await this.databaseService.get<PageEntity>(
      `${this.pageEntityType}#${id}`,
      `${this.pageEntityType}#${id}`,
    );

    if (!page) {
      throw new NotFoundException(`Page with ID ${id} not found`);
    }

    return this.mapPageToResponse(page);
  }

  async findPageBySlug(slug: string): Promise<PageResponseDto | null> {
    const result = await this.databaseService.query<PageEntity>(this.pageEntityType, {
      indexName: 'GSI1',
      keyConditionExpression: 'GSI1PK = :pk',
      filterExpression: 'slug = :slug',
      expressionAttributeValues: {
        ':pk': this.pageEntityType,
        ':slug': slug,
      },
    });

    if (result.items.length === 0) {
      return null;
    }

    return this.mapPageToResponse(result.items[0]);
  }

  async findPageWithComponents(pageId: string): Promise<PageWithComponentsResponseDto> {
    const page = await this.findPageById(pageId);
    const components = await this.findComponentsByPage(pageId);

    return {
      ...page,
      components: components.items,
    };
  }

  async findPageWithComponentsBySlug(slug: string): Promise<PageWithComponentsResponseDto | null> {
    const page = await this.findPageBySlug(slug);
    if (!page) {
      return null;
    }

    const components = await this.findComponentsByPage(page.id);

    return {
      ...page,
      components: components.items,
    };
  }

  async updatePage(id: string, dto: UpdatePageDto): Promise<PageResponseDto> {
    const existing = await this.findPageById(id);
    if (!existing) {
      throw new NotFoundException(`Page with ID ${id} not found`);
    }

    // Check slug uniqueness if changing
    if (dto.slug && dto.slug !== existing.slug) {
      const existingWithSlug = await this.findPageBySlug(dto.slug);
      if (existingWithSlug) {
        throw new BadRequestException(`Page with slug "${dto.slug}" already exists`);
      }
    }

    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    const fieldsToUpdate = [
      'slug',
      'title',
      'description',
      'path',
      'heroImage',
      'status',
      'displayOrder',
      'metaTitle',
      'metaDescription',
    ];

    for (const field of fieldsToUpdate) {
      if ((dto as any)[field] !== undefined) {
        updateExpressions.push(`#${field} = :${field}`);
        expressionAttributeNames[`#${field}`] = field;
        expressionAttributeValues[`:${field}`] = (dto as any)[field];
      }
    }

    updateExpressions.push('updatedAt = :updatedAt');
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    const updated = await this.databaseService.update<PageEntity>(this.pageEntityType, {
      key: {
        PK: `${this.pageEntityType}#${id}`,
        SK: `${this.pageEntityType}#${id}`,
      },
      updateExpression: `SET ${updateExpressions.join(', ')}`,
      expressionAttributeNames,
      expressionAttributeValues,
    });

    return this.mapPageToResponse(updated);
  }

  async deletePage(id: string): Promise<void> {
    const existing = await this.findPageById(id);
    if (!existing) {
      throw new NotFoundException(`Page with ID ${id} not found`);
    }

    // Delete all components for this page
    const components = await this.findComponentsByPage(id);
    for (const component of components.items) {
      await this.deleteComponent(component.id);
    }

    // Delete the page
    await this.databaseService.delete(
      `${this.pageEntityType}#${id}`,
      `${this.pageEntityType}#${id}`,
    );
  }

  // ============================================
  // Component Methods
  // ============================================

  async createComponent(dto: CreatePageComponentDto): Promise<PageComponentResponseDto> {
    // Verify page exists
    await this.findPageById(dto.pageId);

    const id = uuidv4();
    const component: PageComponentEntity = {
      PK: `${this.componentEntityType}#${id}`,
      SK: `${this.componentEntityType}#${id}`,
      GSI1PK: `PAGE#${dto.pageId}`,
      GSI1SK: `ORDER#${String(dto.displayOrder || 0).padStart(3, '0')}#${dto.componentType}`,
      id,
      pageId: dto.pageId,
      componentType: dto.componentType,
      name: dto.name,
      description: dto.description,
      fields: dto.fields || [],
      displayOrder: dto.displayOrder || 0,
      isVisible: dto.isVisible ?? true,
      customClasses: dto.customClasses,
      customStyles: dto.customStyles,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.databaseService.put(component);

    // Add component ID to page
    await this.addComponentToPage(dto.pageId, id);

    return this.mapComponentToResponse(component);
  }

  async findComponentsByPage(pageId: string): Promise<PageComponentListResponseDto> {
    const result = await this.databaseService.query<PageComponentEntity>(this.componentEntityType, {
      indexName: 'GSI1',
      keyConditionExpression: 'GSI1PK = :pk',
      expressionAttributeValues: {
        ':pk': `PAGE#${pageId}`,
      },
      scanIndexForward: true,
    });

    return {
      items: result.items.map(this.mapComponentToResponse),
      count: result.items.length,
    };
  }

  async findComponentById(id: string): Promise<PageComponentResponseDto> {
    const component = await this.databaseService.get<PageComponentEntity>(
      `${this.componentEntityType}#${id}`,
      `${this.componentEntityType}#${id}`,
    );

    if (!component) {
      throw new NotFoundException(`Component with ID ${id} not found`);
    }

    return this.mapComponentToResponse(component);
  }

  async updateComponent(
    id: string,
    dto: UpdatePageComponentDto,
  ): Promise<PageComponentResponseDto> {
    const existing = await this.findComponentById(id);
    if (!existing) {
      throw new NotFoundException(`Component with ID ${id} not found`);
    }

    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    const fieldsToUpdate = [
      'componentType',
      'name',
      'description',
      'fields',
      'displayOrder',
      'isVisible',
      'customClasses',
      'customStyles',
    ];

    for (const field of fieldsToUpdate) {
      if ((dto as any)[field] !== undefined) {
        updateExpressions.push(`#${field} = :${field}`);
        expressionAttributeNames[`#${field}`] = field;
        expressionAttributeValues[`:${field}`] = (dto as any)[field];
      }
    }

    updateExpressions.push('updatedAt = :updatedAt');
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    const updated = await this.databaseService.update<PageComponentEntity>(
      this.componentEntityType,
      {
        key: {
          PK: `${this.componentEntityType}#${id}`,
          SK: `${this.componentEntityType}#${id}`,
        },
        updateExpression: `SET ${updateExpressions.join(', ')}`,
        expressionAttributeNames,
        expressionAttributeValues,
      },
    );

    return this.mapComponentToResponse(updated);
  }

  async deleteComponent(id: string): Promise<void> {
    const existing = await this.findComponentById(id);
    if (!existing) {
      throw new NotFoundException(`Component with ID ${id} not found`);
    }

    // Remove from page's componentIds
    await this.removeComponentFromPage(existing.pageId, id);

    // Delete the component
    await this.databaseService.delete(
      `${this.componentEntityType}#${id}`,
      `${this.componentEntityType}#${id}`,
    );
  }

  async bulkUpdateComponents(dto: BulkUpdateComponentsDto): Promise<PageComponentListResponseDto> {
    // Verify page exists
    await this.findPageById(dto.pageId);

    const updatedComponents: PageComponentResponseDto[] = [];

    for (const componentUpdate of dto.components) {
      const updated = await this.updateComponent(componentUpdate.id, componentUpdate);
      updatedComponents.push(updated);
    }

    return {
      items: updatedComponents,
      count: updatedComponents.length,
    };
  }

  async reorderComponents(dto: ReorderComponentsDto): Promise<PageComponentListResponseDto> {
    // Verify page exists
    await this.findPageById(dto.pageId);

    const updatedComponents: PageComponentResponseDto[] = [];

    for (let i = 0; i < dto.componentIds.length; i++) {
      const componentId = dto.componentIds[i];
      const updated = await this.updateComponent(componentId, { displayOrder: i });
      updatedComponents.push(updated);
    }

    // Update page's componentIds order
    await this.databaseService.update<PageEntity>(this.pageEntityType, {
      key: {
        PK: `${this.pageEntityType}#${dto.pageId}`,
        SK: `${this.pageEntityType}#${dto.pageId}`,
      },
      updateExpression: 'SET componentIds = :componentIds, updatedAt = :updatedAt',
      expressionAttributeValues: {
        ':componentIds': dto.componentIds,
        ':updatedAt': new Date().toISOString(),
      },
    });

    return {
      items: updatedComponents,
      count: updatedComponents.length,
    };
  }

  // ============================================
  // Component Templates
  // ============================================

  getComponentTemplates(): ComponentTemplateListResponseDto {
    return {
      items: COMPONENT_TEMPLATES,
      count: COMPONENT_TEMPLATES.length,
    };
  }

  getComponentTemplate(componentType: ComponentType): ComponentTemplateDto | null {
    return COMPONENT_TEMPLATES.find((t) => t.componentType === componentType) || null;
  }

  private readonly GLOBAL_PAGE_ID = '__GLOBAL__';

  async findGlobalComponents(): Promise<PageComponentListResponseDto> {
    const globalTypes = COMPONENT_TEMPLATES
      .filter((t) => t.isGlobal)
      .map((t) => t.componentType);

    if (globalTypes.length === 0) {
      return { items: [], count: 0 };
    }

    // 1. Query dedicated global components store
    const globalResult = await this.databaseService.query<PageComponentEntity>(
      this.componentEntityType,
      {
        indexName: 'GSI1',
        keyConditionExpression: 'GSI1PK = :pk',
        expressionAttributeValues: {
          ':pk': `PAGE#${this.GLOBAL_PAGE_ID}`,
        },
        scanIndexForward: true,
      },
    );

    const allGlobalComponents: PageComponentResponseDto[] = globalResult.items.map(
      this.mapComponentToResponse,
    );
    const foundTypes = new Set(allGlobalComponents.map((c) => c.componentType));

    // 2. Backward compatibility: also scan regular pages for global types not yet migrated
    if (foundTypes.size < globalTypes.length) {
      const pages = await this.findAllPages();
      for (const page of pages.items) {
        const components = await this.findComponentsByPage(page.id);
        const globals = components.items.filter(
          (c) =>
            globalTypes.includes(c.componentType as ComponentType) &&
            !foundTypes.has(c.componentType),
        );
        for (const g of globals) {
          if (!foundTypes.has(g.componentType)) {
            allGlobalComponents.push(g);
            foundTypes.add(g.componentType);
          }
        }
      }
    }

    return {
      items: allGlobalComponents,
      count: allGlobalComponents.length,
    };
  }

  async initializeGlobalComponent(
    componentType: ComponentType,
  ): Promise<PageComponentResponseDto> {
    // Check if already exists
    const existing = await this.findGlobalComponents();
    const existingComp = existing.items.find(
      (c) => c.componentType === componentType,
    );
    if (existingComp) {
      return existingComp;
    }

    // Validate template exists and is global
    const template = this.getComponentTemplate(componentType);
    if (!template) {
      throw new NotFoundException(
        `Template not found for type: ${componentType}`,
      );
    }
    if (!template.isGlobal) {
      throw new BadRequestException(
        `Component type ${componentType} is not a global component`,
      );
    }

    // Build default fields from template
    const defaultFields: ComponentFieldValue[] = template.fields.map((fd) => {
      if (fd.localized) {
        return {
          key: fd.key,
          localizedValue: {
            en: (fd.defaultValue as string) || '',
            hi: '',
          },
        };
      }
      return { key: fd.key, value: fd.defaultValue ?? '' };
    });

    const id = uuidv4();
    const component: PageComponentEntity = {
      PK: `${this.componentEntityType}#${id}`,
      SK: `${this.componentEntityType}#${id}`,
      GSI1PK: `PAGE#${this.GLOBAL_PAGE_ID}`,
      GSI1SK: `ORDER#000#${componentType}`,
      id,
      pageId: this.GLOBAL_PAGE_ID,
      componentType,
      name: { en: template.name, hi: template.name },
      description: { en: template.description },
      fields: defaultFields,
      displayOrder: 0,
      isVisible: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.databaseService.put(component);
    return this.mapComponentToResponse(component);
  }

  // ============================================
  // Helper Methods
  // ============================================

  private async addComponentToPage(pageId: string, componentId: string): Promise<void> {
    const page = await this.databaseService.get<PageEntity>(
      `${this.pageEntityType}#${pageId}`,
      `${this.pageEntityType}#${pageId}`,
    );

    if (page) {
      const componentIds = [...(page.componentIds || []), componentId];
      await this.databaseService.update<PageEntity>(this.pageEntityType, {
        key: {
          PK: `${this.pageEntityType}#${pageId}`,
          SK: `${this.pageEntityType}#${pageId}`,
        },
        updateExpression: 'SET componentIds = :componentIds, updatedAt = :updatedAt',
        expressionAttributeValues: {
          ':componentIds': componentIds,
          ':updatedAt': new Date().toISOString(),
        },
      });
    }
  }

  private async removeComponentFromPage(pageId: string, componentId: string): Promise<void> {
    const page = await this.databaseService.get<PageEntity>(
      `${this.pageEntityType}#${pageId}`,
      `${this.pageEntityType}#${pageId}`,
    );

    if (page) {
      const componentIds = (page.componentIds || []).filter((id) => id !== componentId);
      await this.databaseService.update<PageEntity>(this.pageEntityType, {
        key: {
          PK: `${this.pageEntityType}#${pageId}`,
          SK: `${this.pageEntityType}#${pageId}`,
        },
        updateExpression: 'SET componentIds = :componentIds, updatedAt = :updatedAt',
        expressionAttributeValues: {
          ':componentIds': componentIds,
          ':updatedAt': new Date().toISOString(),
        },
      });
    }
  }

  private mapPageToResponse(page: PageEntity): PageResponseDto {
    return {
      id: page.id,
      slug: page.slug,
      title: page.title,
      description: page.description,
      path: page.path,
      heroImage: page.heroImage,
      status: page.status,
      displayOrder: page.displayOrder,
      metaTitle: page.metaTitle,
      metaDescription: page.metaDescription,
      componentIds: page.componentIds || [],
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
    };
  }

  private mapComponentToResponse(component: PageComponentEntity): PageComponentResponseDto {
    return {
      id: component.id,
      pageId: component.pageId,
      componentType: component.componentType,
      name: component.name,
      description: component.description,
      fields: component.fields || [],
      displayOrder: component.displayOrder,
      isVisible: component.isVisible,
      customClasses: component.customClasses,
      customStyles: component.customStyles,
      createdAt: component.createdAt,
      updatedAt: component.updatedAt,
    };
  }
}
