/**
 * Subscription Plans Constants
 * 
 * This file contains the predefined subscription tiers for the application.
 * 
 * Payment Rules:
 * - Plans ≤ ₹2100: UPI Autopay enabled via Razorpay
 * - Plans > ₹2100 (₹5100, ₹21000): Manual payment only
 */

import {
  SubscriptionPlanType,
  BillingCycle,
  PaymentMethod,
  ContentType,
  PlanContentDto,
  GuidanceDetailsDto,
} from '../dto';

export interface SubscriptionPlanDefinition {
  id: string;
  planType: SubscriptionPlanType;
  name: string;
  nameHi: string;
  description: string;
  descriptionHi: string;
  price: number;
  billingCycle: BillingCycle;
  paymentMethod: PaymentMethod;
  autopayEnabled: boolean;
  contents: PlanContentDto[];
  guidance: GuidanceDetailsDto | null;
  features: string[];
  featuresHi: string[];
  displayOrder: number;
}

/**
 * Predefined Subscription Plans
 * 
 * 1. Free (₹0) - 10 Stotras including Bajrang Baan
 * 2. Basic (₹300) - 20 Stotras + Bajrang Baan practices [Autopay]
 * 3. Standard (₹1100) - 20 Stotras + practices + 1-time guidance [Autopay]
 * 4. Premium (₹2100) - 20 Stotras + 2 kavach + 5x/month guidance [Autopay]
 * 5. Elite (₹5100) - 20 Stotras + 5 kavach + kavach accomplishment guidance [Manual]
 * 6. Divine (₹21000) - 30 Stotras + 5 kavach + Swami Ji guidance [Manual]
 */
export const SUBSCRIPTION_PLANS: SubscriptionPlanDefinition[] = [
  // ============================================
  // FREE PLAN (₹0)
  // ============================================
  {
    id: 'plan-free',
    planType: SubscriptionPlanType.FREE,
    name: 'Free Plan',
    nameHi: 'निःशुल्क योजना',
    description: 'Start your spiritual journey with 10 sacred Stotras including the powerful Bajrang Baan.',
    descriptionHi: 'शक्तिशाली बजरंग बाण सहित 10 पवित्र स्तोत्रों के साथ अपनी आध्यात्मिक यात्रा शुरू करें।',
    price: 0,
    billingCycle: BillingCycle.ONE_TIME,
    paymentMethod: PaymentMethod.FREE,
    autopayEnabled: false,
    contents: [
      { type: ContentType.STOTRA, count: 10, description: '10 Stotras including Bajrang Baan' },
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
    displayOrder: 1,
  },

  // ============================================
  // BASIC PLAN (₹300) - UPI Autopay
  // ============================================
  {
    id: 'plan-basic',
    planType: SubscriptionPlanType.BASIC,
    name: 'Basic Plan',
    nameHi: 'बेसिक योजना',
    description: 'Expand your practice with 20 Stotras and dedicated Bajrang Baan practice sessions.',
    descriptionHi: '20 स्तोत्रों और समर्पित बजरंग बाण अभ्यास सत्रों के साथ अपने अभ्यास का विस्तार करें।',
    price: 300,
    billingCycle: BillingCycle.MONTHLY,
    paymentMethod: PaymentMethod.UPI_AUTOPAY,
    autopayEnabled: true,
    contents: [
      { type: ContentType.STOTRA, count: 20, description: '20 Stotras collection' },
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
    displayOrder: 2,
  },

  // ============================================
  // STANDARD PLAN (₹1100) - UPI Autopay
  // ============================================
  {
    id: 'plan-standard',
    planType: SubscriptionPlanType.STANDARD,
    name: 'Standard Plan',
    nameHi: 'स्टैंडर्ड योजना',
    description: 'Get 20 Stotras with Bajrang Baan practices and one-time online guidance from the Ashram.',
    descriptionHi: '20 स्तोत्र, बजरंग बाण अभ्यास और आश्रम से एक बार ऑनलाइन मार्गदर्शन प्राप्त करें।',
    price: 1100,
    billingCycle: BillingCycle.MONTHLY,
    paymentMethod: PaymentMethod.UPI_AUTOPAY,
    autopayEnabled: true,
    contents: [
      { type: ContentType.STOTRA, count: 20, description: '20 Stotras collection' },
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
    displayOrder: 3,
  },

  // ============================================
  // PREMIUM PLAN (₹2100) - UPI Autopay
  // ============================================
  {
    id: 'plan-premium',
    planType: SubscriptionPlanType.PREMIUM,
    name: 'Premium Plan',
    nameHi: 'प्रीमियम योजना',
    description: 'Access 20 Stotras, 2 special protective Kavach, and online guidance from the Ashram 5 times a month.',
    descriptionHi: '20 स्तोत्र, 2 विशेष सुरक्षा कवच, और आश्रम से महीने में 5 बार ऑनलाइन मार्गदर्शन प्राप्त करें।',
    price: 2100,
    billingCycle: BillingCycle.MONTHLY,
    paymentMethod: PaymentMethod.UPI_AUTOPAY,
    autopayEnabled: true,
    contents: [
      { type: ContentType.STOTRA, count: 20, description: '20 Stotras collection' },
      { type: ContentType.KAVACH, count: 2, description: '2 Special protective Kavach' },
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
    displayOrder: 4,
  },

  // ============================================
  // ELITE PLAN (₹5100) - Manual Payment Only
  // ============================================
  {
    id: 'plan-elite',
    planType: SubscriptionPlanType.ELITE,
    name: 'Elite Plan',
    nameHi: 'एलीट योजना',
    description: 'Unlock 20 Stotras, 5 special protective Kavach, and guidance on Stotra Kavach accomplishment from the Ashram.',
    descriptionHi: '20 स्तोत्र, 5 विशेष सुरक्षा कवच, और आश्रम से स्तोत्र कवच सिद्धि पर मार्गदर्शन प्राप्त करें।',
    price: 5100,
    billingCycle: BillingCycle.ONE_TIME,
    paymentMethod: PaymentMethod.MANUAL,
    autopayEnabled: false, // ❌ No autopay - Manual payment only
    contents: [
      { type: ContentType.STOTRA, count: 20, description: '20 Stotras collection' },
      { type: ContentType.KAVACH, count: 5, description: '5 Special protective Kavach' },
    ],
    guidance: {
      sessionsPerMonth: 0,
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
    displayOrder: 5,
  },

  // ============================================
  // DIVINE PLAN (₹21000) - Manual Payment Only
  // ============================================
  {
    id: 'plan-divine',
    planType: SubscriptionPlanType.DIVINE,
    name: 'Divine Plan',
    nameHi: 'दिव्य योजना',
    description: 'The ultimate spiritual package: 30 Stotras, 5 special protective Kavach, Ashram guidance, and personal online guidance from Revered Swami Rupeshwaranand Ji.',
    descriptionHi: 'परम आध्यात्मिक पैकेज: 30 स्तोत्र, 5 विशेष सुरक्षा कवच, आश्रम मार्गदर्शन, और पूज्य स्वामी रूपेश्वरानंद जी से व्यक्तिगत ऑनलाइन मार्गदर्शन।',
    price: 21000,
    billingCycle: BillingCycle.ONE_TIME,
    paymentMethod: PaymentMethod.MANUAL,
    autopayEnabled: false, // ❌ No autopay - Manual payment only
    contents: [
      { type: ContentType.STOTRA, count: 30, description: '30 Stotras collection - Complete library' },
      { type: ContentType.KAVACH, count: 5, description: '5 Special protective Kavach' },
    ],
    guidance: {
      sessionsPerMonth: 0,
      fromSwamiJi: true, // ⭐ Direct guidance from Swami Ji
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
    displayOrder: 6,
  },
];

/**
 * Get plan by type
 */
export function getPlanByType(planType: SubscriptionPlanType): SubscriptionPlanDefinition | undefined {
  return SUBSCRIPTION_PLANS.find(plan => plan.planType === planType);
}

/**
 * Get plan by ID
 */
export function getPlanById(id: string): SubscriptionPlanDefinition | undefined {
  return SUBSCRIPTION_PLANS.find(plan => plan.id === id);
}

/**
 * Check if a plan supports autopay
 */
export function isAutopayEnabled(planType: SubscriptionPlanType): boolean {
  const plan = getPlanByType(planType);
  return plan?.autopayEnabled ?? false;
}

/**
 * Check if a plan requires manual payment
 */
export function isManualPaymentRequired(planType: SubscriptionPlanType): boolean {
  const plan = getPlanByType(planType);
  return plan?.paymentMethod === PaymentMethod.MANUAL;
}

/**
 * Get all plans that support autopay
 */
export function getAutopayPlans(): SubscriptionPlanDefinition[] {
  return SUBSCRIPTION_PLANS.filter(plan => plan.autopayEnabled);
}

/**
 * Get all plans that require manual payment
 */
export function getManualPaymentPlans(): SubscriptionPlanDefinition[] {
  return SUBSCRIPTION_PLANS.filter(plan => plan.paymentMethod === PaymentMethod.MANUAL);
}

/**
 * Price thresholds
 */
export const PRICE_THRESHOLDS = {
  /** Plans at or below this price support UPI Autopay */
  AUTOPAY_MAX_PRICE: 2100,
  /** Plans above this price require manual payment */
  MANUAL_MIN_PRICE: 5100,
};
