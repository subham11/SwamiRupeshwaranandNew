/**
 * Seed script to create initial pages and components
 * Run with: npm run seed:pages
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const isLocal = process.env.IS_LOCAL === 'true';
const tableName = process.env.DYNAMODB_TABLE || 'swami-rupeshwaranand-api-dev-main';

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
  {
    slug: 'ashram',
    title: { en: 'About the Ashram', hi: 'आश्रम के बारे में' },
    description: { en: 'A sanctuary of peace and spirituality', hi: 'शांति और आध्यात्मिकता का अभयारण्य' },
    path: '/ashram',
    displayOrder: 6,
    status: 'published',
  },
  {
    slug: 'gurukul',
    title: { en: 'One District One Gurukul', hi: 'एक जिला एक गुरुकुल' },
    description: { en: 'Reviving ancient wisdom through modern education', hi: 'आधुनिक शिक्षा के माध्यम से प्राचीन ज्ञान का पुनरुद्धार' },
    path: '/gurukul',
    displayOrder: 7,
    status: 'published',
  },
  {
    slug: 'teachings',
    title: { en: 'Sacred Teachings', hi: 'पवित्र शिक्षाएं' },
    description: { en: 'Spiritual wisdom and guidance', hi: 'आध्यात्मिक ज्ञान और मार्गदर्शन' },
    path: '/teachings',
    displayOrder: 8,
    status: 'published',
  },
  {
    slug: 'donation',
    title: { en: 'Donation', hi: 'दान' },
    description: { en: 'Support our mission', hi: 'हमारे मिशन का समर्थन करें' },
    path: '/donation',
    displayOrder: 9,
    status: 'published',
  },
  {
    slug: 'services',
    title: { en: 'Our Services', hi: 'हमारी सेवाएं' },
    description: { en: 'Spiritual offerings for your journey', hi: 'आपकी आध्यात्मिक यात्रा के लिए सेवाएं' },
    path: '/services',
    displayOrder: 10,
    status: 'published',
  },
  {
    slug: 'teaching-inner-peace',
    title: { en: 'Path to Inner Peace', hi: 'आंतरिक शांति का मार्ग' },
    description: { en: 'Ancient techniques for finding tranquility', hi: 'शांति पाने की प्राचीन तकनीकें' },
    path: '/teachings/inner-peace',
    displayOrder: 11,
    status: 'published',
  },
  {
    slug: 'teaching-mantras',
    title: { en: 'Power of Mantras', hi: 'मंत्रों की शक्ति' },
    description: { en: 'Sacred sounds and vibrations', hi: 'पवित्र ध्वनियां और कंपन' },
    path: '/teachings/mantras',
    displayOrder: 12,
    status: 'published',
  },
  {
    slug: 'teaching-seva',
    title: { en: 'Service to Humanity', hi: 'मानवता की सेवा' },
    description: { en: 'Selfless service as spiritual practice', hi: 'निःस्वार्थ सेवा आध्यात्मिक अभ्यास के रूप में' },
    path: '/teachings/seva',
    displayOrder: 13,
    status: 'published',
  },
  {
    slug: 'teaching-dharma',
    title: { en: 'Living with Purpose', hi: 'उद्देश्य के साथ जीना' },
    description: { en: 'Find your dharma and higher purpose', hi: 'अपने धर्म और उच्च उद्देश्य को खोजें' },
    path: '/teachings/dharma',
    displayOrder: 14,
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

// ============================================
// Initial Components for Swamiji Page
// ============================================
const SWAMIJI_PAGE_COMPONENTS = [
  {
    componentType: 'text_block',
    name: { en: 'Early Life & Calling', hi: 'प्रारंभिक जीवन और आह्वान' },
    description: { en: 'About Swamiji - Early Life section', hi: 'स्वामीजी के बारे में - प्रारंभिक जीवन अनुभाग' },
    displayOrder: 0,
    isVisible: true,
    fields: [
      { key: 'title', localizedValue: { en: 'Early Life & Calling', hi: 'प्रारंभिक जीवन और आह्वान' } },
      { key: 'content', localizedValue: {
          en: '<p>From an early age, Swami Rupeshwaranand Ji showed an extraordinary inclination towards spirituality and the quest for truth. His journey began in the sacred lands of India, where he spent years in deep meditation and study under the guidance of enlightened masters.</p>',
          hi: '<p>बचपन से ही, स्वामी रूपेश्वरानंद जी ने आध्यात्मिकता और सत्य की खोज के प्रति असाधारण झुकाव दिखाया। उनकी यात्रा भारत की पवित्र भूमि में शुरू हुई, जहां उन्होंने प्रबुद्ध गुरुओं के मार्गदर्शन में गहन ध्यान और अध्ययन में वर्षों बिताए।</p>',
      } },
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
      { key: 'title', localizedValue: { en: 'Teachings & Philosophy', hi: 'शिक्षाएं और दर्शन' } },
      { key: 'content', localizedValue: {
          en: '<p>Swami Ji\'s teachings blend ancient Vedic wisdom with practical guidance for modern life. He emphasizes the importance of self-realization, selfless service (seva), and the cultivation of inner peace through meditation and devotion.</p>',
          hi: '<p>स्वामी जी की शिक्षाएं प्राचीन वैदिक ज्ञान को आधुनिक जीवन के लिए व्यावहारिक मार्गदर्शन के साथ मिलाती हैं। वे आत्म-साक्षात्कार, निःस्वार्थ सेवा (सेवा), और ध्यान और भक्ति के माध्यम से आंतरिक शांति की खेती के महत्व पर जोर देते हैं।</p>',
      } },
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
      { key: 'title', localizedValue: { en: 'Mission & Vision', hi: 'मिशन और दृष्टि' } },
      { key: 'content', localizedValue: {
          en: '<p>His mission is to help seekers from all walks of life discover their true spiritual nature and live a life of purpose, peace, and fulfillment. Through the ashram, he provides a sanctuary for spiritual growth and community service.</p>',
          hi: '<p>उनका मिशन सभी क्षेत्रों के साधकों को उनके सच्चे आध्यात्मिक स्वभाव की खोज करने और उद्देश्य, शांति और पूर्णता का जीवन जीने में मदद करना है। आश्रम के माध्यम से, वे आध्यात्मिक विकास और सामुदायिक सेवा के लिए एक अभयारण्य प्रदान करते हैं।</p>',
      } },
      { key: 'alignment', value: 'left' },
    ],
  },
];

// ============================================
// Contact Page Components
// ============================================
const CONTACT_PAGE_COMPONENTS = [
  {
    componentType: 'text_block',
    name: { en: 'Contact Information', hi: 'संपर्क जानकारी' },
    description: { en: 'Contact details', hi: 'संपर्क विवरण' },
    displayOrder: 0,
    isVisible: true,
    fields: [
      { key: 'title', localizedValue: { en: 'Get in Touch', hi: 'संपर्क में रहें' } },
      { key: 'content', localizedValue: {
          en: '<p><strong>📍 Address:</strong> Swami Rupeshwaranand Ji Ashram, Village Name, District, State, India</p><p><strong>📞 Phone:</strong> +91 XXXXXXXXXX</p><p><strong>✉️ Email:</strong> info@swamirupeshwaranand.in</p><p><strong>🕐 Visiting Hours:</strong> Daily: 6:00 AM - 8:00 PM</p>',
          hi: '<p><strong>📍 पता:</strong> स्वामी रूपेश्वरानंद जी आश्रम, गाँव का नाम, जिला, राज्य, भारत</p><p><strong>📞 फोन:</strong> +91 XXXXXXXXXX</p><p><strong>✉️ ईमेल:</strong> info@swamirupeshwaranand.in</p><p><strong>🕐 दर्शन का समय:</strong> प्रतिदिन: सुबह 6:00 - रात 8:00</p>',
      } },
      { key: 'alignment', value: 'left' },
    ],
  },
];

// ============================================
// Ashram Page Components
// ============================================
const ASHRAM_PAGE_COMPONENTS = [
  {
    componentType: 'text_block',
    name: { en: 'Ashram Description', hi: 'आश्रम विवरण' },
    description: { en: 'About the Ashram', hi: 'आश्रम के बारे में' },
    displayOrder: 0,
    isVisible: true,
    fields: [
      { key: 'title', localizedValue: { en: 'Welcome to the Ashram', hi: 'आश्रम में आपका स्वागत है' } },
      { key: 'content', localizedValue: {
          en: '<p>Nestled in the serene landscapes of India, our ashram serves as a sacred space for seekers from all walks of life. Here, ancient wisdom meets modern understanding, creating an environment conducive to spiritual growth, meditation, and self-discovery.</p>',
          hi: '<p>भारत के शांत परिदृश्यों में बसा, हमारा आश्रम सभी क्षेत्रों के साधकों के लिए एक पवित्र स्थान के रूप में कार्य करता है। यहां, प्राचीन ज्ञान आधुनिक समझ से मिलता है, जो आध्यात्मिक विकास, ध्यान और आत्म-खोज के लिए अनुकूल वातावरण बनाता है।</p>',
      } },
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
      { key: 'content', localizedValue: {
          en: '<h3>🧘 Meditation Halls</h3><p>Peaceful spaces designed for deep meditation and contemplation.</p><h3>🏠 Guest Accommodation</h3><p>Simple, clean rooms for visitors seeking spiritual retreat.</p><h3>🌳 Sacred Gardens</h3><p>Beautiful gardens for walking meditation and reflection.</p><h3>🍲 Sattvic Kitchen</h3><p>Pure vegetarian meals prepared with love and devotion.</p>',
          hi: '<h3>🧘 ध्यान कक्ष</h3><p>गहन ध्यान और चिंतन के लिए डिज़ाइन किए गए शांतिपूर्ण स्थान।</p><h3>🏠 अतिथि आवास</h3><p>आध्यात्मिक विश्राम चाहने वाले आगंतुकों के लिए सादे, स्वच्छ कमरे।</p><h3>🌳 पवित्र उद्यान</h3><p>चलते हुए ध्यान और चिंतन के लिए सुंदर उद्यान।</p><h3>🍲 सात्विक रसोई</h3><p>प्रेम और भक्ति से तैयार शुद्ध शाकाहारी भोजन।</p>',
      } },
      { key: 'alignment', value: 'left' },
    ],
  },
];

// ============================================
// Gurukul Page Components
// ============================================
const GURUKUL_PAGE_COMPONENTS = [
  {
    componentType: 'text_block',
    name: { en: 'Gurukul Introduction', hi: 'गुरुकुल परिचय' },
    description: { en: 'Gurukul initiative description', hi: 'गुरुकुल पहल विवरण' },
    displayOrder: 0,
    isVisible: true,
    fields: [
      { key: 'title', localizedValue: { en: 'One District One Gurukul', hi: 'एक जिला एक गुरुकुल' } },
      { key: 'content', localizedValue: {
          en: '<p>A visionary initiative to establish Gurukuls across every district, blending traditional Vedic education with contemporary learning to nurture spiritually grounded, morally upright, and intellectually capable citizens.</p><blockquote>"Education is the manifestation of the perfection already in man." — Swami Vivekananda</blockquote>',
          hi: '<p>हर जिले में गुरुकुल स्थापित करने की एक दूरदर्शी पहल, पारंपरिक वैदिक शिक्षा को समकालीन शिक्षा के साथ मिलाकर आध्यात्मिक रूप से स्थापित, नैतिक रूप से सही और बौद्धिक रूप से सक्षम नागरिकों का पोषण करना।</p><blockquote>"शिक्षा मनुष्य में पहले से मौजूद पूर्णता की अभिव्यक्ति है।" — स्वामी विवेकानंद</blockquote>',
      } },
      { key: 'alignment', value: 'center' },
    ],
  },
  {
    componentType: 'text_block',
    name: { en: 'Gurukul Vision', hi: 'गुरुकुल दृष्टि' },
    description: { en: 'Vision pillars', hi: 'दृष्टि स्तंभ' },
    displayOrder: 1,
    isVisible: true,
    fields: [
      { key: 'title', localizedValue: { en: 'Our Vision', hi: 'हमारी दृष्टि' } },
      { key: 'content', localizedValue: {
          en: '<h3>🕉️ Vedic Foundation</h3><p>Rooted in the timeless wisdom of the Vedas, Upanishads, and ancient scriptures, providing students with a strong spiritual foundation.</p><h3>📚 Holistic Curriculum</h3><p>Integration of Sanskrit, Yoga, Meditation, Arts, and modern subjects like Science, Mathematics, and Technology.</p><h3>🌱 Character Building</h3><p>Emphasis on moral values, discipline, respect for elders, and service to society as core principles of education.</p><h3>🏛️ Gurukul Environment</h3><p>Residential learning in a serene, natural environment where students live with teachers and learn through direct experience.</p>',
          hi: '<h3>🕉️ वैदिक आधार</h3><p>वेदों, उपनिषदों और प्राचीन शास्त्रों के शाश्वत ज्ञान में निहित, छात्रों को एक मजबूत आध्यात्मिक आधार प्रदान करना।</p><h3>📚 समग्र पाठ्यक्रम</h3><p>संस्कृत, योग, ध्यान, कला और विज्ञान, गणित और प्रौद्योगिकी जैसे आधुनिक विषयों का एकीकरण।</p><h3>🌱 चरित्र निर्माण</h3><p>नैतिक मूल्यों, अनुशासन, बड़ों के प्रति सम्मान और समाज की सेवा पर शिक्षा के मूल सिद्धांतों के रूप में जोर।</p><h3>🏛️ गुरुकुल वातावरण</h3><p>शांत, प्राकृतिक वातावरण में आवासीय शिक्षा जहां छात्र शिक्षकों के साथ रहते हैं और प्रत्यक्ष अनुभव के माध्यम से सीखते हैं।</p>',
      } },
      { key: 'alignment', value: 'left' },
    ],
  },
  {
    componentType: 'text_block',
    name: { en: 'Key Objectives', hi: 'मुख्य उद्देश्य' },
    description: { en: 'Gurukul key objectives', hi: 'गुरुकुल के मुख्य उद्देश्य' },
    displayOrder: 2,
    isVisible: true,
    fields: [
      { key: 'title', localizedValue: { en: 'Key Objectives', hi: 'मुख्य उद्देश्य' } },
      { key: 'content', localizedValue: {
          en: '<h3>01 — Preserve Cultural Heritage</h3><p>Safeguard and transmit India\'s rich spiritual and cultural heritage to future generations through systematic education.</p><h3>02 — Bridge Ancient & Modern</h3><p>Create a harmonious blend of traditional Gurukul system with contemporary educational requirements and career opportunities.</p><h3>03 — Rural Empowerment</h3><p>Bring quality spiritual education to rural areas, ensuring every child has access to transformative learning regardless of location.</p><h3>04 — Self-Reliant Citizens</h3><p>Develop self-reliant individuals who can contribute positively to society while maintaining spiritual grounding and ethical values.</p>',
          hi: '<h3>01 — सांस्कृतिक विरासत को संरक्षित करें</h3><p>व्यवस्थित शिक्षा के माध्यम से भारत की समृद्ध आध्यात्मिक और सांस्कृतिक विरासत को भावी पीढ़ियों तक सुरक्षित और संचारित करें।</p><h3>02 — प्राचीन और आधुनिक का सेतु</h3><p>पारंपरिक गुरुकुल प्रणाली को समकालीन शैक्षिक आवश्यकताओं और करियर के अवसरों के साथ सामंजस्यपूर्ण मिश्रण बनाएं।</p><h3>03 — ग्रामीण सशक्तिकरण</h3><p>ग्रामीण क्षेत्रों में गुणवत्तापूर्ण आध्यात्मिक शिक्षा लाएं।</p><h3>04 — आत्मनिर्भर नागरिक</h3><p>आत्मनिर्भर व्यक्तियों का विकास करें जो आध्यात्मिक आधार और नैतिक मूल्यों को बनाए रखते हुए समाज में सकारात्मक योगदान दे सकें।</p>',
      } },
      { key: 'alignment', value: 'left' },
    ],
  },
  {
    componentType: 'text_block',
    name: { en: 'Gurukul Curriculum', hi: 'गुरुकुल पाठ्यक्रम' },
    description: { en: 'Subjects taught', hi: 'पढ़ाए जाने वाले विषय' },
    displayOrder: 3,
    isVisible: true,
    fields: [
      { key: 'title', localizedValue: { en: 'Gurukul Curriculum', hi: 'गुरुकुल पाठ्यक्रम' } },
      { key: 'content', localizedValue: {
          en: '<ul><li>📜 Sanskrit & Vedic Studies</li><li>🧘 Yoga & Meditation</li><li>🌿 Ayurveda Basics</li><li>🔬 Mathematics & Science</li><li>🎨 Arts & Music</li><li>🌾 Agriculture & Environment</li><li>💡 Life Skills</li><li>💻 Computer & Technology</li></ul>',
          hi: '<ul><li>📜 संस्कृत और वैदिक अध्ययन</li><li>🧘 योग और ध्यान</li><li>🌿 आयुर्वेद की मूल बातें</li><li>🔬 गणित और विज्ञान</li><li>🎨 कला और संगीत</li><li>🌾 कृषि और पर्यावरण</li><li>💡 जीवन कौशल</li><li>💻 कंप्यूटर और प्रौद्योगिकी</li></ul>',
      } },
      { key: 'alignment', value: 'left' },
    ],
  },
];

// ============================================
// Teachings Page Components
// ============================================
const TEACHINGS_PAGE_COMPONENTS = [
  {
    componentType: 'text_block',
    name: { en: 'Teachings Introduction', hi: 'शिक्षाएं परिचय' },
    description: { en: 'Sacred Teachings intro', hi: 'पवित्र शिक्षाएं परिचय' },
    displayOrder: 0,
    isVisible: true,
    fields: [
      { key: 'title', localizedValue: { en: 'Sacred Teachings', hi: 'पवित्र शिक्षाएं' } },
      { key: 'content', localizedValue: {
          en: '<p>Explore the timeless teachings that guide us on the path of spiritual awakening. From meditation and mantras to selfless service and living with purpose, discover the wisdom that transforms lives.</p><blockquote>"The real voyage of discovery consists not in seeking new landscapes, but in having new eyes." — Ancient Wisdom</blockquote>',
          hi: '<p>आध्यात्मिक जागृति के मार्ग पर हमें मार्गदर्शन करने वाली शाश्वत शिक्षाओं का अन्वेषण करें। ध्यान और मंत्रों से लेकर निःस्वार्थ सेवा और उद्देश्यपूर्ण जीवन तक, उस ज्ञान की खोज करें जो जीवन को बदल देता है।</p><blockquote>"खोज की वास्तविक यात्रा नए परिदृश्यों की खोज में नहीं, बल्कि नई दृष्टि रखने में है।" — प्राचीन ज्ञान</blockquote>',
      } },
      { key: 'alignment', value: 'center' },
    ],
  },
  {
    componentType: 'text_block', name: { en: 'The Art of Inner Peace', hi: 'आंतरिक शांति की कला' },
    description: { en: 'Teaching: Inner Peace', hi: 'शिक्षा: आंतरिक शांति' }, displayOrder: 1, isVisible: true,
    fields: [
      { key: 'title', localizedValue: { en: '🧘 The Art of Inner Peace', hi: '🧘 आंतरिक शांति की कला' } },
      { key: 'content', localizedValue: { en: '<p>Discover the timeless practices of meditation and mindfulness that lead to lasting inner tranquility.</p>', hi: '<p>ध्यान और माइंडफुलनेस की शाश्वत प्रथाओं की खोज करें जो स्थायी आंतरिक शांति की ओर ले जाती हैं।</p>' } },
      { key: 'alignment', value: 'left' },
    ],
  },
  {
    componentType: 'text_block', name: { en: 'Sacred Mantras', hi: 'पवित्र मंत्र' },
    description: { en: 'Teaching: Mantras', hi: 'शिक्षा: मंत्र' }, displayOrder: 2, isVisible: true,
    fields: [
      { key: 'title', localizedValue: { en: '🙏 Sacred Mantras', hi: '🙏 पवित्र मंत्र' } },
      { key: 'content', localizedValue: { en: '<p>Learn the power of sacred sounds and vibrations that connect us to the divine consciousness.</p>', hi: '<p>पवित्र ध्वनियों और कंपनों की शक्ति सीखें जो हमें दिव्य चेतना से जोड़ती हैं।</p>' } },
      { key: 'alignment', value: 'left' },
    ],
  },
  {
    componentType: 'text_block', name: { en: 'The Path of Seva', hi: 'सेवा का मार्ग' },
    description: { en: 'Teaching: Seva', hi: 'शिक्षा: सेवा' }, displayOrder: 3, isVisible: true,
    fields: [
      { key: 'title', localizedValue: { en: '💝 The Path of Seva', hi: '💝 सेवा का मार्ग' } },
      { key: 'content', localizedValue: { en: '<p>Understanding selfless service as a spiritual practice that purifies the heart and elevates the soul.</p>', hi: '<p>निःस्वार्थ सेवा को एक आध्यात्मिक अभ्यास के रूप में समझना जो हृदय को शुद्ध करता है और आत्मा को ऊंचा उठाता है।</p>' } },
      { key: 'alignment', value: 'left' },
    ],
  },
  {
    componentType: 'text_block', name: { en: 'Living with Purpose', hi: 'उद्देश्य के साथ जीना' },
    description: { en: 'Teaching: Dharma', hi: 'शिक्षा: धर्म' }, displayOrder: 4, isVisible: true,
    fields: [
      { key: 'title', localizedValue: { en: '☸️ Living with Purpose', hi: '☸️ उद्देश्य के साथ जीना' } },
      { key: 'content', localizedValue: { en: '<p>Find your dharma and learn to align your daily actions with your higher spiritual purpose.</p>', hi: '<p>अपने धर्म को खोजें और अपनी दैनिक क्रियाओं को अपने उच्च आध्यात्मिक उद्देश्य के साथ संरेखित करना सीखें।</p>' } },
      { key: 'alignment', value: 'left' },
    ],
  },
  {
    componentType: 'text_block', name: { en: 'Classical Yoga', hi: 'शास्त्रीय योग' },
    description: { en: 'Teaching: Yoga', hi: 'शिक्षा: योग' }, displayOrder: 5, isVisible: true,
    fields: [
      { key: 'title', localizedValue: { en: '🪷 Classical Yoga', hi: '🪷 शास्त्रीय योग' } },
      { key: 'content', localizedValue: { en: '<p>Explore the eight limbs of yoga as prescribed by Patanjali for complete spiritual transformation.</p>', hi: '<p>पतंजलि द्वारा निर्धारित योग के आठ अंगों का अन्वेषण करें जो पूर्ण आध्यात्मिक परिवर्तन के लिए हैं।</p>' } },
      { key: 'alignment', value: 'left' },
    ],
  },
  {
    componentType: 'text_block', name: { en: 'Devotion & Bhakti', hi: 'भक्ति मार्ग' },
    description: { en: 'Teaching: Bhakti', hi: 'शिक्षा: भक्ति' }, displayOrder: 6, isVisible: true,
    fields: [
      { key: 'title', localizedValue: { en: '❤️ Devotion & Bhakti', hi: '❤️ भक्ति मार्ग' } },
      { key: 'content', localizedValue: { en: '<p>The path of love and devotion to the Divine, surrendering the ego to experience unity with God.</p>', hi: '<p>परमात्मा के प्रति प्रेम और भक्ति का मार्ग, अहंकार को समर्पित करके ईश्वर के साथ एकता का अनुभव करना।</p>' } },
      { key: 'alignment', value: 'left' },
    ],
  },
];

// ============================================
// Donation Page Components
// ============================================
const DONATION_PAGE_COMPONENTS = [
  {
    componentType: 'text_block', name: { en: 'Donation Introduction', hi: 'दान परिचय' },
    description: { en: 'Donation page description', hi: 'दान पृष्ठ विवरण' }, displayOrder: 0, isVisible: true,
    fields: [
      { key: 'title', localizedValue: { en: 'Support Our Mission', hi: 'हमारे मिशन का समर्थन करें' } },
      { key: 'content', localizedValue: { en: '<p>Every donation, no matter the size, helps us continue our spiritual services, maintain the ashram, and support those in need. Your generosity enables us to spread divine wisdom and serve humanity.</p>', hi: '<p>हर दान, चाहे वह कितना भी हो, हमें अपनी आध्यात्मिक सेवाओं को जारी रखने, आश्रम का रखरखाव करने और जरूरतमंदों की सहायता करने में मदद करता है। आपकी उदारता हमें दैवी ज्ञान फैलाने और मानवता की सेवा करने में सक्षम बनाती है।</p>' } },
      { key: 'alignment', value: 'center' },
    ],
  },
  {
    componentType: 'text_block', name: { en: 'Donation Purposes', hi: 'दान के उद्देश्य' },
    description: { en: 'Ways to donate', hi: 'दान के तरीके' }, displayOrder: 1, isVisible: true,
    fields: [
      { key: 'title', localizedValue: { en: 'Ways to Contribute', hi: 'योगदान के तरीके' } },
      { key: 'content', localizedValue: { en: '<h3>🏠 Ashram Maintenance</h3><p>Help maintain our sacred spaces.</p><h3>🍲 Anna Daan (Food)</h3><p>Provide meals to devotees and visitors.</p><h3>📚 Vidya Daan (Education)</h3><p>Support spiritual education programs.</p><h3>🙏 General Seva</h3><p>Support all ashram activities.</p>', hi: '<h3>🏠 आश्रम रखरखाव</h3><p>हमारे पवित्र स्थानों के रखरखाव में मदद करें।</p><h3>🍲 अन्न दान</h3><p>भक्तों और आगंतुकों को भोजन प्रदान करें।</p><h3>📚 विद्या दान</h3><p>आध्यात्मिक शिक्षा कार्यक्रमों का समर्थन करें।</p><h3>🙏 सामान्य सेवा</h3><p>सभी आश्रम गतिविधियों का समर्थन करें।</p>' } },
      { key: 'alignment', value: 'left' },
    ],
  },
  {
    componentType: 'text_block', name: { en: 'Bank Transfer Details', hi: 'बैंक ट्रांसफर विवरण' },
    description: { en: 'Bank details', hi: 'बैंक विवरण' }, displayOrder: 2, isVisible: true,
    fields: [
      { key: 'title', localizedValue: { en: 'Bank Transfer Details', hi: 'बैंक ट्रांसफर विवरण' } },
      { key: 'content', localizedValue: { en: '<p><strong>Account Name:</strong> Swami Rupeshwaranand Ji Ashram Trust</p><p><strong>Account Number:</strong> XXXXXXXXXXXXXXXX</p><p><strong>IFSC Code:</strong> XXXXXXXXX</p><p><strong>Bank Name:</strong> Bank Name</p><p><em>All donations are tax-deductible under Section 80G of the Income Tax Act.</em></p>', hi: '<p><strong>खाते का नाम:</strong> Swami Rupeshwaranand Ji Ashram Trust</p><p><strong>खाता संख्या:</strong> XXXXXXXXXXXXXXXX</p><p><strong>IFSC कोड:</strong> XXXXXXXXX</p><p><strong>बैंक का नाम:</strong> Bank Name</p><p><em>सभी दान आयकर अधिनियम की धारा 80G के तहत कर कटौती योग्य हैं।</em></p>' } },
      { key: 'alignment', value: 'left' },
    ],
  },
];

// ============================================
// Events Page Components (header only)
// ============================================
const EVENTS_PAGE_COMPONENTS = [
  {
    componentType: 'text_block', name: { en: 'Events Page Header', hi: 'कार्यक्रम पृष्ठ शीर्षक' },
    description: { en: 'Events page header', hi: 'कार्यक्रम पृष्ठ शीर्षक' }, displayOrder: 0, isVisible: true,
    fields: [
      { key: 'title', localizedValue: { en: 'Upcoming Events', hi: 'आगामी कार्यक्रम' } },
      { key: 'content', localizedValue: { en: '<p>Join us for spiritual gatherings and celebrations.</p>', hi: '<p>आध्यात्मिक सभाओं और उत्सवों में हमसे जुड़ें।</p>' } },
      { key: 'alignment', value: 'center' },
    ],
  },
];

// ============================================
// Services Page Components (header only)
// ============================================
const SERVICES_PAGE_COMPONENTS = [
  {
    componentType: 'text_block', name: { en: 'Services Page Header', hi: 'सेवाएं पृष्ठ शीर्षक' },
    description: { en: 'Services page header', hi: 'सेवाएं पृष्ठ शीर्षक' }, displayOrder: 0, isVisible: true,
    fields: [
      { key: 'title', localizedValue: { en: 'Our Services', hi: 'हमारी सेवाएं' } },
      { key: 'content', localizedValue: { en: '<p>We offer a variety of spiritual services to support your journey towards inner peace and divine connection.</p>', hi: '<p>हम आंतरिक शांति और दिव्य संबंध की ओर आपकी यात्रा का समर्थन करने के लिए विभिन्न आध्यात्मिक सेवाएं प्रदान करते हैं।</p>' } },
      { key: 'alignment', value: 'center' },
    ],
  },
];

// ============================================
// Teaching Article Components
// ============================================
const TEACHING_INNER_PEACE_PAGE_COMPONENTS = [
  {
    componentType: 'text_block', name: { en: 'Inner Peace Content', hi: 'आंतरिक शांति सामग्री' },
    description: { en: 'Full teaching article on inner peace', hi: 'आंतरिक शांति पर पूर्ण शिक्षण लेख' }, displayOrder: 0, isVisible: true,
    fields: [
      { key: 'title', localizedValue: { en: 'Path to Inner Peace', hi: 'आंतरिक शांति का मार्ग' } },
      { key: 'content', localizedValue: { en: '<p>In the hustle of modern life, finding inner peace seems like a distant dream. Swami Ji teaches that peace is not something external to be found, but an internal state to be uncovered.</p><p>Through daily meditation practice, mindful breathing, and conscious living, we can peel away the layers of stress and anxiety that cloud our natural state of serenity.</p><p>The path to inner peace begins with understanding that true happiness comes from within.</p><p>Swami Ji recommends starting with just 10 minutes of silent meditation each morning.</p>', hi: '<p>आधुनिक जीवन की भागदौड़ में, आंतरिक शांति पाना एक दूर का सपना लगता है।</p><p>दैनिक ध्यान अभ्यास, सचेत श्वास और जागरूक जीवन के माध्यम से, हम तनाव और चिंता की उन परतों को हटा सकते हैं।</p><p>स्वामी जी हर सुबह केवल 10 मिनट के मौन ध्यान से शुरू करने की सलाह देते हैं।</p>' } },
      { key: 'alignment', value: 'left' },
    ],
  },
];

const TEACHING_MANTRAS_PAGE_COMPONENTS = [
  {
    componentType: 'text_block', name: { en: 'Mantras Content', hi: 'मंत्र सामग्री' },
    description: { en: 'Full teaching article on mantras', hi: 'मंत्रों पर पूर्ण शिक्षण लेख' }, displayOrder: 0, isVisible: true,
    fields: [
      { key: 'title', localizedValue: { en: 'Power of Mantras', hi: 'मंत्रों की शक्ति' } },
      { key: 'content', localizedValue: { en: '<p>Mantras are not mere words but powerful vibrations that have been passed down through millennia.</p><p>Swami Ji guides seekers in the authentic practice of mantra sadhana.</p><p>The most powerful aspect of mantra practice is consistency. A mantra chanted 108 times daily for 40 days creates a deep imprint in your consciousness.</p><p>Start with the universal mantra "Om" - the primordial sound of creation.</p>', hi: '<p>मंत्र केवल शब्द नहीं हैं बल्कि शक्तिशाली कंपन हैं।</p><p>स्वामी जी साधकों को मंत्र साधना के प्रामाणिक अभ्यास में मार्गदर्शन करते हैं।</p><p>मंत्र अभ्यास का सबसे शक्तिशाली पहलू निरंतरता है।</p><p>सार्वभौमिक मंत्र "ॐ" से शुरू करें।</p>' } },
      { key: 'alignment', value: 'left' },
    ],
  },
];

const TEACHING_SEVA_PAGE_COMPONENTS = [
  {
    componentType: 'text_block', name: { en: 'Seva Content', hi: 'सेवा सामग्री' },
    description: { en: 'Full teaching article on seva', hi: 'सेवा पर पूर्ण शिक्षण लेख' }, displayOrder: 0, isVisible: true,
    fields: [
      { key: 'title', localizedValue: { en: 'Service to Humanity', hi: 'मानवता की सेवा' } },
      { key: 'content', localizedValue: { en: '<p>Seva, or selfless service, is the purest expression of spiritual love.</p><p>The ashram provides numerous opportunities for seva, from feeding the hungry to teaching the young.</p><p>Through seva, we learn humility, compassion, and the joy of giving.</p><p>Find opportunities in your daily life to practice seva.</p>', hi: '<p>सेवा, या निःस्वार्थ सेवा, आध्यात्मिक प्रेम की शुद्धतम अभिव्यक्ति है।</p><p>आश्रम सेवा के कई अवसर प्रदान करता है।</p><p>सेवा के माध्यम से, हम विनम्रता, करुणा और देने का आनंद सीखते हैं।</p>' } },
      { key: 'alignment', value: 'left' },
    ],
  },
];

const TEACHING_DHARMA_PAGE_COMPONENTS = [
  {
    componentType: 'text_block', name: { en: 'Dharma Content', hi: 'धर्म सामग्री' },
    description: { en: 'Full teaching article on dharma', hi: 'धर्म पर पूर्ण शिक्षण लेख' }, displayOrder: 0, isVisible: true,
    fields: [
      { key: 'title', localizedValue: { en: 'Living with Purpose', hi: 'उद्देश्य के साथ जीना' } },
      { key: 'content', localizedValue: { en: '<p>Dharma is your unique path, the sacred duty that gives meaning to your existence.</p><p>When we live in accordance with our dharma, every moment becomes meaningful, every action becomes worship.</p><p>To discover your dharma, ask yourself: What activities make you lose track of time?</p><p>Your dharma may evolve as you grow spiritually. Stay open, stay humble.</p>', hi: '<p>धर्म आपका अनूठा मार्ग है, वह पवित्र कर्तव्य जो आपके अस्तित्व को अर्थ देता है।</p><p>जब हम अपने धर्म के अनुसार जीते हैं, तो हर पल सार्थक हो जाता है।</p><p>अपने धर्म को खोजने के लिए, अपने आप से पूछें।</p>' } },
      { key: 'alignment', value: 'left' },
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

  // Find swamiji page ID and create components
  const swamijiPage = createdPages.find((p) => p.slug === 'swamiji');

  if (swamijiPage) {
    const componentIds: string[] = [];

    // Create components for swamiji page
    for (const componentData of SWAMIJI_PAGE_COMPONENTS) {
      const componentId = uuidv4();
      const now = new Date().toISOString();

      const component = {
        PK: `CMS_COMPONENT#${componentId}`,
        SK: `CMS_COMPONENT#${componentId}`,
        GSI1PK: `PAGE#${swamijiPage.id}`,
        GSI1SK: `ORDER#${String(componentData.displayOrder).padStart(3, '0')}#${componentData.componentType}`,
        id: componentId,
        pageId: swamijiPage.id,
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
        console.log(`  ✅ Created swamiji component: ${componentData.name.en}`);
        componentIds.push(componentId);
      } catch (error) {
        console.error(`  ❌ Failed to create swamiji component ${componentData.name.en}:`, error);
      }
    }

    // Update swamiji page with component IDs
    try {
      await docClient.send(
        new PutCommand({
          TableName: tableName,
          Item: {
            PK: `CMS_PAGE#${swamijiPage.id}`,
            SK: `CMS_PAGE#${swamijiPage.id}`,
            GSI1PK: 'CMS_PAGE',
            GSI1SK: `ORDER#001#swamiji`,
            id: swamijiPage.id,
            slug: 'swamiji',
            title: { en: 'About Swamiji', hi: 'स्वामीजी के बारे में' },
            description: { en: 'Biography, teachings, and mission', hi: 'जीवन परिचय, शिक्षाएं और मिशन' },
            path: '/swamiji',
            status: 'published',
            displayOrder: 1,
            componentIds,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        })
      );
      console.log(`\n✅ Updated swamiji page with ${componentIds.length} components`);
    } catch (error) {
      console.error('❌ Failed to update swamiji page:', error);
    }
  }

  // Seed components for all remaining pages
  const PAGE_COMPONENT_MAP = [
    { slug: 'contact', components: CONTACT_PAGE_COMPONENTS },
    { slug: 'ashram', components: ASHRAM_PAGE_COMPONENTS },
    { slug: 'gurukul', components: GURUKUL_PAGE_COMPONENTS },
    { slug: 'teachings', components: TEACHINGS_PAGE_COMPONENTS },
    { slug: 'donation', components: DONATION_PAGE_COMPONENTS },
    { slug: 'events', components: EVENTS_PAGE_COMPONENTS },
    { slug: 'services', components: SERVICES_PAGE_COMPONENTS },
    { slug: 'teaching-inner-peace', components: TEACHING_INNER_PEACE_PAGE_COMPONENTS },
    { slug: 'teaching-mantras', components: TEACHING_MANTRAS_PAGE_COMPONENTS },
    { slug: 'teaching-seva', components: TEACHING_SEVA_PAGE_COMPONENTS },
    { slug: 'teaching-dharma', components: TEACHING_DHARMA_PAGE_COMPONENTS },
  ];

  let totalExtraComponents = 0;

  for (const { slug, components } of PAGE_COMPONENT_MAP) {
    const page = createdPages.find((p) => p.slug === slug);
    if (!page) continue;

    const componentIds: string[] = [];

    for (const componentData of components) {
      const componentId = uuidv4();
      const now = new Date().toISOString();

      const component = {
        PK: `CMS_COMPONENT#${componentId}`,
        SK: `CMS_COMPONENT#${componentId}`,
        GSI1PK: `PAGE#${page.id}`,
        GSI1SK: `ORDER#${String(componentData.displayOrder).padStart(3, '0')}#${componentData.componentType}`,
        id: componentId,
        pageId: page.id,
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
        await docClient.send(new PutCommand({ TableName: tableName, Item: component }));
        console.log(`  ✅ Created ${slug} component: ${componentData.name.en}`);
        componentIds.push(componentId);
        totalExtraComponents++;
      } catch (error) {
        console.error(`  ❌ Failed to create ${slug} component ${componentData.name.en}:`, error);
      }
    }

    // Update page with component IDs
    const pageEntry = INITIAL_PAGES.find((p) => p.slug === slug)!;
    try {
      await docClient.send(
        new PutCommand({
          TableName: tableName,
          Item: {
            PK: `CMS_PAGE#${page.id}`,
            SK: `CMS_PAGE#${page.id}`,
            GSI1PK: 'CMS_PAGE',
            GSI1SK: `ORDER#${String(pageEntry.displayOrder).padStart(3, '0')}#${slug}`,
            id: page.id,
            slug,
            title: pageEntry.title,
            description: pageEntry.description,
            path: pageEntry.path,
            status: pageEntry.status,
            displayOrder: pageEntry.displayOrder,
            componentIds,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        })
      );
      console.log(`\n✅ Updated ${slug} page with ${componentIds.length} components`);
    } catch (error) {
      console.error(`❌ Failed to update ${slug} page:`, error);
    }
  }

  console.log('\n✨ Seeding completed!');
  console.log(`📄 Created ${createdPages.length} pages`);
  console.log(`🧩 Created ${HOME_PAGE_COMPONENTS.length} components for home page`);
  console.log(`🧩 Created ${SWAMIJI_PAGE_COMPONENTS.length} components for swamiji page`);
  console.log(`🧩 Created ${totalExtraComponents} components for other pages`);
}

seedPages().catch(console.error);
