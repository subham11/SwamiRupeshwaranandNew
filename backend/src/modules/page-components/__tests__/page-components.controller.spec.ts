import { Test, TestingModule } from '@nestjs/testing';
import { PageComponentsController } from '../page-components.controller';
import { PageComponentsService } from '../page-components.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { ComponentType } from '../dto';

describe('PageComponentsController', () => {
  let controller: PageComponentsController;

  const mockPageComponentsService = {
    createPage: jest.fn(),
    findAllPages: jest.fn(),
    findPageBySlug: jest.fn(),
    findPageById: jest.fn(),
    findPageWithComponents: jest.fn(),
    updatePage: jest.fn(),
    deletePage: jest.fn(),
    createComponent: jest.fn(),
    findComponentsByPage: jest.fn(),
    findComponentById: jest.fn(),
    updateComponent: jest.fn(),
    deleteComponent: jest.fn(),
    bulkUpdateComponents: jest.fn(),
    reorderComponents: jest.fn(),
    getComponentTemplates: jest.fn(),
    getComponentTemplate: jest.fn(),
    findGlobalComponents: jest.fn(),
  };

  const mockJwtAuthGuard = { canActivate: jest.fn().mockReturnValue(true) };
  const mockRolesGuard = { canActivate: jest.fn().mockReturnValue(true) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PageComponentsController],
      providers: [
        {
          provide: PageComponentsService,
          useValue: mockPageComponentsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    controller = module.get<PageComponentsController>(PageComponentsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findGlobalComponents', () => {
    it('returns global components from service', async () => {
      const mockResponse = {
        items: [
          {
            id: 'c1',
            pageId: 'p1',
            componentType: ComponentType.ANNOUNCEMENT_BAR,
            name: { en: 'Announcement Bar' },
            fields: [],
            displayOrder: 0,
            isVisible: true,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
        count: 1,
      };

      mockPageComponentsService.findGlobalComponents.mockResolvedValue(mockResponse);

      const result = await controller.findGlobalComponents();

      expect(result).toEqual(mockResponse);
      expect(mockPageComponentsService.findGlobalComponents).toHaveBeenCalled();
    });

    it('returns empty list when no global components exist', async () => {
      mockPageComponentsService.findGlobalComponents.mockResolvedValue({
        items: [],
        count: 0,
      });

      const result = await controller.findGlobalComponents();

      expect(result.items).toHaveLength(0);
      expect(result.count).toBe(0);
    });
  });

  describe('getComponentTemplates', () => {
    it('returns templates with isGlobal flag', () => {
      const mockTemplates = {
        items: [
          {
            componentType: ComponentType.ANNOUNCEMENT_BAR,
            name: 'Announcement Bar',
            description: 'Top announcement banner',
            icon: '📢',
            isGlobal: true,
            fields: [],
          },
          {
            componentType: ComponentType.HERO_SECTION,
            name: 'Hero Section',
            description: 'Main hero banner',
            icon: '🖼️',
            fields: [],
          },
        ],
        count: 2,
      };

      mockPageComponentsService.getComponentTemplates.mockReturnValue(mockTemplates);

      const result = controller.getComponentTemplates();

      expect(result.items).toHaveLength(2);
      expect(result.items[0].isGlobal).toBe(true);
      expect(result.items[1].isGlobal).toBeUndefined();
    });
  });

  describe('findAllPages', () => {
    it('returns pages list', async () => {
      const mockPages = {
        items: [{ id: 'p1', slug: 'home', title: { en: 'Home' } }],
        count: 1,
      };
      mockPageComponentsService.findAllPages.mockResolvedValue(mockPages);

      const result = await controller.findAllPages();

      expect(result.count).toBe(1);
      expect(mockPageComponentsService.findAllPages).toHaveBeenCalled();
    });
  });

  describe('createComponent', () => {
    it('creates a component', async () => {
      const dto = {
        pageId: 'p1',
        componentType: ComponentType.TEXT_BLOCK,
        name: { en: 'Text Block' },
        displayOrder: 0,
        isVisible: true,
        fields: [],
      };
      const mockResponse = { id: 'c1', ...dto };
      mockPageComponentsService.createComponent.mockResolvedValue(mockResponse);

      const result = await controller.createComponent(dto as any);

      expect(result.id).toBe('c1');
      expect(mockPageComponentsService.createComponent).toHaveBeenCalledWith(dto);
    });
  });
});
