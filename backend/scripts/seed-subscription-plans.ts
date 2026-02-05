/**
 * Seed script to create the 6 subscription plans
 * Usage: npx ts-node scripts/seed-subscription-plans.ts
 * 
 * Subscription Tiers:
 * 1. Free (₹0) - 10 Stotras including Bajrang Baan
 * 2. Basic (₹300) - 20 Stotras + Bajrang Baan practices
 * 3. Standard (₹1100) - 20 Stotras + practices + 1-time guidance
 * 4. Premium (₹2100) - 20 Stotras + 2 kavach + 5x/month guidance
 * 5. Elite (₹5100) - 20 Stotras + 5 kavach + kavach accomplishment guidance
 * 6. Divine (₹21000) - 30 Stotras + 5 kavach + Swami Ji guidance
 * 
 * Payment Rules:
 * - Free, Basic, Standard, Premium: UPI Autopay enabled
 * - Elite, Divine: Manual payment only (no autopay)
 */

import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { v4 as uuidv4 } from 'uuid';

// Configuration
const isLocal = process.env.IS_LOCAL === 'true' || process.env.NODE_ENV === 'development';
const TABLE_NAME = process.env.TABLE_NAME || 'swami-rupeshwaranand-api-local-main';
const REGION = process.env.AWS_REGION || 'ap-south-1';

const dynamoClient = new DynamoDBClient({
  region: REGION,
  ...(isLocal && { endpoint: 'http://localhost:8000' }),
});

// Subscription Plan Definitions
const SUBSCRIPTION_PLANS = [
  {
    id: 'plan-free',
    planType: 'free',
    name: 'Free Plan',
    nameHi: 'निःशुल्क योजना',
    description: 'Start your spiritual journey with 10 sacred Stotras including the powerful Bajrang Baan.',
    descriptionHi: 'शक्तिशाली बजरंग बाण सहित 10 पवित्र स्तोत्रों के साथ अपनी आध्यात्मिक यात्रा शुरू करें।',
    price: 0,
    billingCycle: 'one_time',
    paymentMethod: 'free',
    autopayEnabled: false,
    contents: [
      { type: 'stotra', count: 10, description: '10 Stotras including Bajrang Baan' },
    ],
    guidance: null,
    features: [
      '10 Sacred Stotras',
      'Bajrang Baan included',
      'Access anytime, anywhere',
      'Mobile-friendly reading',
    ],
    featuresHi: [
      '10 पवित्र स्तोत्र',
      'बजरंग बाण शामिल',
      'कहीं भी, कभी भी एक्सेस',
      'मोबाइल-फ्रेंडली रीडिंग',
    ],
    isActive: true,
    displayOrder: 1,
  },
  {
    id: 'plan-basic',
    planType: 'basic',
    name: 'Basic Plan',
    nameHi: 'बेसिक योजना',
    description: 'Expand your practice with 20 Stotras and dedicated Bajrang Baan practice sessions.',
    descriptionHi: '20 स्तोत्रों और समर्पित बजरंग बाण अभ्यास सत्रों के साथ अपने अभ्यास का विस्तार करें।',
    price: 300,
    billingCycle: 'monthly',
    paymentMethod: 'upi_autopay',
    autopayEnabled: true,
    contents: [
      { type: 'stotra', count: 20, description: '20 Stotras collection' },
      { type: 'guidance', count: 0, description: 'Bajrang Baan practice sessions' },
    ],
    guidance: null,
    features: [
      '20 Sacred Stotras',
      'Bajrang Baan practice guide',
      'Audio recitations',
      'Monthly updates',
      'UPI Autopay supported',
    ],
    featuresHi: [
      '20 पवित्र स्तोत्र',
      'बजरंग बाण अभ्यास मार्गदर्शिका',
      'ऑडियो पाठ',
      'मासिक अपडेट',
      'UPI ऑटोपे समर्थित',
    ],
    isActive: true,
    displayOrder: 2,
  },
  {
    id: 'plan-standard',
    planType: 'standard',
    name: 'Standard Plan',
    nameHi: 'स्टैंडर्ड योजना',
    description: 'Get 20 Stotras with Bajrang Baan practices and one-time online guidance from the Ashram.',
    descriptionHi: '20 स्तोत्र, बजरंग बाण अभ्यास और आश्रम से एक बार ऑनलाइन मार्गदर्शन प्राप्त करें।',
    price: 1100,
    billingCycle: 'monthly',
    paymentMethod: 'upi_autopay',
    autopayEnabled: true,
    contents: [
      { type: 'stotra', count: 20, description: '20 Stotras collection' },
      { type: 'guidance', count: 1, description: 'Bajrang Baan practice sessions' },
    ],
    guidance: {
      sessionsPerMonth: 0, // One-time guidance
      fromSwamiJi: false,
      guidanceType: 'online',
      notes: 'One-time online guidance from the Ashram on Stotra practice',
    },
    features: [
      '20 Sacred Stotras',
      'Bajrang Baan practice guide',
      'One-time online guidance from Ashram',
      'Audio & video content',
      'UPI Autopay supported',
    ],
    featuresHi: [
      '20 पवित्र स्तोत्र',
      'बजरंग बाण अभ्यास मार्गदर्शिका',
      'आश्रम से एक बार ऑनलाइन मार्गदर्शन',
      'ऑडियो और वीडियो कंटेंट',
      'UPI ऑटोपे समर्थित',
    ],
    isActive: true,
    displayOrder: 3,
  },
  {
    id: 'plan-premium',
    planType: 'premium',
    name: 'Premium Plan',
    nameHi: 'प्रीमियम योजना',
    description: 'Access 20 Stotras, 2 special protective Kavach, and online guidance from the Ashram 5 times a month.',
    descriptionHi: '20 स्तोत्र, 2 विशेष सुरक्षा कवच, और आश्रम से महीने में 5 बार ऑनलाइन मार्गदर्शन प्राप्त करें।',
    price: 2100,
    billingCycle: 'monthly',
    paymentMethod: 'upi_autopay',
    autopayEnabled: true,
    contents: [
      { type: 'stotra', count: 20, description: '20 Stotras collection' },
      { type: 'kavach', count: 2, description: '2 Special protective Kavach' },
    ],
    guidance: {
      sessionsPerMonth: 5,
      fromSwamiJi: false,
      guidanceType: 'online',
      notes: 'Online guidance from the Ashram - 5 sessions per month',
    },
    features: [
      '20 Sacred Stotras',
      '2 Special Protective Kavach',
      '5 Monthly guidance sessions from Ashram',
      'Priority support',
      'UPI Autopay supported',
    ],
    featuresHi: [
      '20 पवित्र स्तोत्र',
      '2 विशेष सुरक्षा कवच',
      'आश्रम से 5 मासिक मार्गदर्शन सत्र',
      'प्राथमिकता समर्थन',
      'UPI ऑटोपे समर्थित',
    ],
    isActive: true,
    displayOrder: 4,
  },
  {
    id: 'plan-elite',
    planType: 'elite',
    name: 'Elite Plan',
    nameHi: 'एलीट योजना',
    description: 'Unlock 20 Stotras, 5 special protective Kavach, and guidance on Stotra Kavach accomplishment from the Ashram.',
    descriptionHi: '20 स्तोत्र, 5 विशेष सुरक्षा कवच, और आश्रम से स्तोत्र कवच सिद्धि पर मार्गदर्शन प्राप्त करें।',
    price: 5100,
    billingCycle: 'one_time',
    paymentMethod: 'manual',
    autopayEnabled: false, // Manual payment only - no autopay
    contents: [
      { type: 'stotra', count: 20, description: '20 Stotras collection' },
      { type: 'kavach', count: 5, description: '5 Special protective Kavach' },
    ],
    guidance: {
      sessionsPerMonth: 0, // Guidance on accomplishment
      fromSwamiJi: false,
      guidanceType: 'online',
      notes: 'Online guidance from Ashram on Stotra Kavach accomplishment',
    },
    features: [
      '20 Sacred Stotras',
      '5 Special Protective Kavach',
      'Kavach accomplishment guidance',
      'Advanced practice techniques',
      'Manual payment (Bank Transfer/UPI)',
    ],
    featuresHi: [
      '20 पवित्र स्तोत्र',
      '5 विशेष सुरक्षा कवच',
      'कवच सिद्धि मार्गदर्शन',
      'उन्नत अभ्यास तकनीकें',
      'मैन्युअल भुगतान (बैंक ट्रांसफर/UPI)',
    ],
    isActive: true,
    displayOrder: 5,
  },
  {
    id: 'plan-divine',
    planType: 'divine',
    name: 'Divine Plan',
    nameHi: 'दिव्य योजना',
    description: 'The ultimate spiritual package: 30 Stotras, 5 special protective Kavach, Ashram guidance, and personal online guidance from Revered Swami Rupeshwaranand Ji.',
    descriptionHi: 'परम आध्यात्मिक पैकेज: 30 स्तोत्र, 5 विशेष सुरक्षा कवच, आश्रम मार्गदर्शन, और पूज्य स्वामी रूपेश्वरानंद जी से व्यक्तिगत ऑनलाइन मार्गदर्शन।',
    price: 21000,
    billingCycle: 'one_time',
    paymentMethod: 'manual',
    autopayEnabled: false, // Manual payment only - no autopay
    contents: [
      { type: 'stotra', count: 30, description: '30 Stotras collection - Complete library' },
      { type: 'kavach', count: 5, description: '5 Special protective Kavach' },
    ],
    guidance: {
      sessionsPerMonth: 0,
      fromSwamiJi: true, // Direct guidance from Swami Ji
      guidanceType: 'online',
      notes: 'One-time personal online guidance on Stotra Kavach accomplishment from Revered Swami Rupeshwaranand Ji, plus Ashram guidance',
    },
    features: [
      '30 Sacred Stotras (Complete Collection)',
      '5 Special Protective Kavach',
      'Regular Ashram guidance',
      'Personal guidance from Swami Rupeshwaranand Ji',
      'Stotra Kavach accomplishment training',
      'Lifetime access to content',
      'Manual payment (Bank Transfer/UPI)',
    ],
    featuresHi: [
      '30 पवित्र स्तोत्र (संपूर्ण संग्रह)',
      '5 विशेष सुरक्षा कवच',
      'नियमित आश्रम मार्गदर्शन',
      'स्वामी रूपेश्वरानंद जी से व्यक्तिगत मार्गदर्शन',
      'स्तोत्र कवच सिद्धि प्रशिक्षण',
      'आजीवन कंटेंट एक्सेस',
      'मैन्युअल भुगतान (बैंक ट्रांसफर/UPI)',
    ],
    isActive: true,
    displayOrder: 6,
  },
];

async function seedSubscriptionPlans(): Promise<void> {
  console.log('🚀 Seeding Subscription Plans...\n');
  console.log(`Environment: ${isLocal ? 'LOCAL' : 'PRODUCTION'}`);
  console.log(`Table: ${TABLE_NAME}`);
  console.log(`Region: ${REGION}\n`);

  const now = new Date().toISOString();

  for (const plan of SUBSCRIPTION_PLANS) {
    try {
      const item = {
        PK: { S: `SUBSCRIPTION_PLAN#${plan.id}` },
        SK: { S: `SUBSCRIPTION_PLAN#${plan.id}` },
        GSI1PK: { S: 'SUBSCRIPTION_PLAN' },
        GSI1SK: { S: `ORDER#${String(plan.displayOrder).padStart(3, '0')}#${plan.planType}` },
        id: { S: plan.id },
        planType: { S: plan.planType },
        name: { S: plan.name },
        nameHi: { S: plan.nameHi },
        description: { S: plan.description },
        descriptionHi: { S: plan.descriptionHi },
        price: { N: String(plan.price) },
        billingCycle: { S: plan.billingCycle },
        paymentMethod: { S: plan.paymentMethod },
        autopayEnabled: { BOOL: plan.autopayEnabled },
        contents: { S: JSON.stringify(plan.contents) },
        guidance: plan.guidance ? { S: JSON.stringify(plan.guidance) } : { NULL: true },
        features: { S: JSON.stringify(plan.features) },
        featuresHi: { S: JSON.stringify(plan.featuresHi) },
        isActive: { BOOL: plan.isActive },
        displayOrder: { N: String(plan.displayOrder) },
        createdAt: { S: now },
        updatedAt: { S: now },
      };

      const command = new PutItemCommand({
        TableName: TABLE_NAME,
        Item: item,
      });

      await dynamoClient.send(command);
      console.log(`✅ Created: ${plan.name} (₹${plan.price}) - ${plan.autopayEnabled ? 'Autopay' : 'Manual'}`);
    } catch (error) {
      console.error(`❌ Failed to create ${plan.name}:`, error);
    }
  }

  console.log('\n📋 Subscription Plans Summary:');
  console.log('================================');
  console.log('| Plan     | Price   | Payment Method    |');
  console.log('|----------|---------|-------------------|');
  for (const plan of SUBSCRIPTION_PLANS) {
    const priceStr = plan.price === 0 ? 'Free' : `₹${plan.price}`;
    const paymentStr = plan.autopayEnabled ? 'UPI Autopay' : 'Manual';
    console.log(`| ${plan.planType.padEnd(8)} | ${priceStr.padEnd(7)} | ${paymentStr.padEnd(17)} |`);
  }
  console.log('================================\n');

  console.log('✅ Subscription plans seeding complete!');
}

seedSubscriptionPlans().catch(console.error);
