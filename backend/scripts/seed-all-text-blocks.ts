/**
 * Migration script to add text_block components to ALL CMS pages that need them.
 * Run with: npx ts-node -r tsconfig-paths/register scripts/seed-all-text-blocks.ts
 *
 * This script is idempotent — it skips pages that already have text_block components.
 * Safe to run multiple times. Handles both fresh installs and existing deployments.
 *
 * Pages handled: contact, ashram, gurukul, teachings, donation, events, services,
 *   teaching-inner-peace, teaching-mantras, teaching-seva, teaching-dharma
 *
 * Note: swamiji is handled separately by seed-swamiji-components.ts (or already done).
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  UpdateCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
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

// ============================================
// All page component definitions
// ============================================

const PAGE_COMPONENTS: Record<string, {
  componentType: string;
  name: { en: string; hi: string };
  description: { en: string; hi: string };
  displayOrder: number;
  isVisible: boolean;
  fields: { key: string; value?: string | boolean; localizedValue?: { en: string; hi: string } }[];
}[]> = {
  contact: [
    {
      componentType: 'text_block',
      name: { en: 'Contact Information', hi: 'संपर्क जानकारी' },
      description: { en: 'Contact page information', hi: 'संपर्क पृष्ठ जानकारी' },
      displayOrder: 0,
      isVisible: true,
      fields: [
        { key: 'title', localizedValue: { en: 'Get in Touch', hi: 'संपर्क करें' } },
        {
          key: 'content',
          localizedValue: {
            en: '<p>📍 <strong>Address:</strong> Sri Pitambara Peeth, Datia, Madhya Pradesh, India</p><p>📞 <strong>Phone:</strong> +91 XXXXX XXXXX</p><p>📧 <strong>Email:</strong> contact@swamirupeshwaranand.org</p><p>🕐 <strong>Office Hours:</strong> 9:00 AM – 6:00 PM IST (Mon–Sat)</p>',
            hi: '<p>📍 <strong>पता:</strong> श्री पीताम्बरा पीठ, दतिया, मध्य प्रदेश, भारत</p><p>📞 <strong>फोन:</strong> +91 XXXXX XXXXX</p><p>📧 <strong>ईमेल:</strong> contact@swamirupeshwaranand.org</p><p>🕐 <strong>कार्यालय समय:</strong> सुबह 9:00 – शाम 6:00 IST (सोम–शनि)</p>',
          },
        },
        { key: 'alignment', value: 'left' },
      ],
    },
  ],

  ashram: [
    {
      componentType: 'text_block',
      name: { en: 'Ashram Description', hi: 'आश्रम विवरण' },
      description: { en: 'About the ashram', hi: 'आश्रम के बारे में' },
      displayOrder: 0,
      isVisible: true,
      fields: [
        { key: 'title', localizedValue: { en: 'About Our Ashram', hi: 'हमारे आश्रम के बारे में' } },
        {
          key: 'content',
          localizedValue: {
            en: '<p>Nestled in the serene surroundings of Datia, Sri Pitambara Peeth is a sanctuary where seekers find solace, wisdom, and spiritual rejuvenation. Under the divine guidance of Swami Rupeshwaranand Ji, the ashram serves as a beacon of light for all who seek inner peace.</p>',
            hi: '<p>दतिया के शांत वातावरण में बसा, श्री पीताम्बरा पीठ एक अभयारण्य है जहाँ साधकों को शांति, ज्ञान और आध्यात्मिक कायाकल्प मिलता है। स्वामी रूपेश्वरानंद जी के दिव्य मार्गदर्शन में, आश्रम उन सभी के लिए प्रकाश की किरण के रूप में कार्य करता है जो आंतरिक शांति की खोज में हैं।</p>',
          },
        },
        { key: 'alignment', value: 'center' },
      ],
    },
    {
      componentType: 'text_block',
      name: { en: 'Ashram Facilities', hi: 'आश्रम सुविधाएं' },
      description: { en: 'Ashram facilities', hi: 'आश्रम सुविधाएं' },
      displayOrder: 1,
      isVisible: true,
      fields: [
        { key: 'title', localizedValue: { en: 'Our Facilities', hi: 'हमारी सुविधाएं' } },
        {
          key: 'content',
          localizedValue: {
            en: '<p>🛕 <strong>Main Temple</strong> — A sacred space for daily prayers and ceremonies</p><p>🧘 <strong>Meditation Hall</strong> — Find inner peace in our serene meditation center</p><p>📚 <strong>Library</strong> — Explore spiritual texts and scriptures</p><p>🏡 <strong>Guest Accommodation</strong> — Comfortable stay for visiting devotees</p>',
            hi: '<p>🛕 <strong>मुख्य मंदिर</strong> — दैनिक प्रार्थना और समारोहों के लिए पवित्र स्थान</p><p>🧘 <strong>ध्यान कक्ष</strong> — हमारे शांत ध्यान केंद्र में आंतरिक शांति पाएं</p><p>📚 <strong>पुस्तकालय</strong> — आध्यात्मिक ग्रंथों और शास्त्रों का अन्वेषण करें</p><p>🏡 <strong>अतिथि आवास</strong> — आने वाले भक्तों के लिए आरामदायक ठहराव</p>',
          },
        },
        { key: 'alignment', value: 'left' },
      ],
    },
  ],

  gurukul: [
    {
      componentType: 'text_block',
      name: { en: 'Gurukul Introduction', hi: 'गुरुकुल परिचय' },
      description: { en: 'Introduction', hi: 'परिचय' },
      displayOrder: 0,
      isVisible: true,
      fields: [
        { key: 'title', localizedValue: { en: 'About the Initiative', hi: 'पहल के बारे में' } },
        {
          key: 'content',
          localizedValue: {
            en: '<p>The "One District One Gurukul" initiative by Swami Rupeshwaranand Ji is a visionary project aimed at reviving the ancient Gurukul system of education in every district of India. This initiative combines timeless Vedic wisdom with modern educational practices.</p>',
            hi: '<p>"एक जिला एक गुरुकुल" पहल स्वामी रूपेश्वरानंद जी द्वारा एक दूरदर्शी परियोजना है जिसका उद्देश्य भारत के प्रत्येक जिले में प्राचीन गुरुकुल शिक्षा प्रणाली को पुनर्जीवित करना है।</p>',
          },
        },
        { key: 'alignment', value: 'center' },
      ],
    },
    {
      componentType: 'text_block',
      name: { en: 'Gurukul Vision', hi: 'गुरुकुल दृष्टि' },
      description: { en: 'Vision section', hi: 'दृष्टि अनुभाग' },
      displayOrder: 1,
      isVisible: true,
      fields: [
        { key: 'title', localizedValue: { en: 'Our Vision', hi: 'हमारी दृष्टि' } },
        {
          key: 'content',
          localizedValue: {
            en: '<p>To establish a Gurukul in every district, creating centers of holistic education that nurture both academic excellence and spiritual growth. Our vision is to produce citizens who are not only professionally competent but also morally grounded and spiritually aware.</p>',
            hi: '<p>हर जिले में एक गुरुकुल स्थापित करना, समग्र शिक्षा के केंद्र बनाना जो शैक्षणिक उत्कृष्टता और आध्यात्मिक विकास दोनों का पोषण करें।</p>',
          },
        },
        { key: 'alignment', value: 'left' },
      ],
    },
    {
      componentType: 'text_block',
      name: { en: 'Gurukul Objectives', hi: 'गुरुकुल उद्देश्य' },
      description: { en: 'Key objectives', hi: 'प्रमुख उद्देश्य' },
      displayOrder: 2,
      isVisible: true,
      fields: [
        { key: 'title', localizedValue: { en: 'Key Objectives', hi: 'प्रमुख उद्देश्य' } },
        {
          key: 'content',
          localizedValue: {
            en: '<p>📖 <strong>Vedic Studies</strong> — Sanskrit, scriptures, and ancient wisdom</p><p>🧘 <strong>Yoga & Meditation</strong> — Daily practice for mind-body wellness</p><p>💻 <strong>Modern Education</strong> — Science, technology, and contemporary subjects</p><p>🌱 <strong>Character Building</strong> — Values, ethics, and moral development</p>',
            hi: '<p>📖 <strong>वैदिक अध्ययन</strong> — संस्कृत, शास्त्र और प्राचीन ज्ञान</p><p>🧘 <strong>योग और ध्यान</strong> — मन-शरीर कल्याण के लिए दैनिक अभ्यास</p><p>💻 <strong>आधुनिक शिक्षा</strong> — विज्ञान, प्रौद्योगिकी और समकालीन विषय</p><p>🌱 <strong>चरित्र निर्माण</strong> — मूल्य, नैतिकता और नैतिक विकास</p>',
          },
        },
        { key: 'alignment', value: 'left' },
      ],
    },
    {
      componentType: 'text_block',
      name: { en: 'Gurukul Curriculum', hi: 'गुरुकुल पाठ्यक्रम' },
      description: { en: 'Curriculum overview', hi: 'पाठ्यक्रम अवलोकन' },
      displayOrder: 3,
      isVisible: true,
      fields: [
        { key: 'title', localizedValue: { en: 'Curriculum', hi: 'पाठ्यक्रम' } },
        {
          key: 'content',
          localizedValue: {
            en: '<p>Our curriculum integrates the best of traditional Gurukul education with modern academic standards, ensuring students receive a well-rounded education that prepares them for both worldly success and spiritual fulfillment.</p>',
            hi: '<p>हमारा पाठ्यक्रम पारंपरिक गुरुकुल शिक्षा के सर्वोत्तम को आधुनिक शैक्षणिक मानकों के साथ एकीकृत करता है।</p>',
          },
        },
        { key: 'alignment', value: 'left' },
      ],
    },
  ],

  teachings: [
    {
      componentType: 'text_block',
      name: { en: 'Teachings Introduction', hi: 'शिक्षाएं परिचय' },
      description: { en: 'Teachings intro', hi: 'शिक्षाएं परिचय' },
      displayOrder: 0,
      isVisible: true,
      fields: [
        { key: 'title', localizedValue: { en: 'Ancient Wisdom for Modern Life', hi: 'आधुनिक जीवन के लिए प्राचीन ज्ञान' } },
        {
          key: 'content',
          localizedValue: {
            en: '<p>Swami Rupeshwaranand Ji\'s teachings bridge the timeless wisdom of the Vedas with the challenges of contemporary living, offering practical guidance for spiritual growth and inner transformation.</p>',
            hi: '<p>स्वामी रूपेश्वरानंद जी की शिक्षाएं वेदों के कालातीत ज्ञान को समकालीन जीवन की चुनौतियों से जोड़ती हैं, आध्यात्मिक विकास और आंतरिक परिवर्तन के लिए व्यावहारिक मार्गदर्शन प्रदान करती हैं।</p>',
          },
        },
        { key: 'alignment', value: 'center' },
      ],
    },
  ],

  donation: [
    {
      componentType: 'text_block',
      name: { en: 'Donation Description', hi: 'दान विवरण' },
      description: { en: 'Donation page description', hi: 'दान पृष्ठ विवरण' },
      displayOrder: 0,
      isVisible: true,
      fields: [
        { key: 'title', localizedValue: { en: 'Support Our Mission', hi: 'हमारे मिशन का समर्थन करें' } },
        {
          key: 'content',
          localizedValue: {
            en: '<p>Every donation, no matter the size, helps us continue our spiritual services, maintain the ashram, and support those in need. Your generosity enables us to spread divine wisdom and serve humanity.</p>',
            hi: '<p>हर दान, चाहे वह कितना भी हो, हमें अपनी आध्यात्मिक सेवाओं को जारी रखने, आश्रम का रखरखाव करने और जरूरतमंदों की सहायता करने में मदद करता है।</p>',
          },
        },
        { key: 'alignment', value: 'center' },
      ],
    },
    {
      componentType: 'text_block',
      name: { en: 'Ways to Contribute', hi: 'योगदान के तरीके' },
      description: { en: 'Contribution purposes', hi: 'योगदान उद्देश्य' },
      displayOrder: 1,
      isVisible: true,
      fields: [
        { key: 'title', localizedValue: { en: 'Ways to Contribute', hi: 'योगदान के तरीके' } },
        {
          key: 'content',
          localizedValue: {
            en: '<p>🏠 <strong>Ashram Maintenance</strong> — Help maintain our sacred spaces.</p><p>🍲 <strong>Anna Daan (Food)</strong> — Provide meals to devotees and visitors.</p><p>📚 <strong>Vidya Daan (Education)</strong> — Support spiritual education programs.</p><p>🙏 <strong>General Seva</strong> — Support all ashram activities.</p>',
            hi: '<p>🏠 <strong>आश्रम रखरखाव</strong> — हमारे पवित्र स्थानों के रखरखाव में मदद करें।</p><p>🍲 <strong>अन्न दान</strong> — भक्तों और आगंतुकों को भोजन प्रदान करें।</p><p>📚 <strong>विद्या दान</strong> — आध्यात्मिक शिक्षा कार्यक्रमों का समर्थन करें।</p><p>🙏 <strong>सामान्य सेवा</strong> — सभी आश्रम गतिविधियों का समर्थन करें।</p>',
          },
        },
        { key: 'alignment', value: 'left' },
      ],
    },
    {
      componentType: 'text_block',
      name: { en: 'Bank Details', hi: 'बैंक विवरण' },
      description: { en: 'Bank transfer info', hi: 'बैंक ट्रांसफर जानकारी' },
      displayOrder: 2,
      isVisible: true,
      fields: [
        { key: 'title', localizedValue: { en: 'Bank Transfer Details', hi: 'बैंक ट्रांसफर विवरण' } },
        {
          key: 'content',
          localizedValue: {
            en: '<p><strong>Account Name:</strong> Swami Rupeshwaranand Ji Ashram Trust</p><p><strong>Account Number:</strong> XXXXXXXXXXXXXXXX</p><p><strong>IFSC Code:</strong> XXXXXXXXX</p><p><strong>Bank Name:</strong> Bank Name</p><p><em>All donations are tax-deductible under Section 80G of the Income Tax Act.</em></p>',
            hi: '<p><strong>खाते का नाम:</strong> Swami Rupeshwaranand Ji Ashram Trust</p><p><strong>खाता संख्या:</strong> XXXXXXXXXXXXXXXX</p><p><strong>IFSC कोड:</strong> XXXXXXXXX</p><p><strong>बैंक का नाम:</strong> Bank Name</p><p><em>सभी दान आयकर अधिनियम की धारा 80G के तहत कर कटौती योग्य हैं।</em></p>',
          },
        },
        { key: 'alignment', value: 'left' },
      ],
    },
  ],

  events: [
    {
      componentType: 'text_block',
      name: { en: 'Events Page Header', hi: 'कार्यक्रम पृष्ठ शीर्षक' },
      description: { en: 'Events page header text', hi: 'कार्यक्रम पृष्ठ शीर्षक पाठ' },
      displayOrder: 0,
      isVisible: true,
      fields: [
        { key: 'title', localizedValue: { en: 'Our Spiritual Gatherings', hi: 'हमारी आध्यात्मिक सभाएं' } },
        {
          key: 'content',
          localizedValue: {
            en: '<p>Join us for spiritual gatherings, celebrations, and sacred ceremonies throughout the year. Each event is an opportunity to deepen your connection with the divine.</p>',
            hi: '<p>पूरे वर्ष आध्यात्मिक सभाओं, उत्सवों और पवित्र समारोहों में हमसे जुड़ें। प्रत्येक कार्यक्रम परमात्मा के साथ अपने संबंध को गहरा करने का एक अवसर है।</p>',
          },
        },
        { key: 'alignment', value: 'center' },
      ],
    },
  ],

  services: [
    {
      componentType: 'text_block',
      name: { en: 'Services Page Header', hi: 'सेवाएं पृष्ठ शीर्षक' },
      description: { en: 'Services page header text', hi: 'सेवाएं पृष्ठ शीर्षक पाठ' },
      displayOrder: 0,
      isVisible: true,
      fields: [
        { key: 'title', localizedValue: { en: 'Our Spiritual Services', hi: 'हमारी आध्यात्मिक सेवाएं' } },
        {
          key: 'content',
          localizedValue: {
            en: '<p>We offer a variety of spiritual services to support your journey towards inner peace and divine connection.</p>',
            hi: '<p>हम आंतरिक शांति और दिव्य संबंध की ओर आपकी यात्रा का समर्थन करने के लिए विभिन्न आध्यात्मिक सेवाएं प्रदान करते हैं।</p>',
          },
        },
        { key: 'alignment', value: 'center' },
      ],
    },
  ],

  'teaching-inner-peace': [
    {
      componentType: 'text_block',
      name: { en: 'Inner Peace Content', hi: 'आंतरिक शांति सामग्री' },
      description: { en: 'Full teaching article on inner peace', hi: 'आंतरिक शांति पर पूर्ण शिक्षण लेख' },
      displayOrder: 0,
      isVisible: true,
      fields: [
        { key: 'title', localizedValue: { en: 'Path to Inner Peace', hi: 'आंतरिक शांति का मार्ग' } },
        {
          key: 'content',
          localizedValue: {
            en: '<p>In the hustle of modern life, finding inner peace seems like a distant dream. Swami Ji teaches that peace is not something external to be found, but an internal state to be uncovered.</p><p>Through daily meditation practice, mindful breathing, and conscious living, we can peel away the layers of stress and anxiety that cloud our natural state of serenity.</p><p>The path to inner peace begins with understanding that true happiness comes from within.</p><p>Swami Ji recommends starting with just 10 minutes of silent meditation each morning.</p>',
            hi: '<p>आधुनिक जीवन की भागदौड़ में, आंतरिक शांति पाना एक दूर का सपना लगता है।</p><p>दैनिक ध्यान अभ्यास, सचेत श्वास और जागरूक जीवन के माध्यम से, हम तनाव और चिंता की उन परतों को हटा सकते हैं।</p><p>स्वामी जी हर सुबह केवल 10 मिनट के मौन ध्यान से शुरू करने की सलाह देते हैं।</p>',
          },
        },
        { key: 'alignment', value: 'left' },
      ],
    },
  ],

  'teaching-mantras': [
    {
      componentType: 'text_block',
      name: { en: 'Mantras Content', hi: 'मंत्र सामग्री' },
      description: { en: 'Full teaching article on mantras', hi: 'मंत्रों पर पूर्ण शिक्षण लेख' },
      displayOrder: 0,
      isVisible: true,
      fields: [
        { key: 'title', localizedValue: { en: 'Power of Mantras', hi: 'मंत्रों की शक्ति' } },
        {
          key: 'content',
          localizedValue: {
            en: '<p>Mantras are not mere words but powerful vibrations that have been passed down through millennia.</p><p>Swami Ji guides seekers in the authentic practice of mantra sadhana.</p><p>The most powerful aspect of mantra practice is consistency. A mantra chanted 108 times daily for 40 days creates a deep imprint in your consciousness.</p><p>Start with the universal mantra "Om" - the primordial sound of creation.</p>',
            hi: '<p>मंत्र केवल शब्द नहीं हैं बल्कि शक्तिशाली कंपन हैं।</p><p>स्वामी जी साधकों को मंत्र साधना के प्रामाणिक अभ्यास में मार्गदर्शन करते हैं।</p><p>मंत्र अभ्यास का सबसे शक्तिशाली पहलू निरंतरता है।</p><p>सार्वभौमिक मंत्र "ॐ" से शुरू करें।</p>',
          },
        },
        { key: 'alignment', value: 'left' },
      ],
    },
  ],

  'teaching-seva': [
    {
      componentType: 'text_block',
      name: { en: 'Seva Content', hi: 'सेवा सामग्री' },
      description: { en: 'Full teaching article on seva', hi: 'सेवा पर पूर्ण शिक्षण लेख' },
      displayOrder: 0,
      isVisible: true,
      fields: [
        { key: 'title', localizedValue: { en: 'Service to Humanity', hi: 'मानवता की सेवा' } },
        {
          key: 'content',
          localizedValue: {
            en: '<p>Seva, or selfless service, is the purest expression of spiritual love.</p><p>The ashram provides numerous opportunities for seva, from feeding the hungry to teaching the young.</p><p>Through seva, we learn humility, compassion, and the joy of giving.</p><p>Find opportunities in your daily life to practice seva.</p>',
            hi: '<p>सेवा, या निःस्वार्थ सेवा, आध्यात्मिक प्रेम की शुद्धतम अभिव्यक्ति है।</p><p>आश्रम सेवा के कई अवसर प्रदान करता है।</p><p>सेवा के माध्यम से, हम विनम्रता, करुणा और देने का आनंद सीखते हैं।</p>',
          },
        },
        { key: 'alignment', value: 'left' },
      ],
    },
  ],

  'teaching-dharma': [
    {
      componentType: 'text_block',
      name: { en: 'Dharma Content', hi: 'धर्म सामग्री' },
      description: { en: 'Full teaching article on dharma', hi: 'धर्म पर पूर्ण शिक्षण लेख' },
      displayOrder: 0,
      isVisible: true,
      fields: [
        { key: 'title', localizedValue: { en: 'Living with Purpose', hi: 'उद्देश्य के साथ जीना' } },
        {
          key: 'content',
          localizedValue: {
            en: '<p>Dharma is your unique path, the sacred duty that gives meaning to your existence.</p><p>When we live in accordance with our dharma, every moment becomes meaningful, every action becomes worship.</p><p>To discover your dharma, ask yourself: What activities make you lose track of time?</p><p>Your dharma may evolve as you grow spiritually. Stay open, stay humble.</p>',
            hi: '<p>धर्म आपका अनूठा मार्ग है, वह पवित्र कर्तव्य जो आपके अस्तित्व को अर्थ देता है।</p><p>जब हम अपने धर्म के अनुसार जीते हैं, तो हर पल सार्थक हो जाता है।</p><p>अपने धर्म को खोजने के लिए, अपने आप से पूछें।</p>',
          },
        },
        { key: 'alignment', value: 'left' },
      ],
    },
  ],
};

// ============================================
// Page definitions for pages that may not exist yet
// ============================================
const NEW_PAGES: Record<string, {
  title: { en: string; hi: string };
  description: { en: string; hi: string };
  path: string;
  displayOrder: number;
}> = {
  'teaching-inner-peace': {
    title: { en: 'Path to Inner Peace', hi: 'आंतरिक शांति का मार्ग' },
    description: { en: 'Ancient techniques for finding tranquility', hi: 'शांति पाने की प्राचीन तकनीकें' },
    path: '/teachings/inner-peace',
    displayOrder: 11,
  },
  'teaching-mantras': {
    title: { en: 'Power of Mantras', hi: 'मंत्रों की शक्ति' },
    description: { en: 'Sacred sounds and vibrations', hi: 'पवित्र ध्वनियां और कंपन' },
    path: '/teachings/mantras',
    displayOrder: 12,
  },
  'teaching-seva': {
    title: { en: 'Service to Humanity', hi: 'मानवता की सेवा' },
    description: { en: 'Selfless service as spiritual practice', hi: 'निःस्वार्थ सेवा आध्यात्मिक अभ्यास के रूप में' },
    path: '/teachings/seva',
    displayOrder: 13,
  },
  'teaching-dharma': {
    title: { en: 'Living with Purpose', hi: 'उद्देश्य के साथ जीना' },
    description: { en: 'Find your dharma and higher purpose', hi: 'अपने धर्म और उच्च उद्देश्य को खोजें' },
    path: '/teachings/dharma',
    displayOrder: 14,
  },
};

// ============================================
// Helper functions
// ============================================

async function findPageBySlug(slug: string): Promise<{ id: string; componentIds?: string[] } | null> {
  // Scan for CMS_PAGE with matching slug
  const result = await docClient.send(
    new ScanCommand({
      TableName: tableName,
      FilterExpression: 'begins_with(PK, :pk) AND slug = :slug',
      ExpressionAttributeValues: {
        ':pk': 'CMS_PAGE#',
        ':slug': slug,
      },
    }),
  );

  if (result.Items && result.Items.length > 0) {
    return { id: result.Items[0].id, componentIds: result.Items[0].componentIds };
  }
  return null;
}

async function checkExistingTextBlocks(pageId: string): Promise<boolean> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: tableName,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :gsi1pk',
      ExpressionAttributeValues: {
        ':gsi1pk': `PAGE#${pageId}`,
      },
    }),
  );

  const textBlocks = result.Items?.filter((item) => item.componentType === 'text_block') || [];
  return textBlocks.length > 0;
}

async function createPage(slug: string): Promise<string> {
  const pageInfo = NEW_PAGES[slug];
  if (!pageInfo) {
    throw new Error(`No page definition found for slug: ${slug}`);
  }

  const pageId = uuidv4();
  const now = new Date().toISOString();

  await docClient.send(
    new PutCommand({
      TableName: tableName,
      Item: {
        PK: `CMS_PAGE#${pageId}`,
        SK: `CMS_PAGE#${pageId}`,
        GSI1PK: 'CMS_PAGE',
        GSI1SK: `ORDER#${String(pageInfo.displayOrder).padStart(3, '0')}#${slug}`,
        id: pageId,
        slug,
        title: pageInfo.title,
        description: pageInfo.description,
        path: pageInfo.path,
        status: 'published',
        displayOrder: pageInfo.displayOrder,
        componentIds: [],
        createdAt: now,
        updatedAt: now,
      },
    }),
  );

  console.log(`  📄 Created page: ${slug} (${pageId})`);
  return pageId;
}

// ============================================
// Main migration function
// ============================================

async function seedAllTextBlocks() {
  console.log('🌱 Seeding text_block components for all pages...\n');
  console.log(`📍 Environment: ${isLocal ? 'LOCAL' : 'PRODUCTION'}`);
  console.log(`📊 Table: ${tableName}\n`);

  let totalCreated = 0;
  let totalSkipped = 0;

  for (const [slug, components] of Object.entries(PAGE_COMPONENTS)) {
    console.log(`\n--- Processing: ${slug} ---`);

    // Find existing page or create it
    let page = await findPageBySlug(slug);

    if (!page) {
      if (NEW_PAGES[slug]) {
        // It's a teaching article page that may not exist yet
        const pageId = await createPage(slug);
        page = { id: pageId, componentIds: [] };
      } else {
        console.log(`  ⚠️  Page "${slug}" not found. Run the main seed script first.`);
        totalSkipped++;
        continue;
      }
    }

    // Check if text_blocks already exist
    const hasTextBlocks = await checkExistingTextBlocks(page.id);
    if (hasTextBlocks) {
      console.log(`  ⏭️  Text blocks already exist for "${slug}". Skipping.`);
      totalSkipped++;
      continue;
    }

    // Create text_block components
    const componentIds: string[] = [];

    for (const comp of components) {
      const componentId = uuidv4();
      const now = new Date().toISOString();

      try {
        await docClient.send(
          new PutCommand({
            TableName: tableName,
            Item: {
              PK: `CMS_COMPONENT#${componentId}`,
              SK: `CMS_COMPONENT#${componentId}`,
              GSI1PK: `PAGE#${page.id}`,
              GSI1SK: `ORDER#${String(comp.displayOrder).padStart(3, '0')}#${comp.componentType}`,
              id: componentId,
              pageId: page.id,
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

    // Update page componentIds (append to existing)
    if (componentIds.length > 0) {
      try {
        const existingComponentIds = page.componentIds || [];
        const allComponentIds = [...existingComponentIds, ...componentIds];

        await docClient.send(
          new UpdateCommand({
            TableName: tableName,
            Key: {
              PK: `CMS_PAGE#${page.id}`,
              SK: `CMS_PAGE#${page.id}`,
            },
            UpdateExpression: 'SET componentIds = :componentIds, updatedAt = :updatedAt',
            ExpressionAttributeValues: {
              ':componentIds': allComponentIds,
              ':updatedAt': new Date().toISOString(),
            },
          }),
        );
        console.log(`  📝 Updated "${slug}" page with ${componentIds.length} text_block components`);
        totalCreated++;
      } catch (error) {
        console.error(`  ❌ Failed to update "${slug}" page componentIds:`, error);
      }
    }
  }

  console.log(`\n✨ Migration completed! Created for ${totalCreated} pages, skipped ${totalSkipped} pages.`);
}

seedAllTextBlocks().catch(console.error);
