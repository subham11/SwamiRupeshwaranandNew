/**
 * Seed script to create initial pages and components
 * Run with: npm run seed:pages
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const isLocal = process.env.IS_LOCAL === 'true';
const tableName = process.env.DYNAMODB_TABLE || 'swami-rupeshwaranand-dev';

const client = new DynamoDBClient(
  isLocal
    ? {
        region: 'us-east-1',
        endpoint: 'http://localhost:8000',
        credentials: { accessKeyId: 'local', secretAccessKey: 'local' },
      }
    : { region: process.env.AWS_REGION || 'ap-south-1' }
);

const docClient = DynamoDBDocumentClient.from(client);

// ============================================
// Initial Pages Configuration
// ============================================
const INITIAL_PAGES = [
  {
    slug: 'home',
    title: { en: 'Home', hi: 'होम' },
    description: { en: 'Welcome to Sri Pitambara Peeth', hi: 'श्री पीताम्बरा पीठ में आपका स्वागत है' },
    path: '/',
    displayOrder: 0,
    status: 'published',
  },
  {
    slug: 'swamiji',
    title: { en: 'About Swamiji', hi: 'स्वामीजी के बारे में' },
    description: { en: 'Biography, teachings, and mission', hi: 'जीवन परिचय, शिक्षाएं और मिशन' },
    path: '/swamiji',
    displayOrder: 1,
    status: 'published',
  },
  {
    slug: 'bajrang-baan',
    title: { en: 'Bajrang Baan', hi: 'बजरंग बाण' },
    description: { en: 'Sacred Bajrang Baan text and audio', hi: 'पवित्र बजरंग बाण पाठ और ऑडियो' },
    path: '/bajrang-baan',
    displayOrder: 2,
    status: 'published',
  },
  {
    slug: 'events',
    title: { en: 'Events', hi: 'कार्यक्रम' },
    description: { en: 'Upcoming and past events', hi: 'आगामी और पूर्व कार्यक्रम' },
    path: '/events',
    displayOrder: 3,
    status: 'published',
  },
  {
    slug: 'gallery',
    title: { en: 'Gallery', hi: 'गैलरी' },
    description: { en: 'Photo and video gallery', hi: 'फोटो और वीडियो गैलरी' },
    path: '/gallery',
    displayOrder: 4,
    status: 'published',
  },
  {
    slug: 'contact',
    title: { en: 'Contact', hi: 'संपर्क' },
    description: { en: 'Get in touch with us', hi: 'हमसे संपर्क करें' },
    path: '/contact',
    displayOrder: 5,
    status: 'published',
  },
];

// ============================================
// Initial Components for Home Page
// ============================================
const HOME_PAGE_COMPONENTS = [
  {
    componentType: 'announcement_bar',
    name: { en: 'Announcement Bar', hi: 'सूचना पट्टी' },
    description: { en: 'Top announcement banner with scrolling text', hi: 'स्क्रॉलिंग टेक्स्ट के साथ शीर्ष सूचना बैनर' },
    displayOrder: 0,
    isVisible: true,
    fields: [
      {
        key: 'text',
        localizedValue: {
          en: '🔔 Join us for Hanuman Chalisa Path every Tuesday at 7 AM • 🎉 Special Bhandara on Nov 25th • 🧘 New Yoga Sessions starting Nov 20th • 🙏 Daily Satsang at 6 PM',
          hi: '🔔 हर मंगलवार सुबह 7 बजे हनुमान चालीसा पाठ में शामिल हों • 🎉 25 नवंबर को विशेष भंडारा • 🧘 20 नवंबर से नए योग सत्र • 🙏 शाम 6 बजे दैनिक सत्संग',
        },
      },
      { key: 'ariaLabel', value: 'Announcements' },
      { key: 'bgColor', value: '#f97316' },
      { key: 'textColor', value: '#ffffff' },
      { key: 'isScrolling', value: true },
    ],
  },
  {
    componentType: 'hero_section',
    name: { en: 'Hero Section', hi: 'हीरो सेक्शन' },
    description: { en: 'Main hero banner with parallax effect', hi: 'पैरालैक्स प्रभाव के साथ मुख्य हीरो बैनर' },
    displayOrder: 1,
    isVisible: true,
    fields: [
      {
        key: 'heading',
        localizedValue: {
          en: 'Sri Pitambara Peeth',
          hi: 'श्री पीताम्बरा पीठ',
        },
      },
      {
        key: 'subheading',
        localizedValue: {
          en: 'A sacred abode of spiritual wisdom and divine grace',
          hi: 'आध्यात्मिक ज्ञान और दैवीय कृपा का पवित्र धाम',
        },
      },
      { key: 'backgroundImage', value: '/images/hero-bg.jpg' },
      {
        key: 'ctaText',
        localizedValue: { en: 'Learn More', hi: 'और जानें' },
      },
      { key: 'ctaLink', value: '/swamiji' },
      { key: 'overlayOpacity', value: 0.5 },
      { key: 'enableParallax', value: true },
    ],
  },
  {
    componentType: 'sacred_teachings',
    name: { en: 'Sacred Teachings', hi: 'पवित्र शिक्षाएं' },
    description: { en: 'Display sacred teachings section', hi: 'पवित्र शिक्षाएं प्रदर्शित करें' },
    displayOrder: 2,
    isVisible: true,
    fields: [
      {
        key: 'title',
        localizedValue: { en: 'Sacred Teachings', hi: 'पवित्र शिक्षाएं' },
      },
      {
        key: 'subtitle',
        localizedValue: {
          en: 'Wisdom from the ancient scriptures',
          hi: 'प्राचीन शास्त्रों से ज्ञान',
        },
      },
      { key: 'layout', value: 'grid' },
      { key: 'maxItems', value: 6 },
    ],
  },
  {
    componentType: 'upcoming_events',
    name: { en: 'Upcoming Events', hi: 'आगामी कार्यक्रम' },
    description: { en: 'Shows upcoming events list', hi: 'आगामी कार्यक्रमों की सूची' },
    displayOrder: 3,
    isVisible: true,
    fields: [
      {
        key: 'title',
        localizedValue: { en: 'Upcoming Events', hi: 'आगामी कार्यक्रम' },
      },
      {
        key: 'subtitle',
        localizedValue: {
          en: 'Join us for these divine occasions',
          hi: 'इन पवित्र अवसरों पर हमारे साथ जुड़ें',
        },
      },
      { key: 'maxEvents', value: 4 },
      { key: 'showPastEvents', value: false },
      { key: 'viewAllLink', value: '/events' },
    ],
  },
  {
    componentType: 'words_of_wisdom',
    name: { en: 'Words of Wisdom', hi: 'ज्ञान के शब्द' },
    description: { en: 'Inspirational quotes section', hi: 'प्रेरणादायक उद्धरण अनुभाग' },
    displayOrder: 4,
    isVisible: true,
    fields: [
      {
        key: 'title',
        localizedValue: { en: 'Words of Wisdom', hi: 'ज्ञान के शब्द' },
      },
      {
        key: 'quotes',
        value: JSON.stringify([
          {
            text: { en: 'The purpose of life is to serve others.', hi: 'जीवन का उद्देश्य दूसरों की सेवा करना है।' },
            author: { en: 'Swami Rupeshwaranand', hi: 'स्वामी रूपेश्वरानंद' },
          },
          {
            text: { en: 'In devotion, we find true peace.', hi: 'भक्ति में हमें सच्ची शांति मिलती है।' },
            author: { en: 'Swami Rupeshwaranand', hi: 'स्वामी रूपेश्वरानंद' },
          },
        ]),
      },
      { key: 'autoRotate', value: true },
      { key: 'rotateInterval', value: 5 },
    ],
  },
];

async function seedPages() {
  console.log('🌱 Seeding pages and components...\n');
  console.log(`📍 Environment: ${isLocal ? 'LOCAL' : 'PRODUCTION'}`);
  console.log(`📊 Table: ${tableName}\n`);

  const createdPages: { id: string; slug: string }[] = [];

  // Create pages
  for (const pageData of INITIAL_PAGES) {
    const pageId = uuidv4();
    const now = new Date().toISOString();

    const page = {
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
    };

    try {
      await docClient.send(
        new PutCommand({
          TableName: tableName,
          Item: page,
        })
      );
      console.log(`✅ Created page: ${pageData.slug}`);
      createdPages.push({ id: pageId, slug: pageData.slug });
    } catch (error) {
      console.error(`❌ Failed to create page ${pageData.slug}:`, error);
    }
  }

  // Find home page ID
  const homePage = createdPages.find((p) => p.slug === 'home');
  
  if (homePage) {
    const componentIds: string[] = [];

    // Create components for home page
    for (const componentData of HOME_PAGE_COMPONENTS) {
      const componentId = uuidv4();
      const now = new Date().toISOString();

      const component = {
        PK: `CMS_COMPONENT#${componentId}`,
        SK: `CMS_COMPONENT#${componentId}`,
        GSI1PK: `PAGE#${homePage.id}`,
        GSI1SK: `ORDER#${String(componentData.displayOrder).padStart(3, '0')}#${componentData.componentType}`,
        id: componentId,
        pageId: homePage.id,
        componentType: componentData.componentType,
        name: componentData.name,
        description: componentData.description,
        fields: componentData.fields,
        displayOrder: componentData.displayOrder,
        isVisible: componentData.isVisible,
        createdAt: now,
        updatedAt: now,
      };

      try {
        await docClient.send(
          new PutCommand({
            TableName: tableName,
            Item: component,
          })
        );
        console.log(`  ✅ Created component: ${componentData.name.en}`);
        componentIds.push(componentId);
      } catch (error) {
        console.error(`  ❌ Failed to create component ${componentData.name.en}:`, error);
      }
    }

    // Update home page with component IDs
    try {
      await docClient.send(
        new PutCommand({
          TableName: tableName,
          Item: {
            PK: `CMS_PAGE#${homePage.id}`,
            SK: `CMS_PAGE#${homePage.id}`,
            GSI1PK: 'CMS_PAGE',
            GSI1SK: `ORDER#000#home`,
            id: homePage.id,
            slug: 'home',
            title: { en: 'Home', hi: 'होम' },
            description: { en: 'Welcome to Sri Pitambara Peeth', hi: 'श्री पीताम्बरा पीठ में आपका स्वागत है' },
            path: '/',
            status: 'published',
            displayOrder: 0,
            componentIds,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        })
      );
      console.log(`\n✅ Updated home page with ${componentIds.length} components`);
    } catch (error) {
      console.error('❌ Failed to update home page:', error);
    }
  }

  console.log('\n✨ Seeding completed!');
  console.log(`📄 Created ${createdPages.length} pages`);
  console.log(`🧩 Created ${HOME_PAGE_COMPONENTS.length} components for home page`);
}

seedPages().catch(console.error);
