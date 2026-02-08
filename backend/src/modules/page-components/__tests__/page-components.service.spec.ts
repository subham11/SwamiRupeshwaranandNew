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

      const result = await service.findGlobalComponents();

      expect(result.count).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].componentType).toBe(ComponentType.ANNOUNCEMENT_BAR);
      expect(result.items[0].id).toBe('c1');
    });

    it('returns empty list when no global components exist', async () => {
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

      const result = await service.findGlobalComponents();

      expect(result.count).toBe(0);
      expect(result.items).toHaveLength(0);
    });

    it('returns empty list when no pages exist', async () => {
      mockDb.query
        // 1st query: PAGE#__GLOBAL__
        .mockResolvedValueOnce({ items: [] })
        // 2nd query: findAllPages
        .mockResolvedValueOnce({ items: [] });

      const result = await service.findGlobalComponents();

      expect(result.count).toBe(0);
      expect(result.items).toHaveLength(0);
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

      const result = await service.findGlobalComponents();

      expect(result.count).toBe(2);
      expect(result.items).toHaveLength(2);
      expect(result.items[0].id).toBe('c1');
      expect(result.items[1].id).toBe('c2');
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

      const result = await service.findGlobalComponents();

      // g1 (from __GLOBAL__) + c2 (header from p1) — c1 skipped as duplicate type
      expect(result.count).toBe(2);
      expect(result.items).toHaveLength(2);
      expect(result.items[0].id).toBe('g1');
      expect(result.items[1].id).toBe('c2');
    });
  });

  describe('initializeGlobalComponent', () => {
    it('creates a global component with default fields', async () => {
      // findGlobalComponents initial queries: __GLOBAL__ query + pages query
      mockDb.query
        .mockResolvedValueOnce({ items: [] }) // PAGE#__GLOBAL__
        .mockResolvedValueOnce({ items: [] }); // findAllPages
      mockDb.put.mockResolvedValueOnce({});

      const result = await service.initializeGlobalComponent(ComponentType.ANNOUNCEMENT_BAR);

      expect(result).toBeDefined();
      expect(result.componentType).toBe(ComponentType.ANNOUNCEMENT_BAR);
      expect(result.pageId).toBe('__GLOBAL__');
      expect(result.fields.length).toBeGreaterThan(0);
      expect(mockDb.put).toHaveBeenCalledTimes(1);
    });

    it('returns existing component if already initialized', async () => {
      const existing = {
        PK: 'CMS_COMPONENT#existing',
        SK: 'CMS_COMPONENT#existing',
        GSI1PK: 'PAGE#__GLOBAL__',
        GSI1SK: 'ORDER#000#announcement_bar',
        id: 'existing',
        pageId: '__GLOBAL__',
        componentType: ComponentType.ANNOUNCEMENT_BAR,
        name: { en: 'Announcement Bar' },
        fields: [{ key: 'text', localizedValue: { en: 'Hello', hi: '' } }],
        displayOrder: 0,
        isVisible: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };

      mockDb.query
        .mockResolvedValueOnce({ items: [existing] }) // PAGE#__GLOBAL__
        .mockResolvedValueOnce({ items: [] }); // findAllPages (still scanned for other global types)

      const result = await service.initializeGlobalComponent(ComponentType.ANNOUNCEMENT_BAR);

      expect(result.id).toBe('existing');
      expect(mockDb.put).not.toHaveBeenCalled();
    });

    it('rejects non-global component types', async () => {
      // findGlobalComponents queries
      mockDb.query
        .mockResolvedValueOnce({ items: [] }) // PAGE#__GLOBAL__
        .mockResolvedValueOnce({ items: [] }); // findAllPages

      await expect(
        service.initializeGlobalComponent(ComponentType.HERO_SECTION),
      ).rejects.toThrow('not a global component');
    });
  });
});
