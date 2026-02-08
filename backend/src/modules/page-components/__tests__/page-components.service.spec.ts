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
      mockDb.query
        // 1st query: PAGE#__GLOBAL__
        .mockResolvedValueOnce({ items: [] })
        // 2nd query: findAllPages
        .mockResolvedValueOnce({
          items: [makePage('p1'), makePage('p2')],
        })
        // 3rd query: findComponentsByPage('p1')
        .mockResolvedValueOnce({
          items: [
            makeComponent('c1', 'p1', ComponentType.ANNOUNCEMENT_BAR),
            makeComponent('c2', 'p1', ComponentType.HERO_SECTION),
          ],
        })
        // 4th query: findComponentsByPage('p2')
        .mockResolvedValueOnce({
          items: [
            makeComponent('c3', 'p2', ComponentType.TEXT_BLOCK),
          ],
        });
      mockDb.put.mockResolvedValue({}); // for auto-init

      const result = await service.findGlobalComponents();

      // announcement_bar found from p1, header & footer auto-initialized
      expect(result.items.some((c) => c.componentType === ComponentType.ANNOUNCEMENT_BAR)).toBe(true);
      expect(result.items.some((c) => c.componentType === ComponentType.HEADER)).toBe(true);
      expect(result.items.some((c) => c.componentType === ComponentType.FOOTER)).toBe(true);
      // HERO_SECTION and TEXT_BLOCK must not be included
      expect(result.items.some((c) => c.componentType === ComponentType.HERO_SECTION)).toBe(false);
      expect(result.items.some((c) => c.componentType === ComponentType.TEXT_BLOCK)).toBe(false);
      expect(result.count).toBe(3);
    });

    it('auto-initializes missing global components when none exist', async () => {
      mockDb.query
        // 1st query: PAGE#__GLOBAL__
        .mockResolvedValueOnce({ items: [] })
        // 2nd query: findAllPages
        .mockResolvedValueOnce({
          items: [makePage('p1')],
        })
        // 3rd query: findComponentsByPage('p1')
        .mockResolvedValueOnce({
          items: [
            makeComponent('c1', 'p1', ComponentType.HERO_SECTION),
          ],
        });
      mockDb.put.mockResolvedValue({}); // for auto-init

      const result = await service.findGlobalComponents();

      // All 3 global types should be auto-created
      expect(result.count).toBe(3);
      expect(result.items).toHaveLength(3);
      expect(mockDb.put).toHaveBeenCalledTimes(3);
    });

    it('auto-initializes when no pages exist', async () => {
      mockDb.query
        // 1st query: PAGE#__GLOBAL__
        .mockResolvedValueOnce({ items: [] })
        // 2nd query: findAllPages
        .mockResolvedValueOnce({ items: [] });
      mockDb.put.mockResolvedValue({}); // for auto-init

      const result = await service.findGlobalComponents();

      // All 3 global types auto-created
      expect(result.count).toBe(3);
      expect(result.items).toHaveLength(3);
      expect(mockDb.put).toHaveBeenCalledTimes(3);
    });

    it('collects global components from multiple pages (deduplicated by type)', async () => {
      mockDb.query
        // 1st query: PAGE#__GLOBAL__
        .mockResolvedValueOnce({ items: [] })
        // 2nd query: findAllPages
        .mockResolvedValueOnce({
          items: [makePage('p1'), makePage('p2')],
        })
        // 3rd query: findComponentsByPage('p1')
        .mockResolvedValueOnce({
          items: [makeComponent('c1', 'p1', ComponentType.ANNOUNCEMENT_BAR)],
        })
        // 4th query: findComponentsByPage('p2')
        .mockResolvedValueOnce({
          items: [makeComponent('c2', 'p2', ComponentType.HEADER)],
        });
      mockDb.put.mockResolvedValue({}); // for auto-init of footer

      const result = await service.findGlobalComponents();

      // c1 announcement_bar + c2 header from pages, footer auto-initialized
      expect(result.count).toBe(3);
      expect(result.items).toHaveLength(3);
      expect(result.items.some((c) => c.id === 'c1')).toBe(true);
      expect(result.items.some((c) => c.id === 'c2')).toBe(true);
      expect(result.items.some((c) => c.componentType === ComponentType.FOOTER)).toBe(true);
      // only footer was auto-created
      expect(mockDb.put).toHaveBeenCalledTimes(1);
    });

    it('prefers __GLOBAL__ components over page-level ones', async () => {
      mockDb.query
        // 1st query: PAGE#__GLOBAL__ — has an announcement_bar
        .mockResolvedValueOnce({
          items: [makeComponent('g1', '__GLOBAL__', ComponentType.ANNOUNCEMENT_BAR)],
        })
        // 2nd query: findAllPages (still scanned for missing types)
        .mockResolvedValueOnce({
          items: [makePage('p1')],
        })
        // 3rd query: findComponentsByPage('p1')
        .mockResolvedValueOnce({
          items: [
            makeComponent('c1', 'p1', ComponentType.ANNOUNCEMENT_BAR), // duplicate — should be skipped
            makeComponent('c2', 'p1', ComponentType.HEADER),
          ],
        });
      mockDb.put.mockResolvedValue({}); // for auto-init of footer

      const result = await service.findGlobalComponents();

      // g1 (from __GLOBAL__) + c2 (header from p1) + auto-initialized footer
      expect(result.count).toBe(3);
      expect(result.items).toHaveLength(3);
      expect(result.items[0].id).toBe('g1');
      expect(result.items[1].id).toBe('c2');
      expect(result.items[2].componentType).toBe(ComponentType.FOOTER);
    });

    it('does not auto-initialize when all globals already exist in __GLOBAL__', async () => {
      mockDb.query
        .mockResolvedValueOnce({
          items: [
            makeComponent('g1', '__GLOBAL__', ComponentType.ANNOUNCEMENT_BAR),
            makeComponent('g2', '__GLOBAL__', ComponentType.HEADER),
            makeComponent('g3', '__GLOBAL__', ComponentType.FOOTER),
          ],
        });

      const result = await service.findGlobalComponents();

      expect(result.count).toBe(3);
      expect(mockDb.put).not.toHaveBeenCalled();
    });
  });
});
