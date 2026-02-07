import { Injectable, Inject, Logger, OnModuleInit } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService, DATABASE_SERVICE } from '@/common/database';
import { PageStatus, ComponentType } from './dto';

/**
 * Seeds initial CMS pages and components on first application start.
 * Checks if any CMS_PAGE records exist; if none, seeds default pages + home components.
 */
@Injectable()
export class PageComponentsSeedService implements OnModuleInit {
  private readonly logger = new Logger(PageComponentsSeedService.name);

  constructor(
    @Inject(DATABASE_SERVICE)
    private readonly databaseService: DatabaseService,
  ) {}

  async onModuleInit() {
    try {
      await this.seedIfEmpty();
    } catch (error) {
      this.logger.warn('Page seed check failed (non-fatal):', error);
    }
  }

  private async seedIfEmpty(): Promise<void> {
    // Check if any pages exist
    const existing = await this.databaseService.query<any>('CMS_PAGE', {
      indexName: 'GSI1',
      keyConditionExpression: 'GSI1PK = :pk',
      expressionAttributeValues: { ':pk': 'CMS_PAGE' },
      limit: 1,
    });

    if (existing.items.length > 0) {
      this.logger.log('CMS pages already exist, skipping seed.');
      return;
    }

    this.logger.log('No CMS pages found — seeding initial pages and components...');
    await this.seed();
  }

  private async seed(): Promise<void> {
    const INITIAL_PAGES = [
      {
        slug: 'home',
        title: { en: 'Home', hi: 'होम' },
        description: { en: 'Welcome to Sri Pitambara Peeth', hi: 'श्री पीताम्बरा पीठ में आपका स्वागत है' },
        path: '/',
        displayOrder: 0,
        status: PageStatus.PUBLISHED,
      },
      {
        slug: 'swamiji',
        title: { en: 'About Swamiji', hi: 'स्वामीजी के बारे में' },
        description: { en: 'Biography, teachings, and mission', hi: 'जीवन परिचय, शिक्षाएं और मिशन' },
        path: '/swamiji',
        displayOrder: 1,
        status: PageStatus.PUBLISHED,
      },
      {
        slug: 'bajrang-baan',
        title: { en: 'Bajrang Baan', hi: 'बजरंग बाण' },
        description: { en: 'Sacred Bajrang Baan text and audio', hi: 'पवित्र बजरंग बाण पाठ और ऑडियो' },
        path: '/bajrang-baan',
        displayOrder: 2,
        status: PageStatus.PUBLISHED,
      },
      {
        slug: 'events',
        title: { en: 'Events', hi: 'कार्यक्रम' },
        description: { en: 'Upcoming and past events', hi: 'आगामी और पूर्व कार्यक्रम' },
        path: '/events',
        displayOrder: 3,
        status: PageStatus.PUBLISHED,
      },
      {
        slug: 'gallery',
        title: { en: 'Gallery', hi: 'गैलरी' },
        description: { en: 'Photo and video gallery', hi: 'फोटो और वीडियो गैलरी' },
        path: '/gallery',
        displayOrder: 4,
        status: PageStatus.PUBLISHED,
      },
      {
        slug: 'contact',
        title: { en: 'Contact', hi: 'संपर्क' },
        description: { en: 'Get in touch with us', hi: 'हमसे संपर्क करें' },
        path: '/contact',
        displayOrder: 5,
        status: PageStatus.PUBLISHED,
      },
    ];

    const HOME_COMPONENTS = [
      {
        componentType: ComponentType.ANNOUNCEMENT_BAR,
        name: { en: 'Announcement Bar', hi: 'सूचना पट्टी' },
        description: { en: 'Top announcement banner', hi: 'शीर्ष सूचना बैनर' },
        displayOrder: 0,
        isVisible: true,
        fields: [
          {
            key: 'text',
            localizedValue: {
              en: '🔔 Join us for Hanuman Chalisa Path every Tuesday at 7 AM • 🙏 Daily Satsang at 6 PM',
              hi: '🔔 हर मंगलवार सुबह 7 बजे हनुमान चालीसा पाठ • 🙏 शाम 6 बजे दैनिक सत्संग',
            },
          },
          { key: 'bgColor', value: '#f97316' },
          { key: 'textColor', value: '#ffffff' },
          { key: 'isScrolling', value: true },
        ],
      },
      {
        componentType: ComponentType.HERO_SECTION,
        name: { en: 'Hero Section', hi: 'हीरो सेक्शन' },
        description: { en: 'Main hero banner', hi: 'मुख्य हीरो बैनर' },
        displayOrder: 1,
        isVisible: true,
        fields: [
          {
            key: 'slides',
            value: [
              {
                imageUrl: '/images/hero-1.svg',
                heading: { en: 'Sri Pitambara Peeth', hi: 'श्री पीताम्बरा पीठ' },
                subheading: { en: 'A sacred abode of spiritual wisdom and divine grace', hi: 'आध्यात्मिक ज्ञान और दैवीय कृपा का पवित्र धाम' },
                ctaText: { en: 'Learn More', hi: 'और जानें' },
                ctaLink: '/swamiji',
              },
              {
                imageUrl: '/images/hero-2.svg',
                heading: { en: 'Daily Inspirations & Teachings', hi: 'दैनिक प्रेरणा और शिक्षाएं' },
                subheading: { en: 'Ancient wisdom for contemporary challenges', hi: 'समकालीन चुनौतियों के लिए प्राचीन ज्ञान' },
                ctaText: { en: 'Explore', hi: 'खोजें' },
                ctaLink: '/teachings',
              },
            ],
          },
          { key: 'overlayOpacity', value: 0.5 },
          { key: 'enableParallax', value: true },
        ],
      },
      {
        componentType: ComponentType.SACRED_TEACHINGS,
        name: { en: 'Sacred Teachings', hi: 'पवित्र शिक्षाएं' },
        description: { en: 'Sacred teachings section', hi: 'पवित्र शिक्षाएं अनुभाग' },
        displayOrder: 2,
        isVisible: true,
        fields: [
          { key: 'title', localizedValue: { en: 'Sacred Teachings', hi: 'पवित्र शिक्षाएं' } },
          { key: 'subtitle', localizedValue: { en: 'Wisdom from the ancient scriptures', hi: 'प्राचीन शास्त्रों से ज्ञान' } },
          { key: 'layout', value: 'grid' },
          { key: 'maxItems', value: 6 },
        ],
      },
      {
        componentType: ComponentType.UPCOMING_EVENTS,
        name: { en: 'Upcoming Events', hi: 'आगामी कार्यक्रम' },
        description: { en: 'Upcoming events list', hi: 'आगामी कार्यक्रमों की सूची' },
        displayOrder: 3,
        isVisible: true,
        fields: [
          { key: 'title', localizedValue: { en: 'Upcoming Events', hi: 'आगामी कार्यक्रम' } },
          { key: 'subtitle', localizedValue: { en: 'Join us for these divine occasions', hi: 'इन पवित्र अवसरों पर हमारे साथ जुड़ें' } },
          {
            key: 'events',
            value: [
              {
                title: { en: 'Hanuman Chalisa Path', hi: 'हनुमान चालीसा पाठ' },
                description: { en: 'Weekly recitation of Hanuman Chalisa', hi: 'हनुमान चालीसा का साप्ताहिक पाठ' },
                date: '2026-03-01T07:00:00',
                location: { en: 'Main Temple Hall', hi: 'मुख्य मंदिर हॉल' },
                link: '/events',
              },
            ],
          },
          { key: 'viewAllLink', value: '/events' },
        ],
      },
      {
        componentType: ComponentType.WORDS_OF_WISDOM,
        name: { en: 'Words of Wisdom', hi: 'ज्ञान के शब्द' },
        description: { en: 'Inspirational quotes', hi: 'प्रेरणादायक उद्धरण' },
        displayOrder: 4,
        isVisible: true,
        fields: [
          { key: 'title', localizedValue: { en: 'Words of Wisdom', hi: 'ज्ञान के शब्द' } },
          {
            key: 'quotes',
            value: [
              {
                text: { en: 'The purpose of life is to serve others.', hi: 'जीवन का उद्देश्य दूसरों की सेवा करना है।' },
                author: { en: 'Swami Rupeshwaranand', hi: 'स्वामी रूपेश्वरानंद' },
              },
            ],
          },
          { key: 'autoRotate', value: true },
          { key: 'rotateInterval', value: 5 },
        ],
      },
    ];

    const createdPages: { id: string; slug: string }[] = [];

    // Create pages
    for (const pageData of INITIAL_PAGES) {
      const pageId = uuidv4();
      const now = new Date().toISOString();

      await this.databaseService.put({
        PK: `CMS_PAGE#${pageId}`,
        SK: `CMS_PAGE#${pageId}`,
        GSI1PK: 'CMS_PAGE',
        GSI1SK: `ORDER#${String(pageData.displayOrder).padStart(3, '0')}#${pageData.slug}`,
        id: pageId,
        slug: pageData.slug,
        title: pageData.title,
        description: pageData.description,
        path: pageData.path,
        status: pageData.status,
        displayOrder: pageData.displayOrder,
        componentIds: [],
        createdAt: now,
        updatedAt: now,
      });

      createdPages.push({ id: pageId, slug: pageData.slug });
      this.logger.log(`  ✅ Seeded page: ${pageData.slug}`);
    }

    // Create home page components
    const homePage = createdPages.find((p) => p.slug === 'home');
    if (homePage) {
      const componentIds: string[] = [];

      for (const comp of HOME_COMPONENTS) {
        const componentId = uuidv4();
        const now = new Date().toISOString();

        await this.databaseService.put({
          PK: `CMS_COMPONENT#${componentId}`,
          SK: `CMS_COMPONENT#${componentId}`,
          GSI1PK: `PAGE#${homePage.id}`,
          GSI1SK: `ORDER#${String(comp.displayOrder).padStart(3, '0')}#${comp.componentType}`,
          id: componentId,
          pageId: homePage.id,
          componentType: comp.componentType,
          name: comp.name,
          description: comp.description,
          fields: comp.fields,
          displayOrder: comp.displayOrder,
          isVisible: comp.isVisible,
          createdAt: now,
          updatedAt: now,
        });

        componentIds.push(componentId);
        this.logger.log(`    ✅ Seeded component: ${comp.name.en}`);
      }

      // Update home page with component IDs
      await this.databaseService.update('CMS_PAGE', {
        key: {
          PK: `CMS_PAGE#${homePage.id}`,
          SK: `CMS_PAGE#${homePage.id}`,
        },
        updateExpression: 'SET componentIds = :componentIds, updatedAt = :updatedAt',
        expressionAttributeValues: {
          ':componentIds': componentIds,
          ':updatedAt': new Date().toISOString(),
        },
      });
    }

    this.logger.log(`✨ Seeded ${createdPages.length} pages and ${HOME_COMPONENTS.length} home components.`);
  }
}
