import type { Metadata } from "next";
import type { AppLocale } from "@/i18n/config";
import { Container } from "@/components/ui/Container";
import {
  SectionHeading,
  SacredCard,
  GoldenButton,
  SacredDivider,
  LotusPattern,
  QuoteBlock,
} from "@/components/ui/Decorative";
import { t, type BilingualContent } from "@/content/contentProvider";
import CMSTextBlocks from "@/components/CMSTextBlocks";
import CountdownTimer from "./_components/CountdownTimer";
import LeadForm from "./_components/LeadForm";
import StallCarousel from "./_components/StallCarousel";
import CSRBannerCarousel from "./_components/CSRBannerCarousel";
import {
  FadeUp,
  StaggerContainer,
  StaggerCard,
  ScalePop,
  IconPop,
  SlideRight,
  TierCard,
} from "./_components/ScrollAnimations";

// ─── Constants ───────────────────────────────────────────────
const EVENT_DATE = "2026-06-03T06:00:00+05:30"; // June 3, 2026
const WHATSAPP_NUMBER = "917718075180"; // WhatsApp: 77180 75180
const PHONE_NUMBER = "+91-63890 28886";
const EMAIL_ADDRESS = "official@brahmavadini.org";
const EMAIL_ADDRESS_2 = "Brahmavadinispr@gmail.com";

// ─── Bilingual Content ──────────────────────────────────────

const hero = {
  badge: { en: "Limited Stalls Available", hi: "सीमित स्टॉल उपलब्ध" },
  title: {
    en: "108 Kund World Peace Maha Yagya & Global Health and Wellness Mega Expo with Launching of Mega Environmental Project",
    hi: "108 कुंड विश्व शांति महा यज्ञ एवं वैश्विक स्वास्थ्य और कल्याण मेगा एक्सपो एवं मेगा पर्यावरण परियोजना का शुभारंभ",
  },
  subtitle: {
    en: "The Holy City of Varanasi, Uttar Pradesh • 3–7 June 2026",
    hi: "पवित्र नगरी वाराणसी, उत्तर प्रदेश • 3–7 जून 2026",
  },
  cta: { en: "Enquire Now", hi: "अभी पूछताछ करें" },
  ctaCall: { en: "Call Now", hi: "अभी कॉल करें" },
  tagline: {
    en: "A sacred confluence of spirituality, wellness & commerce — 25,000+ daily footfall, 5 divine days",
    hi: "अध्यात्म, स्वास्थ्य और व्यापार का पवित्र संगम — 25,000+ दैनिक उपस्थिति, 5 दिव्य दिन",
  },
  initiative: {
    en: "An initiative by Brahmavadini Foundation, Brahmavadini Spiritual Services Pvt. Ltd., Swami Rupeshwaranand Ashram & Youth4Nation",
    hi: "ब्रह्मवादिनी फाउंडेशन, ब्रह्मवादिनी स्पिरिचुअल सर्विसेज प्रा. लि., स्वामी रूपेश्वरानंद आश्रम एवं Youth4Nation की एक पहल",
  },
};

const keyBenefits = {
  title: { en: "Why This Maha Yagya Is Unmissable", hi: "यह महा यज्ञ क्यों अनूठा है" },
  subtitle: {
    en: "Four compelling reasons to be a part of this grand event",
    hi: "इस भव्य आयोजन का हिस्सा बनने के चार प्रमुख कारण",
  },
  items: [
    {
      icon: "👥",
      value: { en: "25,000+", hi: "25,000+" },
      title: { en: "Per Day Gathering", hi: "प्रतिदिन उपस्थिति" },
      desc: {
        en: "Over 25,000 visitors per day across 5 divine days — a massive, engaged audience for your brand",
        hi: "5 दिव्य दिनों में प्रतिदिन 25,000+ आगंतुक — आपके ब्रांड के लिए विशाल, सक्रिय दर्शक",
      },
    },
    {
      icon: "📱",
      value: { en: "2 Cr+", hi: "2 करोड़+" },
      title: { en: "Digital Reach", hi: "डिजिटल पहुंच" },
      desc: {
        en: "Over 1 crore digital impressions through social media, live streaming, and national media coverage",
        hi: "सोशल मीडिया, लाइव स्ट्रीमिंग और राष्ट्रीय मीडिया कवरेज के माध्यम से 1 करोड़+ डिजिटल इम्प्रेशन",
      },
    },
    {
      icon: "📈",
      value: { en: "Business", hi: "व्यापार" },
      title: { en: "Business Growth Platform", hi: "व्यापार विकास मंच" },
      desc: {
        en: "An ideal platform for startups, pharma, medical, and all business sectors to showcase products and grow",
        hi: "स्टार्टअप, फार्मा, मेडिकल और सभी व्यापार क्षेत्रों के लिए उत्पाद प्रदर्शित करने और बढ़ने का आदर्श मंच",
      },
    },
    {
      icon: "🤝",
      value: { en: "CSR", hi: "CSR" },
      title: { en: "CSR Certification & Coordination", hi: "CSR प्रमाणन और समन्वय" },
      desc: {
        en: "Unique opportunity for CSR certification through a sacred event and coordination with VIPs, government officials & industry leaders",
        hi: "एक पवित्र आयोजन के माध्यम से CSR प्रमाणन और VIP, सरकारी अधिकारियों व उद्योग जगत के नेताओं के साथ समन्वय का अनूठा अवसर",
      },
    },
  ],
};

const participants = {
  title: { en: "Who Will Be the Participants?", hi: "प्रतिभागी कौन होंगे?" },
  subtitle: {
    en: "Diverse participation across spiritual, health, business, and environmental impact",
    hi: "आध्यात्मिक, स्वास्थ्य, व्यापार और पर्यावरणीय प्रभाव में विविध भागीदारी",
  },
  categories: [
    {
      icon: "🏢",
      tag: { en: "CSR PARTNERS", hi: "CSR पार्टनर" },
      title: { en: "Corporate Participation", hi: "कॉर्पोरेट भागीदारी" },
      tagline: { en: "Driving National Impact through CSR Collaboration", hi: "CSR सहयोग के माध्यम से राष्ट्रीय प्रभाव" },
      points: [
        { en: "Environment + Health initiatives", hi: "पर्यावरण + स्वास्थ्य पहल" },
        { en: "National impact contribution", hi: "राष्ट्रीय प्रभाव योगदान" },
        { en: "Mega Environment Project (MEP) — 750+ Cr Trees Plantation", hi: "मेगा पर्यावरण परियोजना (MEP) — 750+ करोड़ वृक्षारोपण" },
        { en: "CSR Certification", hi: "CSR प्रमाणन" },
      ],
    },
    {
      icon: "🔱",
      tag: { en: "YAGYAMAN PARTICIPANTS", hi: "यज्ञमान प्रतिभागी" },
      title: { en: "Spiritual Participation", hi: "आध्यात्मिक भागीदारी" },
      tagline: { en: "Spiritual Participation for Peace, Prosperity & Well-being", hi: "शांति, समृद्धि और कल्याण के लिए आध्यात्मिक भागीदारी" },
      points: [
        { en: "Individuals / Families", hi: "व्यक्ति / परिवार" },
        { en: "Devotees", hi: "भक्तगण" },
        { en: "Yagya Participation", hi: "यज्ञ सहभागिता" },
        { en: "Sankalp for Family Well-being", hi: "परिवार कल्याण हेतु संकल्प" },
      ],
    },
    {
      icon: "🧘",
      tag: { en: "CAMP PARTICIPANTS", hi: "शिविर प्रतिभागी" },
      title: { en: "Health & Wellness and Yoga Participation", hi: "स्वास्थ्य, कल्याण और योग भागीदारी" },
      tagline: { en: "Holistic Health & Wellness Experience", hi: "समग्र स्वास्थ्य और कल्याण अनुभव" },
      points: [
        { en: "General Public & Health Seekers", hi: "सामान्य जनता और स्वास्थ्य साधक" },
        { en: "Yoga Camps", hi: "योग शिविर" },
        { en: "Ayurveda Consultation", hi: "आयुर्वेद परामर्श" },
        { en: "Free Health Check-up", hi: "निःशुल्क स्वास्थ्य जांच" },
      ],
    },
    {
      icon: "🚀",
      tag: { en: "STALL PARTNERS", hi: "स्टॉल पार्टनर" },
      title: { en: "Business Participation", hi: "व्यापार भागीदारी" },
      tagline: { en: "Business Growth through Direct Market Access", hi: "सीधी बाजार पहुंच के माध्यम से व्यापार वृद्धि" },
      points: [
        { en: "Brands & Startups", hi: "ब्रांड और स्टार्टअप" },
        { en: "Ayurveda, FMCG & Pharma Companies", hi: "आयुर्वेद, FMCG और फार्मा कंपनियां" },
        { en: "Product Display & Sales", hi: "उत्पाद प्रदर्शन और बिक्री" },
        { en: "Brand Promotion", hi: "ब्रांड प्रमोशन" },
      ],
    },
  ],
};

const whyParticipate = {
  title: { en: "Why Participate?", hi: "क्यों भाग लें?" },
  subtitle: {
    en: "An unparalleled opportunity for brand visibility among a spiritually engaged, health-conscious audience",
    hi: "आध्यात्मिक और स्वास्थ्य-जागरूक दर्शकों के बीच ब्रांड की अद्वितीय पहचान का अवसर",
  },
  benefits: [
    { icon: "🏪", title: { en: "Brand Visibility", hi: "ब्रांड दृश्यता" }, desc: { en: "Showcase your products to 25,000+ visitors per day over 5 days", hi: "5 दिनों में प्रतिदिन 25,000+ आगंतुकों को अपने उत्पाद प्रदर्शित करें" } },
    { icon: "👥", title: { en: "Targeted Audience", hi: "लक्षित दर्शक" }, desc: { en: "Health-conscious families, spiritual seekers & wellness enthusiasts", hi: "स्वास्थ्य-जागरूक परिवार, आध्यात्मिक साधक और कल्याण प्रेमी" } },
    { icon: "📺", title: { en: "Media Coverage", hi: "मीडिया कवरेज" }, desc: { en: "National & regional media, live streaming, social media promotion", hi: "राष्ट्रीय और क्षेत्रीय मीडिया, लाइव स्ट्रीमिंग, सोशल मीडिया प्रचार" } },
    { icon: "🤝", title: { en: "Networking", hi: "नेटवर्किंग" }, desc: { en: "Connect with VIPs, government officials & industry leaders", hi: "VIP, सरकारी अधिकारियों और उद्योग जगत से जुड़ें" } },
    { icon: "🙏", title: { en: "Spiritual Merit", hi: "आध्यात्मिक लाभ" }, desc: { en: "Be part of a sacred 108 Kundiya Yagya — a rare spiritual event", hi: "108 कुंडीय महा यज्ञ का हिस्सा बनें — एक दुर्लभ आध्यात्मिक आयोजन" } },
    { icon: "💊", title: { en: "Pharma & Startup Showcase", hi: "फार्मा और स्टार्टअप प्रदर्शन" }, desc: { en: "Ideal platform for medical, pharma companies, startups & other business sectors", hi: "मेडिकल, फार्मा कंपनियों, स्टार्टअप और अन्य व्यापार क्षेत्रों के लिए आदर्श मंच" } },
    { icon: "💚", title: { en: "CSR Opportunity", hi: "CSR अवसर" }, desc: { en: "Align your brand with wellness, peace & community service", hi: "अपने ब्रांड को कल्याण, शांति और समाज सेवा से जोड़ें" } },
    { icon: "🌍", title: { en: "Cultural Significance", hi: "सांस्कृतिक महत्व" }, desc: { en: "Varanasi — the spiritual capital of India, global recognition", hi: "वाराणसी — भारत की आध्यात्मिक राजधानी, वैश्विक पहचान" } },
  ],
};

const participationOptions = {
  title: { en: "How to Participate", hi: "कैसे भाग लें" },
  subtitle: {
    en: "Choose the participation category that suits you best",
    hi: "अपने लिए सबसे उपयुक्त भागीदारी श्रेणी चुनें",
  },
  categories: [
    {
      id: "sponsor",
      name: { en: "Partners", hi: "पार्टनर्स" },
      icon: "🏆",
      desc: { en: "Partner with us to amplify your brand at India's grandest spiritual & wellness event", hi: "भारत के सबसे भव्य आध्यात्मिक और कल्याण आयोजन में अपने ब्रांड को बढ़ाने के लिए हमारे साथ जुड़ें" },
      tiers: [
        {
          id: "lead-csr-partner",
          name: { en: "Lead CSR Partner", hi: "लीड CSR पार्टनर" },
          price: "₹1,00,00,000",
          priceLabel: { en: "1 Crore", hi: "1 करोड़" },
          popular: true,
          features: [
            { en: "Exclusive Lead CSR Partner branding across all event material", hi: "सभी इवेंट सामग्री पर विशेष लीड CSR पार्टनर ब्रांडिंग" },
            { en: "Largest premium stall with VIP zone", hi: "VIP ज़ोन सहित सबसे बड़ा प्रीमियम स्टॉल" },
            { en: "Complete media coverage, press conference & social media campaign", hi: "पूर्ण मीडिया कवरेज, प्रेस कॉन्फ्रेंस और सोशल मीडिया अभियान" },
            { en: "VIP passes for 15 representatives + VIP dinner invitation", hi: "15 प्रतिनिधियों के लिए VIP पास + VIP डिनर निमंत्रण" },
            { en: "Stage branding & speaking opportunity", hi: "स्टेज ब्रांडिंग और बोलने का अवसर" },
          ],
        },
        {
          id: "green-partner",
          name: { en: "Green Partner", hi: "ग्रीन पार्टनर" },
          price: "₹50,00,000",
          priceLabel: { en: "50 Lakh", hi: "50 लाख" },
          popular: false,
          features: [
            { en: "Green Partner branding across all event material", hi: "सभी इवेंट सामग्री पर ग्रीन पार्टनर ब्रांडिंग" },
            { en: "Prime stall location (20×20 ft VIP zone)", hi: "प्राइम स्टॉल लोकेशन (20×20 फ़ीट VIP ज़ोन)" },
            { en: "Full media coverage, press mentions & social media promotion", hi: "पूर्ण मीडिया कवरेज, प्रेस उल्लेख और सोशल मीडिया प्रमोशन" },
            { en: "VIP passes for 10 representatives + VIP dinner invitation", hi: "10 प्रतिनिधियों के लिए VIP पास + VIP डिनर निमंत्रण" },
          ],
        },
        {
          id: "health-partner",
          name: { en: "Health Partner", hi: "हेल्थ पार्टनर" },
          price: "₹25,00,000",
          priceLabel: { en: "25 Lakh", hi: "25 लाख" },
          popular: false,
          features: [
            { en: "Co-branding on event banners & digital media", hi: "इवेंट बैनर और डिजिटल मीडिया पर को-ब्रांडिंग" },
            { en: "Premium stall (15×15 ft) with custom design", hi: "कस्टम डिज़ाइन सहित प्रीमियम स्टॉल (15×15 फ़ीट)" },
            { en: "Media coverage & social media promotion", hi: "मीडिया कवरेज और सोशल मीडिया प्रमोशन" },
            { en: "VIP passes for 6 representatives", hi: "6 प्रतिनिधियों के लिए VIP पास" },
          ],
        },
        {
          id: "empact-partner",
          name: { en: "Empact Partner", hi: "एम्पैक्ट पार्टनर" },
          price: "₹10,00,000",
          priceLabel: { en: "10 Lakh", hi: "10 लाख" },
          popular: false,
          features: [
            { en: "Branding on select event banners", hi: "चुनिंदा इवेंट बैनर पर ब्रांडिंग" },
            { en: "Standard stall (10×10 ft) with setup", hi: "सेटअप सहित स्टैंडर्ड स्टॉल (10×10 फ़ीट)" },
            { en: "Social media mentions", hi: "सोशल मीडिया उल्लेख" },
            { en: "Event passes for 4 representatives", hi: "4 प्रतिनिधियों के लिए इवेंट पास" },
          ],
        },
        {
          id: "stall-partner",
          name: { en: "Stall Partner", hi: "स्टॉल पार्टनर" },
          price: "₹5,00,000",
          priceLabel: { en: "5 Lakh", hi: "5 लाख" },
          popular: false,
          features: [
            { en: "Prime stall location with branding", hi: "ब्रांडिंग सहित प्राइम स्टॉल लोकेशन" },
            { en: "Listing in event directory & website", hi: "इवेंट डायरेक्टरी और वेबसाइट पर सूचीबद्ध" },
            { en: "Event passes for 2 representatives", hi: "2 प्रतिनिधियों के लिए इवेंट पास" },
          ],
        },
      ],
    },
    {
      id: "yajaman",
      name: { en: "Yagyaman", hi: "यज्ञमान" },
      icon: "🔱",
      desc: { en: "Become a Yagyaman and earn the sacred merit of performing the Maha Yagya", hi: "यज्ञमान बनें और महा यज्ञ करने का पवित्र पुण्य अर्जित करें" },
      tiers: [
        {
          id: "vishisht-yajaman",
          name: { en: "Vishisht Yagyaman", hi: "विशिष्ट यज्ञमान" },
          price: "₹5,51,000",
          priceLabel: { en: "VVIP Category", hi: "VVIP श्रेणी" },
          popular: true,
          features: [
            { en: "Shri Baglamukhi Yantra — Real Gold Made", hi: "श्री बगलामुखी यंत्र — असली स्वर्ण निर्मित" },
            { en: "VVIP Category", hi: "VVIP श्रेणी" },
            { en: "Free Accommodation & Meals", hi: "निःशुल्क आवास और भोजन" },
            { en: "Free Health Checkup", hi: "निःशुल्क स्वास्थ्य जांच" },
            { en: "Maha Yagya Participation", hi: "महा यज्ञ सहभागिता" },
            { en: "Divine Meet with Saints", hi: "संतों से दिव्य भेंट" },
            { en: "Sankalp for Family Wellness", hi: "परिवार कल्याण हेतु संकल्प" },
          ],
        },
        {
          id: "mukhya-yajaman",
          name: { en: "Mukhya Yagyaman", hi: "मुख्य यज्ञमान" },
          price: "₹2,51,000",
          priceLabel: { en: "VIP Category", hi: "VIP श्रेणी" },
          popular: false,
          features: [
            { en: "Shri Baglamukhi Yantra — Real Silver Made", hi: "श्री बगलामुखी यंत्र — असली रजत निर्मित" },
            { en: "VIP Category", hi: "VIP श्रेणी" },
            { en: "Free Accommodation & Meals", hi: "निःशुल्क आवास और भोजन" },
            { en: "Free Health Checkup", hi: "निःशुल्क स्वास्थ्य जांच" },
            { en: "Maha Yagya Participation", hi: "महा यज्ञ सहभागिता" },
            { en: "Divine Meet with Saints", hi: "संतों से दिव्य भेंट" },
            { en: "Sankalp for Family Wellness", hi: "परिवार कल्याण हेतु संकल्प" },
          ],
        },
        {
          id: "sahyogi-yajaman",
          name: { en: "Sahayogi Yagyaman", hi: "सहयोगी यज्ञमान" },
          price: "₹1,51,000",
          priceLabel: { en: "VIP Category", hi: "VIP श्रेणी" },
          popular: false,
          features: [
            { en: "Shri Baglamukhi Yantra — Real Copper Made", hi: "श्री बगलामुखी यंत्र — असली ताम्र निर्मित" },
            { en: "VIP Category", hi: "VIP श्रेणी" },
            { en: "Free Accommodation & Meals", hi: "निःशुल्क आवास और भोजन" },
            { en: "Free Health Checkup", hi: "निःशुल्क स्वास्थ्य जांच" },
            { en: "Maha Yagya Participation", hi: "महा यज्ञ सहभागिता" },
            { en: "Divine Meet with Saints", hi: "संतों से दिव्य भेंट" },
            { en: "Sankalp for Family Wellness", hi: "परिवार कल्याण हेतु संकल्प" },
          ],
        },
      ],
    },
    {
      id: "shivirarthi",
      name: { en: "Camps & Programs", hi: "शिविर और कार्यक्रम" },
      icon: "🗓️",
      desc: { en: "Participate in camps and programs — yoga, wellness, and spiritual experiences", hi: "शिविरों और कार्यक्रमों में भाग लें — योग, कल्याण और आध्यात्मिक अनुभव" },
      tiers: [
        {
          id: "shivirarthi-1day",
          name: { en: "One Day Camp", hi: "एक दिवसीय शिविर" },
          price: "₹11,000",
          priceLabel: { en: "₹11,000", hi: "₹11,000" },
          popular: false,
          features: [
            { en: "Free Accommodation & Meals", hi: "निःशुल्क आवास और भोजन" },
            { en: "Free Health Checkup", hi: "निःशुल्क स्वास्थ्य जांच" },
            { en: "Yoga Camp", hi: "योग शिविर" },
            { en: "Ayurveda Consultation", hi: "आयुर्वेद परामर्श" },
          ],
        },
        {
          id: "shivirarthi-3day",
          name: { en: "Three Days Camp", hi: "3 दिवसीय शिविर" },
          price: "₹21,000",
          priceLabel: { en: "₹21,000", hi: "₹21,000" },
          popular: true,
          features: [
            { en: "Free Accommodation & Meals", hi: "निःशुल्क आवास और भोजन" },
            { en: "Free Health Checkup", hi: "निःशुल्क स्वास्थ्य जांच" },
            { en: "Yoga Sessions", hi: "योग सत्र" },
            { en: "Medical & Ayurveda Interaction", hi: "चिकित्सा और आयुर्वेद परामर्श" },
          ],
        },
        {
          id: "shivirarthi-5day",
          name: { en: "Five Days Camp", hi: "5 दिवसीय शिविर" },
          price: "₹51,000",
          priceLabel: { en: "₹51,000", hi: "₹51,000" },
          popular: false,
          features: [
            { en: "Free Accommodation & Meals", hi: "निःशुल्क आवास और भोजन" },
            { en: "Free Health Checkup", hi: "निःशुल्क स्वास्थ्य जांच" },
            { en: "Full Wellness Program", hi: "पूर्ण कल्याण कार्यक्रम" },
            { en: "Pitra Shanti Puja", hi: "पितृ शांति पूजा" },
          ],
        },
        {
          id: "divine-meet",
          name: { en: "Divine Meet with Swamiji", hi: "स्वामीजी से दिव्य भेंट" },
          price: "₹51,000",
          priceLabel: { en: "₹51,000", hi: "₹51,000" },
          popular: false,
          features: [
            { en: "Free Accommodation & Meals", hi: "निःशुल्क आवास और भोजन" },
            { en: "Free Health Checkup", hi: "निःशुल्क स्वास्थ्य जांच" },
            { en: "Personal Horoscope Analysis", hi: "व्यक्तिगत कुंडली विश्लेषण" },
            { en: "Divine Guidance", hi: "दिव्य मार्गदर्शन" },
            { en: "Yagya Participation", hi: "यज्ञ सहभागिता" },
          ],
        },
      ],
    },
    {
      id: "business-stall",
      name: { en: "Business / Startup Stall", hi: "व्यवसाय / स्टार्टअप स्टॉल" },
      icon: "🚀",
      desc: { en: "Showcase your business, products & services at India's grandest spiritual & wellness expo", hi: "भारत के सबसे भव्य आध्यात्मिक और कल्याण एक्सपो में अपने व्यवसाय, उत्पाद और सेवाओं का प्रदर्शन करें" },
      tiers: [
        {
          id: "business-standard",
          name: { en: "Standard Stall (10×10 ft)", hi: "स्टैंडर्ड स्टॉल (10×10 फ़ीट)" },
          price: "₹50,000",
          priceLabel: { en: "Truss with Fabric Finish", hi: "ट्रस फ़ैब्रिक फ़िनिश" },
          popular: false,
          features: [
            { en: "2 Tables (2.5 ft × 5 ft)", hi: "2 टेबल (2.5 फ़ीट × 5 फ़ीट)" },
            { en: "4 Banquet Chairs", hi: "4 बैंक्वेट चेयर" },
            { en: "1 Power Point", hi: "1 पावर पॉइंट" },
            { en: "2 Metal Lights", hi: "2 मेटल लाइट" },
            { en: "1 Pedestal Fan", hi: "1 पेडस्टल फ़ैन" },
            { en: "Carpeting & 1 Dustbin", hi: "कार्पेटिंग और 1 डस्टबिन" },
          ],
        },
        {
          id: "business-premium",
          name: { en: "Premium Stall (12×12 ft)", hi: "प्रीमियम स्टॉल (12×12 फ़ीट)" },
          price: "₹1,00,000",
          priceLabel: { en: "Without TV", hi: "बिना टीवी" },
          popular: false,
          features: [
            { en: "2 Tables (2.5 ft × 5 ft) + 2 Round Tables", hi: "2 टेबल (2.5 फ़ीट × 5 फ़ीट) + 2 राउंड टेबल" },
            { en: "8 Banquet Chairs", hi: "8 बैंक्वेट चेयर" },
            { en: "1 Two-Seater Sofa", hi: "1 टू-सीटर सोफ़ा" },
            { en: "1 Power Point", hi: "1 पावर पॉइंट" },
            { en: "2 Metal Lights + 1 Pedestal Fan", hi: "2 मेटल लाइट + 1 पेडस्टल फ़ैन" },
            { en: "Carpeting & 1 Dustbin", hi: "कार्पेटिंग और 1 डस्टबिन" },
          ],
        },
        {
          id: "business-premium-tv",
          name: { en: "Luxury Premium Stall + TV (12×12 ft)", hi: "लक्ज़री प्रीमियम स्टॉल + टीवी (12×12 फ़ीट)" },
          price: "₹1,50,000",
          priceLabel: { en: "With Plasma TV", hi: "प्लाज़्मा टीवी सहित" },
          popular: true,
          features: [
            { en: "2 Tables (2.5 ft × 5 ft) + 2 Round Tables", hi: "2 टेबल (2.5 फ़ीट × 5 फ़ीट) + 2 राउंड टेबल" },
            { en: "8 Banquet Chairs + 1 Two-Seater Sofa", hi: "8 बैंक्वेट चेयर + 1 टू-सीटर सोफ़ा" },
            { en: "40–52 Inch Plasma TV with Stand", hi: "40–52 इंच प्लाज़्मा टीवी स्टैंड सहित" },
            { en: "1 Power Point", hi: "1 पावर पॉइंट" },
            { en: "2 Metal Lights + 1 Pedestal Fan", hi: "2 मेटल लाइट + 1 पेडस्टल फ़ैन" },
            { en: "Carpeting & 1 Dustbin", hi: "कार्पेटिंग और 1 डस्टबिन" },
          ],
        },
        {
          id: "business-prime",
          name: { en: "Prime Stall (6m × 6m)", hi: "प्राइम स्टॉल (6m × 6m)" },
          price: "₹2,00,000",
          priceLabel: { en: "Premium 3D Wooden Stall", hi: "प्रीमियम 3D वुडन स्टॉल" },
          popular: false,
          features: [
            { en: "3-inch Raised Platform with Carpeting", hi: "3 इंच रेज़्ड प्लेटफ़ॉर्म कार्पेटिंग सहित" },
            { en: "1 Store Room + 1 Registration Table", hi: "1 स्टोर रूम + 1 रजिस्ट्रेशन टेबल" },
            { en: "2 Glass Round Tables + 8 Banquet Chairs", hi: "2 ग्लास राउंड टेबल + 8 बैंक्वेट चेयर" },
            { en: "1 Two-Seater Sofa", hi: "1 टू-सीटर सोफ़ा" },
            { en: "12 ft × 8 ft LED Wall", hi: "12 फ़ीट × 8 फ़ीट LED वॉल" },
            { en: "5 KVA Power Supply + Power Board", hi: "5 KVA पावर सप्लाई + पावर बोर्ड" },
            { en: "10 Focus Lights + 8 Metal Lights", hi: "10 फ़ोकस लाइट + 8 मेटल लाइट" },
            { en: "1 Mini Cooler", hi: "1 मिनी कूलर" },
            { en: "Branding & Vinyl Flex Included", hi: "ब्रांडिंग और विनाइल फ़्लेक्स शामिल" },
          ],
        },
      ],
    },
    {
      id: "food-stall",
      name: { en: "State Food Stall", hi: "राज्य खाद्य स्टॉल" },
      icon: "🍛",
      desc: { en: "Showcase authentic state cuisine and culinary traditions at the mega expo", hi: "मेगा एक्सपो में प्रामाणिक राज्य व्यंजन और पाक परंपराओं का प्रदर्शन करें" },
      tiers: [
        {
          id: "food-standard",
          name: { en: "Standard Food Stall (10×10 ft)", hi: "स्टैंडर्ड फ़ूड स्टॉल (10×10 फ़ीट)" },
          price: "₹50,000",
          priceLabel: { en: "Truss with Fabric Finish", hi: "ट्रस फ़ैब्रिक फ़िनिश" },
          popular: false,
          features: [
            { en: "2 Tables (2.5 ft × 5 ft)", hi: "2 टेबल (2.5 फ़ीट × 5 फ़ीट)" },
            { en: "4 Banquet Chairs", hi: "4 बैंक्वेट चेयर" },
            { en: "1 Power Point", hi: "1 पावर पॉइंट" },
            { en: "2 Metal Lights", hi: "2 मेटल लाइट" },
            { en: "1 Pedestal Fan", hi: "1 पेडस्टल फ़ैन" },
            { en: "Carpeting & 1 Dustbin", hi: "कार्पेटिंग और 1 डस्टबिन" },
          ],
        },
        {
          id: "food-premium",
          name: { en: "Premium Stall (12×12 ft)", hi: "प्रीमियम स्टॉल (12×12 फ़ीट)" },
          price: "₹1,00,000",
          priceLabel: { en: "Without TV", hi: "बिना टीवी" },
          popular: false,
          features: [
            { en: "2 Tables (2.5 ft × 5 ft) + 2 Round Tables", hi: "2 टेबल (2.5 फ़ीट × 5 फ़ीट) + 2 राउंड टेबल" },
            { en: "8 Banquet Chairs", hi: "8 बैंक्वेट चेयर" },
            { en: "1 Two-Seater Sofa", hi: "1 टू-सीटर सोफ़ा" },
            { en: "1 Power Point", hi: "1 पावर पॉइंट" },
            { en: "2 Metal Lights + 1 Pedestal Fan", hi: "2 मेटल लाइट + 1 पेडस्टल फ़ैन" },
            { en: "Carpeting & 1 Dustbin", hi: "कार्पेटिंग और 1 डस्टबिन" },
          ],
        },
        {
          id: "food-premium-tv",
          name: { en: "Luxury Premium Stall + TV (12×12 ft)", hi: "लक्ज़री प्रीमियम स्टॉल + टीवी (12×12 फ़ीट)" },
          price: "₹1,50,000",
          priceLabel: { en: "With Plasma TV", hi: "प्लाज़्मा टीवी सहित" },
          popular: true,
          features: [
            { en: "2 Tables (2.5 ft × 5 ft) + 2 Round Tables", hi: "2 टेबल (2.5 फ़ीट × 5 फ़ीट) + 2 राउंड टेबल" },
            { en: "8 Banquet Chairs + 1 Two-Seater Sofa", hi: "8 बैंक्वेट चेयर + 1 टू-सीटर सोफ़ा" },
            { en: "40–52 Inch Plasma TV with Stand", hi: "40–52 इंच प्लाज़्मा टीवी स्टैंड सहित" },
            { en: "1 Power Point", hi: "1 पावर पॉइंट" },
            { en: "2 Metal Lights + 1 Pedestal Fan", hi: "2 मेटल लाइट + 1 पेडस्टल फ़ैन" },
            { en: "Carpeting & 1 Dustbin", hi: "कार्पेटिंग और 1 डस्टबिन" },
          ],
        },
        {
          id: "food-prime",
          name: { en: "Prime Stall (6m × 6m)", hi: "प्राइम स्टॉल (6m × 6m)" },
          price: "₹2,00,000",
          priceLabel: { en: "Premium 3D Wooden Stall", hi: "प्रीमियम 3D वुडन स्टॉल" },
          popular: false,
          features: [
            { en: "3-inch Raised Platform with Carpeting", hi: "3 इंच रेज़्ड प्लेटफ़ॉर्म कार्पेटिंग सहित" },
            { en: "1 Store Room + 1 Registration Table", hi: "1 स्टोर रूम + 1 रजिस्ट्रेशन टेबल" },
            { en: "2 Glass Round Tables + 8 Banquet Chairs", hi: "2 ग्लास राउंड टेबल + 8 बैंक्वेट चेयर" },
            { en: "1 Two-Seater Sofa", hi: "1 टू-सीटर सोफ़ा" },
            { en: "12 ft × 8 ft LED Wall", hi: "12 फ़ीट × 8 फ़ीट LED वॉल" },
            { en: "5 KVA Power Supply + Power Board", hi: "5 KVA पावर सप्लाई + पावर बोर्ड" },
            { en: "10 Focus Lights + 8 Metal Lights", hi: "10 फ़ोकस लाइट + 8 मेटल लाइट" },
            { en: "1 Mini Cooler", hi: "1 मिनी कूलर" },
            { en: "Branding & Vinyl Flex Included", hi: "ब्रांडिंग और विनाइल फ़्लेक्स शामिल" },
          ],
        },
      ],
    },
  ],
};

const highlights = {
  title: { en: "Event Highlights", hi: "कार्यक्रम की मुख्य विशेषताएं" },
  stats: [
    { value: "108", label: { en: "Sacred Kunds", hi: "पवित्र कुंड" } },
    { value: "25,000+", label: { en: "Daily Footfall", hi: "दैनिक उपस्थिति" } },
    { value: "5", label: { en: "Divine Days", hi: "दिव्य दिन" } },
    { value: "300+", label: { en: "Exhibition Stalls", hi: "प्रदर्शनी स्टॉल" } },
    { value: "2 Cr+", label: { en: "Digital Reach", hi: "डिजिटल पहुंच" } },
    { value: "Free", label: { en: "Health Checkup", hi: "स्वास्थ्य जांच" } },
  ],
};

const audience = {
  title: { en: "Who Attends?", hi: "कौन आता है?" },
  subtitle: {
    en: "Your stall will be visited by a diverse, engaged audience",
    hi: "आपके स्टॉल पर विविध और सक्रिय दर्शक आएंगे",
  },
  segments: [
    { icon: "🏢", title: { en: "Corporate Attendees", hi: "कॉर्पोरेट प्रतिभागी" }, desc: { en: "Medical & Pharma companies, business sector leaders, and industry professionals", hi: "मेडिकल और फार्मा कंपनियां, व्यापार क्षेत्र के नेता और उद्योग पेशेवर" } },
    { icon: "🙏", title: { en: "Spiritual Participants", hi: "आध्यात्मिक प्रतिभागी" }, desc: { en: "Devotees participating in the sacred 108 hawan kunds rituals and spiritual ceremonies", hi: "पवित्र 108 हवन कुंड अनुष्ठानों और आध्यात्मिक समारोहों में भाग लेने वाले भक्त" } },
    { icon: "🚀", title: { en: "Business & Startup Stall Holders", hi: "व्यवसाय और स्टार्टअप स्टॉलधारक" }, desc: { en: "Startups, medical/pharma companies, and other business sectors showcasing products & services", hi: "स्टार्टअप, मेडिकल/फार्मा कंपनियां और अन्य व्यापार क्षेत्र जो उत्पाद और सेवाएं प्रदर्शित कर रहे हैं" } },
    { icon: "👨‍👩‍👧‍👦", title: { en: "General Visitors", hi: "सामान्य आगंतुक" }, desc: { en: "Health-conscious families, spiritual seekers, and wellness enthusiasts from across India", hi: "पूरे भारत से स्वास्थ्य-जागरूक परिवार, आध्यात्मिक साधक और कल्याण प्रेमी" } },
  ],
};

const urgency = {
  title: { en: "Time is Running Out!", hi: "समय निकला जा रहा है!" },
  subtitle: {
    en: "Secure your stall before they're all booked",
    hi: "सभी बुक होने से पहले अपना स्टॉल सुरक्षित करें",
  },
  stallsRemaining: { en: "Only limited stalls remaining — book now to avoid disappointment!", hi: "केवल सीमित स्टॉल शेष — निराशा से बचने के लिए अभी बुक करें!" },
  earlyBird: { en: "🔥 Early bird registrations get priority placement", hi: "🔥 शुरुआती पंजीकरण को प्राथमिकता प्लेसमेंट मिलता है" },
};

const formSection = {
  title: { en: "Enquire Now", hi: "अभी पूछताछ करें" },
  subtitle: {
    en: "Fill in your details and our team will get back to you within 24 hours",
    hi: "अपना विवरण भरें, हमारी टीम 24 घंटे में आपसे संपर्क करेगी",
  },
  infoTitle: { en: "Why Book Now?", hi: "अभी क्यों बुक करें?" },
  reasons: [
    { en: "✓ Early bird gets best location", hi: "✓ शुरुआती बुकिंग पर सबसे अच्छी लोकेशन" },
    { en: "✓ Limited stalls in each category", hi: "✓ प्रत्येक श्रेणी में सीमित स्टॉल" },
    { en: "✓ Custom branding assistance included", hi: "✓ कस्टम ब्रांडिंग सहायता शामिल" },
    { en: "✓ Flexible payment options available", hi: "✓ लचीले भुगतान विकल्प उपलब्ध" },
    { en: "✓ Dedicated event coordinator", hi: "✓ समर्पित इवेंट कोऑर्डिनेटर" },
  ],
};

const trust = {
  title: { en: "Inspired By", hi: "प्रेरणास्रोत" },
  orgName: { en: "Swami Rupeshwaranand Ji Maharaj", hi: "स्वामी रूपेश्वरानंद जी महाराज" },
  orgDesc: {
    en: "With decades of experience organizing large-scale spiritual events, yagyas, and community gatherings across India, the ashram is committed to preserving Vedic traditions while creating meaningful platforms for cultural and commercial exchange.",
    hi: "पूरे भारत में बड़े पैमाने पर आध्यात्मिक कार्यक्रमों, यज्ञों और सामुदायिक सभाओं के आयोजन के दशकों के अनुभव के साथ, आश्रम वैदिक परंपराओं को संरक्षित करते हुए सांस्कृतिक और व्यावसायिक आदान-प्रदान के लिए सार्थक मंच बनाने के लिए प्रतिबद्ध है।",
  },
  quote: {
    en: "This Maha Yagya is not just a spiritual event — it is a movement for world peace, holistic health, and cultural unity.",
    hi: "यह महा यज्ञ सिर्फ एक आध्यात्मिक आयोजन नहीं है — यह विश्व शांति, समग्र स्वास्थ्य और सांस्कृतिक एकता का आंदोलन है।",
  },
  quoteAuthor: { en: "Swami Rupeshwaranand Ji Maharaj", hi: "स्वामी रूपेश्वरानंद जी महाराज" },
};

// CMS fallback sections — editors can override these from the content editor
// by creating a page with slug "maha-yagya" in the CMS
const cmsFallbackSections = [
  {
    id: "about-event",
    title: { en: "About the Event", hi: "कार्यक्रम के बारे में" },
    content: {
      en: "The 108 Kund World Peace Maha Yagya is a grand spiritual ceremony performed with 108 sacred fire pits (kunds) simultaneously. This rare and auspicious event brings together thousands of devotees, spiritual leaders, and wellness practitioners for 5 days of prayers, rituals, health expo, and cultural programs in the holy city of Varanasi.",
      hi: "108 कुंड विश्व शांति महा यज्ञ एक भव्य आध्यात्मिक समारोह है जो एक साथ 108 पवित्र अग्नि कुंडों के साथ किया जाता है। यह दुर्लभ और शुभ आयोजन हजारों भक्तों, आध्यात्मिक नेताओं और कल्याण साधकों को पवित्र वाराणसी में 5 दिनों की प्रार्थना, अनुष्ठान, स्वास्थ्य एक्सपो और सांस्कृतिक कार्यक्रमों के लिए एक साथ लाता है।",
    },
  },
  {
    id: "venue-info",
    title: { en: "Venue & Location", hi: "स्थान और लोकेशन" },
    content: {
      en: "📍 Varanasi, Uttar Pradesh, India\n🕐 June 3–7, 2026\n🏛️ A sprawling venue with dedicated zones for yagya, exhibition stalls, cultural stage, food court, and VIP seating.",
      hi: "📍 वाराणसी, उत्तर प्रदेश, भारत\n🕐 3–7 जून 2026\n🏛️ यज्ञ, प्रदर्शनी स्टॉल, सांस्कृतिक मंच, फूड कोर्ट और VIP बैठक के लिए समर्पित क्षेत्रों के साथ विशाल स्थान।",
    },
  },
];

const finalCTA = {
  title: { en: "Don't Miss This Opportunity!", hi: "इस अवसर को न चूकें!" },
  subtitle: {
    en: "Join 300+ exhibitors at India's largest spiritual & wellness expo in the holy city of Varanasi",
    hi: "पवित्र वाराणसी में भारत के सबसे बड़े आध्यात्मिक और स्वास्थ्य एक्सपो में 300+ प्रदर्शकों से जुड़ें",
  },
  callLabel: { en: "Call Us", hi: "कॉल करें" },
  emailLabel: { en: "Email Us", hi: "ईमेल करें" },
  whatsappLabel: { en: "WhatsApp", hi: "व्हाट्सएप" },
};

const floating = {
  whatsappMsg: {
    en: "Hi, I'm interested in booking a stall at the 108 Kund World Peace Maha Yagya & Global Health and Wellness Mega Expo with Launching of Mega Environmental Project in Varanasi. Please share details.",
    hi: "नमस्ते, मैं वाराणसी में 108 कुंड विश्व शांति महा यज्ञ एवं वैश्विक स्वास्थ्य और कल्याण मेगा एक्सपो एवं मेगा पर्यावरण परियोजना का शुभारंभ में स्टॉल बुक करने में रुचि रखता/रखती हूं। कृपया विवरण साझा करें।",
  },
};

// ─── Metadata ────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: AppLocale }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const titles: Record<AppLocale, string> = {
    en: "108 Kund World Peace Maha Yagya & Global Health and Wellness Mega Expo with Launching of Mega Environmental Project — Enquire Now",
    hi: "108 कुंड विश्व शांति महा यज्ञ एवं वैश्विक स्वास्थ्य और कल्याण मेगा एक्सपो एवं मेगा पर्यावरण परियोजना का शुभारंभ — अभी पूछताछ करें",
  };

  const descriptions: Record<AppLocale, string> = {
    en: "Book your exhibition stall at the 108 Kund World Peace Maha Yagya & Global Health and Wellness Mega Expo with Launching of Mega Environmental Project in Varanasi. 25,000+ daily visitors, 5 days, 300+ stalls. Standard ₹50K, Premium ₹1L, Prime ₹2L.",
    hi: "वाराणसी में 108 कुंड विश्व शांति महा यज्ञ एवं वैश्विक स्वास्थ्य और कल्याण मेगा एक्सपो एवं मेगा पर्यावरण परियोजना का शुभारंभ में अपना प्रदर्शनी स्टॉल बुक करें। 25,000+ दैनिक आगंतुक, 5 दिन, 300+ स्टॉल।",
  };

  return {
    title: titles[locale],
    description: descriptions[locale],
    keywords: [
      "108 kundiya yagya",
      "maha yagya varanasi",
      "health expo 2026",
      "exhibition stall booking",
      "spiritual event india",
      "world peace yagya",
    ],
    alternates: {
      canonical: `/${locale}/maha-yagya`,
      languages: { en: "/en/maha-yagya", hi: "/hi/maha-yagya" },
    },
    openGraph: {
      title: titles[locale],
      description: descriptions[locale],
      type: "website",
      locale: locale === "hi" ? "hi_IN" : "en_IN",
    },
  };
}

// ─── Page Component ──────────────────────────────────────────

export default async function MahaYagyaPage({
  params,
}: {
  params: Promise<{ locale: AppLocale }>;
}) {
  const { locale } = await params;

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(t(floating.whatsappMsg, locale))}`;

  return (
    <div className="bg-gradient-to-b from-amber-50/50 to-white dark:from-zinc-900 dark:to-zinc-950">

      {/* JSON-LD Event Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Event",
            name: "108 Kund World Peace Maha Yagya & Global Health and Wellness Mega Expo with Launching of Mega Environmental Project",
            description: t(hero.tagline, "en"),
            startDate: EVENT_DATE,
            endDate: "2026-06-07T20:00:00+05:30",
            eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
            eventStatus: "https://schema.org/EventScheduled",
            location: {
              "@type": "Place",
              name: "Varanasi",
              address: {
                "@type": "PostalAddress",
                addressLocality: "Varanasi",
                addressRegion: "Uttar Pradesh",
                addressCountry: "IN",
              },
            },
            organizer: {
              "@type": "Organization",
              name: "Swami Rupeshwaranand Ji Maharaj Ashram",
              url: "https://swamirupeshwaranand.org",
            },
            offers: participationOptions.categories.flatMap((cat) =>
              cat.tiers.filter((tier) => tier.price).map((tier) => ({
                "@type": "Offer",
                name: `${cat.name.en} — ${tier.name.en}`,
                price: tier.price.replace(/[₹,]/g, ""),
                priceCurrency: "INR",
                availability: "https://schema.org/InStock",
              }))
            ),
          }),
        }}
      />

      {/* ═══ SECTION 1: HERO ═══ */}
      <section
        className="relative py-20 sm:py-24 md:py-32 overflow-hidden"
        style={{
          background: "linear-gradient(135deg, var(--color-primary), #1a0a00)",
        }}
      >
        <LotusPattern />
        <Container className="relative z-10 text-center">
          {/* Badge */}
          <span
            className="inline-block px-4 py-1.5 rounded-full text-sm font-semibold mb-6 animate-pulse"
            style={{
              backgroundColor: "rgba(255,255,255,0.15)",
              color: "var(--color-gold)",
              border: "1px solid var(--color-gold)",
            }}
          >
            🔥 {t(hero.badge, locale)}
          </span>

          <h1 className="font-heading text-white mb-4 leading-tight">
            <span className="block text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold">
              {locale === "hi" ? "108 कुंड विश्व शांति महा यज्ञ" : "108 Kund World Peace Maha Yagya"}
            </span>
            <span className="block text-xl sm:text-2xl md:text-3xl font-medium mt-2" style={{ color: "var(--color-gold)" }}>{locale === "hi" ? "एवं" : "&"}</span>
            <span className="block text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold text-white/90">
              {locale === "hi" ? "वैश्विक स्वास्थ्य और कल्याण मेगा एक्सपो" : "Global Health and Wellness Mega Expo"}
            </span>
            <span className="block text-xl sm:text-2xl md:text-3xl font-medium mt-1" style={{ color: "var(--color-gold)" }}>{locale === "hi" ? "एवं" : "&"}</span>
            <span className="block text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold text-white/90">
              {locale === "hi" ? "मेगा पर्यावरण परियोजना का शुभारंभ" : "Launching of Mega Environmental Project"}
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white mb-3 font-bold max-w-3xl mx-auto">
            {t(hero.subtitle, locale)}
          </p>

          <p className="text-base sm:text-lg text-white/60 max-w-3xl mx-auto mb-4">
            {t(hero.tagline, locale)}
          </p>

          <div className="max-w-2xl mx-auto mb-8 px-4 py-3 rounded-xl border border-white/10" style={{ background: "rgba(255,255,255,0.05)" }}>
            <p className="text-xs sm:text-sm tracking-widest uppercase text-white/40 mb-1.5">
              {locale === "hi" ? "एक पहल" : "An initiative by"}
            </p>
            <p className="text-sm sm:text-base text-white/80 font-medium leading-relaxed">
              <a href="https://brahmavadini.org" target="_blank" rel="noopener noreferrer" className="text-white hover:text-amber-300 transition-colors border-b border-white/30 hover:border-amber-300 pb-px">
                {locale === "hi" ? "ब्रह्मवादिनी फाउंडेशन" : "Brahmavadini Foundation"}
              </a>
              <span className="mx-2 text-white/30">•</span>
              <a href="https://brahmavadini.in" target="_blank" rel="noopener noreferrer" className="text-white hover:text-amber-300 transition-colors border-b border-white/30 hover:border-amber-300 pb-px">
                {locale === "hi" ? "ब्रह्मवादिनी स्पिरिचुअल सर्विसेज प्रा. लि." : "Brahmavadini Spiritual Services Pvt. Ltd."}
              </a>
              <span className="mx-2 text-white/30">•</span>
              <a href="https://swamirupeshwaranand.in" target="_blank" rel="noopener noreferrer" className="text-white hover:text-amber-300 transition-colors border-b border-white/30 hover:border-amber-300 pb-px">
                {locale === "hi" ? "स्वामी रूपेश्वरानंद आश्रम" : "Swami Rupeshwaranand Ashram"}
              </a>
              <span className="mx-2 text-white/30">•</span>
              <a href="https://youth4nation.in" target="_blank" rel="noopener noreferrer" className="text-white hover:text-amber-300 transition-colors border-b border-white/30 hover:border-amber-300 pb-px">
                Youth4Nation
              </a>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <GoldenButton href="#stall-options" className="text-lg px-8 py-4">
              {t(hero.cta, locale)}
            </GoldenButton>
            <GoldenButton href={`tel:${PHONE_NUMBER}`} className="text-lg px-8 py-4">
              📞 {t(hero.ctaCall, locale)}
            </GoldenButton>
          </div>
        </Container>
      </section>

      {/* ═══ KEY BENEFITS (USPs) ═══ */}
      <section
        className="py-16 sm:py-20 md:py-24 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, var(--color-primary), #1a0a00)" }}
      >
        <LotusPattern />
        <Container className="relative z-10">
          <FadeUp>
            <div className="flex flex-col text-center items-center mb-12">
              <h2 className="font-heading text-3xl sm:text-4xl md:text-heading font-semibold mb-3 text-white">
                {t(keyBenefits.title, locale)}
              </h2>
              <p className="text-lg max-w-2xl text-white/70">
                {t(keyBenefits.subtitle, locale)}
              </p>
            </div>
          </FadeUp>
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-5xl mx-auto" stagger={0.15}>
            {keyBenefits.items.map((item, i) => (
              <StaggerCard key={i}>
                <div
                  className="relative rounded-2xl p-6 sm:p-8 border border-white/10 backdrop-blur-sm transition-all duration-300 hover:border-white/25 hover:shadow-[0_8px_30px_rgba(234,179,8,0.15)]"
                  style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))" }}
                >
                  <div className="flex items-start gap-4">
                    <IconPop delay={i * 0.08} className="text-4xl sm:text-5xl shrink-0">{item.icon}</IconPop>
                    <div>
                      <ScalePop delay={0.1 + i * 0.08}>
                        <div
                          className="font-heading text-2xl sm:text-3xl font-bold mb-1"
                          style={{ color: "var(--color-gold)" }}
                        >
                          {t(item.value, locale)}
                        </div>
                      </ScalePop>
                      <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                        {t(item.title, locale)}
                      </h3>
                      <p className="text-sm sm:text-base text-white/60">
                        {t(item.desc, locale)}
                      </p>
                    </div>
                  </div>
                </div>
              </StaggerCard>
            ))}
          </StaggerContainer>
        </Container>
      </section>

      <SacredDivider icon="🙏" />

      {/* ═══ WHO WILL BE THE PARTICIPANTS ═══ */}
      <section
        className="py-16 sm:py-20 md:py-24 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, var(--color-primary), #1a0a00)" }}
      >
        <LotusPattern />
        <Container className="relative z-10">
          <FadeUp>
            <div className="flex flex-col text-center items-center mb-12">
              <h2 className="font-heading text-3xl sm:text-4xl md:text-heading font-semibold mb-3 text-white">
                {t(participants.title, locale)}
              </h2>
              <p className="text-lg max-w-2xl text-white/70">
                {t(participants.subtitle, locale)}
              </p>
            </div>
          </FadeUp>
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-5xl mx-auto" stagger={0.15}>
            {participants.categories.map((cat, i) => (
              <StaggerCard key={i}>
                <div
                  className="relative rounded-2xl p-6 sm:p-8 border border-white/10 backdrop-blur-sm transition-all duration-300 hover:border-white/25 hover:shadow-[0_8px_30px_rgba(234,179,8,0.15)] h-full flex flex-col"
                  style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))" }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <IconPop delay={i * 0.08} className="text-4xl sm:text-5xl shrink-0">{cat.icon}</IconPop>
                    <span
                      className="text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full"
                      style={{ backgroundColor: "rgba(234,179,8,0.15)", color: "var(--color-gold)", border: "1px solid rgba(234,179,8,0.3)" }}
                    >
                      {t(cat.tag, locale)}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-white mb-3">
                    {t(cat.title, locale)}
                  </h3>
                  <ul className="text-sm sm:text-base space-y-2 mb-4 flex-1 text-white/60">
                    {cat.points.map((p, j) => (
                      <li key={j} className="flex items-start gap-2">
                        <span className="mt-0.5" style={{ color: "var(--color-gold)" }}>✦</span>
                        <span>{t(p, locale)}</span>
                      </li>
                    ))}
                  </ul>
                  <p
                    className="text-sm font-semibold italic mt-auto pt-3 border-t border-white/10"
                    style={{ color: "var(--color-gold)" }}
                  >
                    &ldquo;{t(cat.tagline, locale)}&rdquo;
                  </p>
                </div>
              </StaggerCard>
            ))}
          </StaggerContainer>
        </Container>
      </section>

      <SacredDivider icon="✦" />

      {/* ═══ SECTION 2: WHY PARTICIPATE ═══ */}
      <section className="py-16 sm:py-20 md:py-24">
        <Container>
          <FadeUp>
            <SectionHeading
              title={t(whyParticipate.title, locale)}
              subtitle={t(whyParticipate.subtitle, locale)}
            />
          </FadeUp>
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6" stagger={0.12}>
            {whyParticipate.benefits.map((b, i) => (
              <StaggerCard key={i}>
                <SacredCard>
                  <div className="text-center">
                    <IconPop className="text-4xl mb-4 block">{b.icon}</IconPop>
                    <h3
                      className="font-heading text-lg font-semibold mb-2"
                      style={{ color: "var(--color-primary)" }}
                    >
                      {t(b.title, locale)}
                    </h3>
                    <p className="text-sm" style={{ color: "var(--color-muted)" }}>
                      {t(b.desc, locale)}
                    </p>
                  </div>
                </SacredCard>
              </StaggerCard>
            ))}
          </StaggerContainer>
        </Container>
      </section>

      <SacredDivider icon="✦" />

      {/* ═══ EXHIBITION STALL SHOWCASE ═══ */}
      <section className="py-16 sm:py-20 md:py-24 relative overflow-hidden">
        <LotusPattern />
        <Container>
          <FadeUp>
            <SectionHeading
              title={locale === "hi" ? "हमारे स्टॉल डिज़ाइन" : "Our Stall Designs"}
              subtitle={locale === "hi"
                ? "ब्रह्मवादिनी फाउंडेशन के विभिन्न प्रदर्शनी स्टॉल डिज़ाइन देखें"
                : "Explore the various exhibition stall designs by Brahmavadini Foundation"}
            />
          </FadeUp>
          <div className="mt-8 sm:mt-12">
            <StallCarousel locale={locale} />
          </div>
        </Container>
      </section>

      <SacredDivider icon="✦" />

      {/* ═══ SECTION 3: PARTICIPATION OPTIONS ═══ */}
      <section
        id="stall-options"
        className="py-16 sm:py-20 md:py-24 relative scroll-mt-20"
        style={{ backgroundColor: "var(--color-secondary)" }}
      >
        <Container>
          <FadeUp>
            <SectionHeading
              title={t(participationOptions.title, locale)}
              subtitle={t(participationOptions.subtitle, locale)}
            />
          </FadeUp>

          {participationOptions.categories.map((cat) => (
            <div key={cat.id} className="mb-16 last:mb-0">
              {/* Category Header */}
              <FadeUp y={40}>
                <div className="text-center mb-8">
                  <span className="text-4xl mb-2 block">{cat.icon}</span>
                  <h3
                    className="font-heading text-2xl sm:text-3xl font-bold mb-2"
                    style={{ color: "var(--color-primary)" }}
                  >
                    {t(cat.name, locale)}
                  </h3>
                  <p className="text-sm sm:text-base max-w-2xl mx-auto" style={{ color: "var(--color-muted)" }}>
                    {t(cat.desc, locale)}
                  </p>
                </div>
              </FadeUp>

              {/* Category Banner Image */}
              {cat.id === "food-stall" && (
                <FadeUp delay={0.1}>
                  <div className="relative rounded-2xl overflow-hidden mb-8 max-w-3xl mx-auto aspect-[16/9]">
                    <img src="/images/food-stall.jpg" alt={locale === "hi" ? "राज्य खाद्य स्टॉल" : "State Food Stall"} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <p className="text-lg sm:text-xl font-bold drop-shadow-lg">
                        {locale === "hi" ? "₹50,000 से शुरू" : "Starting from ₹50,000"}
                      </p>
                    </div>
                  </div>
                </FadeUp>
              )}

              {/* Tier Cards */}
              <StaggerContainer
                className={`grid grid-cols-1 gap-6 ${
                  cat.tiers.length === 5 ? "sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5" :
                  cat.tiers.length === 4 ? "sm:grid-cols-2 lg:grid-cols-4" :
                  cat.tiers.length === 3 ? "md:grid-cols-3" :
                  "md:grid-cols-2"
                }`}
                stagger={0.15}
              >
                {cat.tiers.map((tier) => (
                  <TierCard
                    key={tier.id}
                    popular={tier.popular}
                    className={`relative bg-white dark:bg-zinc-800 rounded-xl shadow-sm border overflow-hidden flex flex-col h-full ${
                      tier.popular
                        ? "border-orange-300 dark:border-orange-700 ring-2 ring-orange-200 dark:ring-orange-800"
                        : "border-zinc-200 dark:border-zinc-700"
                    }`}
                  >
                    {tier.popular && (
                      <div
                        className="text-white text-center py-1.5 text-sm font-medium"
                        style={{ background: "linear-gradient(135deg, var(--color-gold), var(--color-accent))" }}
                      >
                        {locale === "en" ? "⭐ Recommended" : "⭐ अनुशंसित"}
                      </div>
                    )}
                    <div className="p-5 sm:p-6 flex flex-col h-full">
                      <h4 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">
                        {t(tier.name, locale)}
                      </h4>
                      <div className="mb-1">
                        <ScalePop>
                          <span className="text-2xl sm:text-3xl font-bold" style={{ color: "var(--color-primary)" }}>
                            {tier.price || t(tier.priceLabel, locale)}
                          </span>
                        </ScalePop>
                      </div>
                      {tier.price && (
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                          {t(tier.priceLabel, locale)}
                        </p>
                      )}
                      {!tier.price && <div className="mb-4" />}
                      <ul className="space-y-2 mb-6 flex-1">
                        {tier.features.map((f, j) => (
                          <li
                            key={j}
                            className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-300"
                          >
                            <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                            {t(f, locale)}
                          </li>
                        ))}
                      </ul>
                      <a
                        href="#book-stall"
                        className={`group/btn block w-full py-3 rounded-lg font-semibold text-center transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,0,0,0.15)] ${
                          tier.price ? "yagya-cta-btn" : "yagya-cta-btn-grey"
                        }`}
                        data-category={cat.id}
                        data-stall={tier.id}
                      >
                        {tier.price
                          ? (cat.id === "yajaman"
                              ? (locale === "en" ? "Join as Yagyaman" : "यज्ञमान बनें")
                              : (locale === "en" ? "Enquire Now" : "अभी पूछें"))
                          : (locale === "en" ? "Register Interest" : "रुचि दर्ज करें")}
                      </a>
                    </div>
                  </TierCard>
                ))}
              </StaggerContainer>
            </div>
          ))}
        </Container>
      </section>

      <SacredDivider icon="🔱" />

      {/* ═══ SECTION 4: EVENT HIGHLIGHTS ═══ */}
      <section className="py-16 sm:py-20 md:py-24">
        <Container>
          <FadeUp>
            <SectionHeading title={t(highlights.title, locale)} />
          </FadeUp>
          <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6" stagger={0.1}>
            {highlights.stats.map((stat, i) => (
              <StaggerCard key={i} hoverLift>
                <div
                  className="text-center p-4 sm:p-6 rounded-xl transition-colors duration-300 hover:border-[var(--color-gold)]"
                  style={{
                    backgroundColor: "var(--color-secondary)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  <ScalePop delay={i * 0.06}>
                    <div
                      className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold mb-1"
                      style={{ color: "var(--color-primary)" }}
                    >
                      {stat.value}
                    </div>
                  </ScalePop>
                  <div
                    className="text-xs sm:text-sm font-medium uppercase tracking-wide"
                    style={{ color: "var(--color-muted)" }}
                  >
                    {t(stat.label, locale)}
                  </div>
                </div>
              </StaggerCard>
            ))}
          </StaggerContainer>
        </Container>
      </section>

      <SacredDivider icon="ॐ" />

      {/* ═══ SECTION 5: TARGET AUDIENCE ═══ */}
      <section
        className="py-16 sm:py-20 md:py-24"
        style={{ backgroundColor: "var(--color-secondary)" }}
      >
        <Container>
          <FadeUp>
            <SectionHeading
              title={t(audience.title, locale)}
              subtitle={t(audience.subtitle, locale)}
            />
          </FadeUp>
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6" stagger={0.12}>
            {audience.segments.map((seg, i) => (
              <StaggerCard key={i} className="h-full">
                <SacredCard className="h-full">
                  <div className="text-center h-full flex flex-col items-center justify-start">
                    <IconPop className="text-3xl mb-3 block">{seg.icon}</IconPop>
                    <h3
                      className="font-heading text-lg font-semibold mb-2"
                      style={{ color: "var(--color-primary)" }}
                    >
                      {t(seg.title, locale)}
                    </h3>
                    <p className="text-sm" style={{ color: "var(--color-muted)" }}>
                      {t(seg.desc, locale)}
                    </p>
                  </div>
                </SacredCard>
              </StaggerCard>
            ))}
          </StaggerContainer>
        </Container>
      </section>

      <SacredDivider icon="🔥" />

      {/* ═══ SECTION 6: COUNTDOWN & URGENCY ═══ */}
      <section className="py-16 sm:py-20 md:py-24">
        <Container className="text-center">
          <FadeUp>
            <SectionHeading
              title={t(urgency.title, locale)}
              subtitle={t(urgency.subtitle, locale)}
            />
          </FadeUp>
          <ScalePop>
            <CountdownTimer eventDate={EVENT_DATE} locale={locale} />
          </ScalePop>
          <FadeUp delay={0.3}>
            <p
              className="mt-8 text-lg font-semibold animate-pulse"
              style={{ color: "var(--color-accent)" }}
            >
              {t(urgency.stallsRemaining, locale)}
            </p>
            <p className="mt-2 text-sm" style={{ color: "var(--color-muted)" }}>
              {t(urgency.earlyBird, locale)}
            </p>
          </FadeUp>
        </Container>
      </section>

      <SacredDivider icon="📝" />

      {/* ═══ SECTION 7: LEAD CAPTURE FORM ═══ */}
      <section
        id="book-stall"
        className="py-16 sm:py-20 md:py-24 scroll-mt-20"
        style={{ backgroundColor: "var(--color-secondary)" }}
      >
        <Container>
          <FadeUp>
            <SectionHeading
              title={t(formSection.title, locale)}
              subtitle={t(formSection.subtitle, locale)}
            />
          </FadeUp>
          <div className="grid gap-8 lg:gap-12 lg:grid-cols-2">
            {/* Left: Why Book Now */}
            <FadeUp delay={0.1} className="space-y-6">
              <h3
                className="font-heading text-xl sm:text-2xl font-semibold"
                style={{ color: "var(--color-primary)" }}
              >
                {t(formSection.infoTitle, locale)}
              </h3>
              <ul className="space-y-3">
                {formSection.reasons.map((r, i) => (
                  <li
                    key={i}
                    className="text-base sm:text-lg"
                    style={{ color: "var(--color-muted)" }}
                  >
                    {t(r, locale)}
                  </li>
                ))}
              </ul>
              <div
                className="p-4 rounded-lg text-sm space-y-2"
                style={{
                  backgroundColor: "var(--color-background)",
                  border: "1px solid var(--color-border)",
                }}
              >
                <p className="font-semibold mb-3" style={{ color: "var(--color-primary)" }}>
                  {locale === "en" ? "Contact Details" : "संपर्क विवरण"}
                </p>
                <p className="font-medium" style={{ color: "var(--color-primary)" }}>
                  📞 <a href={`tel:${PHONE_NUMBER}`} className="hover:underline">Mo.No. {PHONE_NUMBER}</a>
                </p>
                <div>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 font-semibold text-white px-3 py-1.5 rounded-full text-sm transition-all hover:scale-105 hover:shadow-md"
                    style={{ backgroundColor: "#25D366" }}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    WhatsApp: +91-77180 75180
                  </a>
                </div>
                <p className="font-medium" style={{ color: "var(--color-primary)" }}>
                  ✉️ <a href={`mailto:${EMAIL_ADDRESS}`} className="hover:underline">{EMAIL_ADDRESS}</a>
                </p>
                <p className="font-medium" style={{ color: "var(--color-primary)" }}>
                  ✉️ <a href={`mailto:${EMAIL_ADDRESS_2}`} className="hover:underline">{EMAIL_ADDRESS_2}</a>
                </p>
              </div>
            </FadeUp>

            {/* Right: Lead Form */}
            <SlideRight delay={0.2}>
              <div
                className="bg-white dark:bg-zinc-800 rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-sm border border-zinc-100 dark:border-zinc-700"
              >
                <LeadForm locale={locale} />
              </div>
            </SlideRight>
          </div>
        </Container>
      </section>

      <SacredDivider icon="🙏" />

      {/* ═══ SECTION 8: TRUST SIGNALS ═══ */}
      <section className="py-16 sm:py-20 md:py-24">
        <Container>
          <FadeUp>
            <SectionHeading title={t(trust.title, locale)} />
          </FadeUp>
          <FadeUp delay={0.15}>
            <div className="max-w-3xl mx-auto text-center mb-10">
              <div className="flex justify-center mb-6">
                <div
                  className="relative w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 rounded-full overflow-hidden shadow-xl"
                  style={{ border: "5px solid var(--color-gold)" }}
                >
                  <img
                    src="/images/swamiji-portrait.jpg"
                    alt={t(trust.orgName, locale)}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <h3
                className="font-heading text-2xl font-semibold mb-4"
                style={{ color: "var(--color-primary)" }}
              >
                {t(trust.orgName, locale)}
              </h3>
              <p className="text-base leading-relaxed" style={{ color: "var(--color-muted)" }}>
                {t(trust.orgDesc, locale)}
              </p>
            </div>
          </FadeUp>
          <FadeUp delay={0.3}>
            <div className="max-w-2xl mx-auto">
              <QuoteBlock
                quote={t(trust.quote, locale)}
                author={t(trust.quoteAuthor, locale)}
              />
            </div>
          </FadeUp>
        </Container>
      </section>

      {/* ═══ CMS EDITABLE CONTENT ═══ */}
      {/* Editors can add/edit content blocks via CMS with page slug "maha-yagya" */}
      <section className="py-16 sm:py-20 md:py-24" style={{ backgroundColor: "var(--color-secondary)" }}>
        <Container>
          <CMSTextBlocks
            pageSlug="maha-yagya"
            locale={locale}
            fallbackSections={cmsFallbackSections}
          />
        </Container>
      </section>

      {/* ═══ SECTION 9: FINAL CTA ═══ */}
      <section
        className="py-16 sm:py-20 md:py-24 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, var(--color-primary), #1a0a00)",
        }}
      >
        <LotusPattern />
        <Container className="relative z-10 text-center">
          <FadeUp>
            <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
              {t(finalCTA.title, locale)}
            </h2>
            <p className="text-lg text-white/70 max-w-2xl mx-auto mb-8">
              {t(finalCTA.subtitle, locale)}
            </p>
          </FadeUp>

          <ScalePop delay={0.2}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <GoldenButton href="#stall-options" className="text-lg px-8 py-4">
                {t(hero.cta, locale)}
              </GoldenButton>
            </div>
          </ScalePop>

          <FadeUp delay={0.35}>
            <div className="flex flex-wrap items-center justify-center gap-4 text-white/80 text-sm sm:text-base">
              <a href={`tel:${PHONE_NUMBER}`} className="hover:text-white transition-colors">
                📞 {PHONE_NUMBER}
              </a>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-semibold text-white px-4 py-2 rounded-full transition-all hover:scale-105 hover:shadow-lg"
                style={{ backgroundColor: "#25D366" }}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                WhatsApp
              </a>
              <a href={`mailto:${EMAIL_ADDRESS}`} className="hover:text-white transition-colors">
                ✉️ {EMAIL_ADDRESS}
              </a>
              <a href={`mailto:${EMAIL_ADDRESS_2}`} className="hover:text-white transition-colors">
                ✉️ {EMAIL_ADDRESS_2}
              </a>
            </div>
          </FadeUp>
        </Container>
      </section>

      {/* ═══ FLOATING WHATSAPP & CALL BUTTONS ═══ */}
      <div className="fixed bottom-4 right-2 sm:bottom-6 sm:right-4 md:right-6 z-50 flex flex-col gap-2 sm:gap-3">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform"
          style={{ backgroundColor: "#25D366" }}
          aria-label="WhatsApp"
        >
          <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </a>
        <a
          href={`tel:${PHONE_NUMBER}`}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform"
          style={{ backgroundColor: "#3B82F6" }}
          aria-label="Call"
        >
          <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        </a>
      </div>
    </div>
  );
}
