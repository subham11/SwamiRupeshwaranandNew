import { Test, TestingModule } from '@nestjs/testing';
import { PageComponentsService } from '../page-components.service';
import { DATABASE_SERVICE } from '@/common/database';
import { ComponentType, PageStatus } from '../dto';

describe('PageComponentsService', () => {
  let service: PageComponentsService;

  const mockDb = {
    get: jest.fn(),
    put: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    query: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PageComponentsService,
        {
          provide: DATABASE_SERVICE,
          useValue: mockDb,
        },
      ],
    }).compile();

    service = module.get<PageComponentsService>(PageComponentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getComponentTemplates', () => {
    it('returns all component templates', () => {
      const result = service.getComponentTemplates();

      expect(result.items.length).toBeGreaterThan(0);
      expect(result.count).toBe(result.items.length);
    });

    it('includes isGlobal flag on global templates', () => {
      const result = service.getComponentTemplates();
      const announcementBar = result.items.find(
        (t) => t.componentType === ComponentType.ANNOUNCEMENT_BAR,
      );

      expect(announcementBar).toBeDefined();
      expect(announcementBar!.isGlobal).toBe(true);
    });

    it('does not mark non-global templates as global', () => {
      const result = service.getComponentTemplates();
      const GLOBAL_TYPES = new Set([
        ComponentType.ANNOUNCEMENT_BAR,
        ComponentType.HEADER,
        ComponentType.FOOTER,
      ]);
      const nonGlobalTemplates = result.items.filter(
        (t) => !GLOBAL_TYPES.has(t.componentType as ComponentType),
      );

      for (const template of nonGlobalTemplates) {
        expect(template.isGlobal).toBeFalsy();
      }
    });
  });

  describe('getComponentTemplate', () => {
    it('returns a single template by type', () => {
      const result = service.getComponentTemplate(ComponentType.ANNOUNCEMENT_BAR);

      expect(result).toBeDefined();
      expect(result!.componentType).toBe(ComponentType.ANNOUNCEMENT_BAR);
      expect(result!.isGlobal).toBe(true);
    });

    it('returns null for unknown component type', () => {
      const result = service.getComponentTemplate('unknown_type' as ComponentType);

      expect(result).toBeNull();
    });
  });

  describe('findGlobalComponents', () => {
    const makePage = (id: string) => ({
      PK: `CMS_PAGE#${id}`,
      SK: `CMS_PAGE#${id}`,
      GSI1PK: 'CMS_PAGE',
      GSI1SK: `ORDER#0#page-${id}`,
      id,
      slug: `page-${id}`,
      title: { en: `Page ${id}` },
      status: PageStatus.PUBLISHED,
      displayOrder: 0,
      componentIds: [],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    const makeComponent = (id: string, pageId: string, componentType: ComponentType) => ({
      PK: `CMS_COMPONENT#${id}`,
      SK: `CMS_COMPONENT#${id}`,
      GSI1PK: `PAGE#${pageId}`,
      GSI1SK: `ORDER#0#${componentType}`,
      id,
      pageId,
      componentType,
      name: { en: componentType },
      fields: [],
      displayOrder: 0,
      isVisible: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    it('returns only components of global types', async () => {
      // First query: findAllPages
      mockDb.query
        .mockResolvedValueOnce({
          items: [makePage('p1'), makePage('p2')],
        })
        // Second query: findComponentsByPage('p1')
        .mockResolvedValueOnce({
          items: [
            makeComponent('c1', 'p1', ComponentType.ANNOUNCEMENT_BAR),
            makeComponent('c2', 'p1', ComponentType.HERO_SECTION),
          ],
        })
        // Third query: findComponentsByPage('p2')
        .mockResolvedValueOnce({
          items: [
            makeComponent('c3', 'p2', ComponentType.TEXT_BLOCK),
          ],
        });

      const result = await service.findGlobalComponents();

      expect(result.count).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].componentType).toBe(ComponentType.ANNOUNCEMENT_BAR);
      expect(result.items[0].id).toBe('c1');
    });

    it('returns empty list when no global components exist', async () => {
      mockDb.query
        .mockResolvedValueOnce({
          items: [makePage('p1')],
        })
        .mockResolvedValueOnce({
          items: [
            makeComponent('c1', 'p1', ComponentType.HERO_SECTION),
          ],
        });

      const result = await service.findGlobalComponents();

      expect(result.count).toBe(0);
      expect(result.items).toHaveLength(0);
    });

    it('returns empty list when no pages exist', async () => {
      mockDb.query.mockResolvedValueOnce({ items: [] });

      const result = await service.findGlobalComponents();

      expect(result.count).toBe(0);
      expect(result.items).toHaveLength(0);
    });

    it('collects global components from multiple pages', async () => {
      mockDb.query
        .mockResolvedValueOnce({
          items: [makePage('p1'), makePage('p2')],
        })
        .mockResolvedValueOnce({
          items: [makeComponent('c1', 'p1', ComponentType.ANNOUNCEMENT_BAR)],
        })
        .mockResolvedValueOnce({
          items: [makeComponent('c2', 'p2', ComponentType.ANNOUNCEMENT_BAR)],
        });

      const result = await service.findGlobalComponents();

      expect(result.count).toBe(2);
      expect(result.items).toHaveLength(2);
      expect(result.items[0].id).toBe('c1');
      expect(result.items[1].id).toBe('c2');
    });
  });
});
