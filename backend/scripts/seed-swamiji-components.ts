/**
 * Migration script to add text_block components to the existing swamiji CMS page.
 * Run with: npx ts-node -r tsconfig-paths/register scripts/seed-swamiji-components.ts
 *
 * This is needed because the initial seed only created the swamiji page without
 * any text_block components. The page content was hardcoded in the frontend.
 * This script migrates that content into CMS-managed text_block components.
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
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
    : { region: process.env.AWS_REGION || 'ap-south-1' },
);

const docClient = DynamoDBDocumentClient.from(client);

const SWAMIJI_TEXT_BLOCKS = [
  {
    componentType: 'text_block',
    name: { en: 'Early Life & Calling', hi: 'प्रारंभिक जीवन और आह्वान' },
    description: { en: 'About Swamiji - Early Life section', hi: 'स्वामीजी के बारे में - प्रारंभिक जीवन अनुभाग' },
    displayOrder: 0,
    isVisible: true,
    fields: [
      {
        key: 'title',
        localizedValue: {
          en: 'Early Life & Calling',
          hi: 'प्रारंभिक जीवन और आह्वान',
        },
      },
      {
        key: 'content',
        localizedValue: {
          en: '<p>From an early age, Swami Rupeshwaranand Ji showed an extraordinary inclination towards spirituality and the quest for truth. His journey began in the sacred lands of India, where he spent years in deep meditation and study under the guidance of enlightened masters.</p>',
          hi: '<p>बचपन से ही, स्वामी रूपेश्वरानंद जी ने आध्यात्मिकता और सत्य की खोज के प्रति असाधारण झुकाव दिखाया। उनकी यात्रा भारत की पवित्र भूमि में शुरू हुई, जहां उन्होंने प्रबुद्ध गुरुओं के मार्गदर्शन में गहन ध्यान और अध्ययन में वर्षों बिताए।</p>',
        },
      },
      { key: 'alignment', value: 'left' },
    ],
  },
  {
    componentType: 'text_block',
    name: { en: 'Teachings & Philosophy', hi: 'शिक्षाएं और दर्शन' },
    description: { en: 'About Swamiji - Teachings section', hi: 'स्वामीजी के बारे में - शिक्षाएं अनुभाग' },
    displayOrder: 1,
    isVisible: true,
    fields: [
      {
        key: 'title',
        localizedValue: {
          en: 'Teachings & Philosophy',
          hi: 'शिक्षाएं और दर्शन',
        },
      },
      {
        key: 'content',
        localizedValue: {
          en: '<p>Swami Ji\'s teachings blend ancient Vedic wisdom with practical guidance for modern life. He emphasizes the importance of self-realization, selfless service (seva), and the cultivation of inner peace through meditation and devotion.</p>',
          hi: '<p>स्वामी जी की शिक्षाएं प्राचीन वैदिक ज्ञान को आधुनिक जीवन के लिए व्यावहारिक मार्गदर्शन के साथ मिलाती हैं। वे आत्म-साक्षात्कार, निःस्वार्थ सेवा (सेवा), और ध्यान और भक्ति के माध्यम से आंतरिक शांति की खेती के महत्व पर जोर देते हैं।</p>',
        },
      },
      { key: 'alignment', value: 'left' },
    ],
  },
  {
    componentType: 'text_block',
    name: { en: 'Mission & Vision', hi: 'मिशन और दृष्टि' },
    description: { en: 'About Swamiji - Mission section', hi: 'स्वामीजी के बारे में - मिशन अनुभाग' },
    displayOrder: 2,
    isVisible: true,
    fields: [
      {
        key: 'title',
        localizedValue: {
          en: 'Mission & Vision',
          hi: 'मिशन और दृष्टि',
        },
      },
      {
        key: 'content',
        localizedValue: {
          en: '<p>His mission is to help seekers from all walks of life discover their true spiritual nature and live a life of purpose, peace, and fulfillment. Through the ashram, he provides a sanctuary for spiritual growth and community service.</p>',
          hi: '<p>उनका मिशन सभी क्षेत्रों के साधकों को उनके सच्चे आध्यात्मिक स्वभाव की खोज करने और उद्देश्य, शांति और पूर्णता का जीवन जीने में मदद करना है। आश्रम के माध्यम से, वे आध्यात्मिक विकास और सामुदायिक सेवा के लिए एक अभयारण्य प्रदान करते हैं।</p>',
        },
      },
      { key: 'alignment', value: 'left' },
    ],
  },
];

async function findSwamijiPage(): Promise<{ id: string; slug: string } | null> {
  // Query all CMS pages and find the one with slug 'swamiji'
  const result = await docClient.send(
    new QueryCommand({
      TableName: tableName,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk',
      ExpressionAttributeValues: { ':pk': 'CMS_PAGE' },
    }),
  );

  const swamijiPage = result.Items?.find((item) => item.slug === 'swamiji');
  if (!swamijiPage) return null;
  return { id: swamijiPage.id, slug: swamijiPage.slug };
}

async function checkExistingComponents(pageId: string): Promise<boolean> {
  // Check if text_block components already exist for this page
  const result = await docClient.send(
    new QueryCommand({
      TableName: tableName,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk',
      ExpressionAttributeValues: { ':pk': `PAGE#${pageId}` },
    }),
  );

  const textBlocks = result.Items?.filter((item) => item.componentType === 'text_block') || [];
  return textBlocks.length > 0;
}

async function seedSwamijiComponents() {
  console.log('🌱 Seeding swamiji page text_block components...\n');
  console.log(`📍 Environment: ${isLocal ? 'LOCAL' : 'PRODUCTION'}`);
  console.log(`📊 Table: ${tableName}\n`);

  // Find the existing swamiji page
  const swamijiPage = await findSwamijiPage();
  if (!swamijiPage) {
    console.error('❌ Swamiji page not found. Run the main seed first.');
    return;
  }
  const pageId = swamijiPage.id;
  console.log(`📄 Found swamiji page: ${pageId}\n`);

  // Check if text_block components already exist
  const hasTextBlocks = await checkExistingComponents(pageId);
  if (hasTextBlocks) {
    console.log('⚠️  Text block components already exist for swamiji page. Skipping.');
    return;
  }

  // Create text_block components
  const componentIds: string[] = [];

  for (const comp of SWAMIJI_TEXT_BLOCKS) {
    const componentId = uuidv4();
    const now = new Date().toISOString();

    try {
      await docClient.send(
        new PutCommand({
          TableName: tableName,
          Item: {
            PK: `CMS_COMPONENT#${componentId}`,
            SK: `CMS_COMPONENT#${componentId}`,
            GSI1PK: `PAGE#${pageId}`,
            GSI1SK: `ORDER#${String(comp.displayOrder).padStart(3, '0')}#${comp.componentType}`,
            id: componentId,
            pageId: pageId,
            componentType: comp.componentType,
            name: comp.name,
            description: comp.description,
            fields: comp.fields,
            displayOrder: comp.displayOrder,
            isVisible: comp.isVisible,
            createdAt: now,
            updatedAt: now,
          },
        }),
      );
      console.log(`  ✅ Created: ${comp.name.en}`);
      componentIds.push(componentId);
    } catch (error) {
      console.error(`  ❌ Failed to create ${comp.name.en}:`, error);
    }
  }

  // Update swamiji page componentIds (append to existing)
  try {
    // First get existing componentIds
    const existingResult = await docClient.send(
      new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: 'PK = :pk AND SK = :sk',
        ExpressionAttributeValues: {
          ':pk': `CMS_PAGE#${pageId}`,
          ':sk': `CMS_PAGE#${pageId}`,
        },
      }),
    );

    const existingComponentIds = existingResult.Items?.[0]?.componentIds || [];
    const allComponentIds = [...existingComponentIds, ...componentIds];

    await docClient.send(
      new UpdateCommand({
        TableName: tableName,
        Key: {
          PK: `CMS_PAGE#${pageId}`,
          SK: `CMS_PAGE#${pageId}`,
        },
        UpdateExpression: 'SET componentIds = :componentIds, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':componentIds': allComponentIds,
          ':updatedAt': new Date().toISOString(),
        },
      }),
    );
    console.log(`\n✅ Updated swamiji page with ${componentIds.length} new text_block components`);
  } catch (error) {
    console.error('❌ Failed to update swamiji page componentIds:', error);
  }

  console.log('\n✨ Migration completed!');
}

seedSwamijiComponents().catch(console.error);
