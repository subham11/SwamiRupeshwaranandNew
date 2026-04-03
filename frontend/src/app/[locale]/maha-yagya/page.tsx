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
import CountdownTimer from "./_components/CountdownTimer";
import LeadForm from "./_components/LeadForm";

// ─── Constants ───────────────────────────────────────────────
const EVENT_DATE = "2026-11-15T06:00:00+05:30"; // Update when confirmed
const WHATSAPP_NUMBER = "919876543210"; // Update with actual number
const PHONE_NUMBER = "+91-9876543210";
const EMAIL_ADDRESS = "yagya@swamirupeshwaranand.in";

// ─── Bilingual Content ──────────────────────────────────────

const hero = {
  badge: { en: "Limited Stalls Available", hi: "सीमित स्टॉल उपलब्ध" },
  title: {
    en: "108 Kundiya World Peace Maha Yagya & Health Expo 2026",
    hi: "108 कुंडीय विश्व शांति महायज्ञ एवं स्वास्थ्य एक्सपो 2026",
  },
  subtitle: {
    en: "Varanasi, Uttar Pradesh • November 2026",
    hi: "वाराणसी, उत्तर प्रदेश • नवंबर 2026",
  },
  cta: { en: "Book Your Stall Now", hi: "अभी अपना स्टॉल बुक करें" },
  ctaCall: { en: "Call Now", hi: "अभी कॉल करें" },
  tagline: {
    en: "A sacred confluence of spirituality, wellness & commerce — 50,000+ devotees, 7 divine days",
    hi: "अध्यात्म, स्वास्थ्य और व्यापार का पवित्र संगम — 50,000+ श्रद्धालु, 7 दिव्य दिन",
  },
};

const whyParticipate = {
  title: { en: "Why Participate?", hi: "क्यों भाग लें?" },
  subtitle: {
    en: "An unparalleled opportunity for brand visibility among a spiritually engaged, health-conscious audience",
    hi: "आध्यात्मिक और स्वास्थ्य-जागरूक दर्शकों के बीच ब्रांड की अद्वितीय पहचान का अवसर",
  },
  benefits: [
    { icon: "🏪", title: { en: "Brand Visibility", hi: "ब्रांड दृश्यता" }, desc: { en: "Showcase your products to 50,000+ visitors over 7 days", hi: "7 दिनों में 50,000+ आगंतुकों को अपने उत्पाद प्रदर्शित करें" } },
    { icon: "👥", title: { en: "Targeted Audience", hi: "लक्षित दर्शक" }, desc: { en: "Health-conscious families, spiritual seekers & wellness enthusiasts", hi: "स्वास्थ्य-जागरूक परिवार, आध्यात्मिक साधक और कल्याण प्रेमी" } },
    { icon: "📺", title: { en: "Media Coverage", hi: "मीडिया कवरेज" }, desc: { en: "National & regional media, live streaming, social media promotion", hi: "राष्ट्रीय और क्षेत्रीय मीडिया, लाइव स्ट्रीमिंग, सोशल मीडिया प्रचार" } },
    { icon: "🤝", title: { en: "Networking", hi: "नेटवर्किंग" }, desc: { en: "Connect with VIPs, government officials & industry leaders", hi: "VIP, सरकारी अधिकारियों और उद्योग जगत से जुड़ें" } },
    { icon: "🙏", title: { en: "Spiritual Merit", hi: "आध्यात्मिक लाभ" }, desc: { en: "Be part of a sacred 108 Kundiya Yagya — a rare spiritual event", hi: "108 कुंडीय महायज्ञ का हिस्सा बनें — एक दुर्लभ आध्यात्मिक आयोजन" } },
    { icon: "🏛️", title: { en: "Govt. Support", hi: "सरकारी सहयोग" }, desc: { en: "Supported by local administration and cultural bodies", hi: "स्थानीय प्रशासन और सांस्कृतिक संस्थाओं द्वारा समर्थित" } },
    { icon: "💚", title: { en: "CSR Opportunity", hi: "CSR अवसर" }, desc: { en: "Align your brand with wellness, peace & community service", hi: "अपने ब्रांड को कल्याण, शांति और समाज सेवा से जोड़ें" } },
    { icon: "🌍", title: { en: "Cultural Significance", hi: "सांस्कृतिक महत्व" }, desc: { en: "Varanasi — the spiritual capital of India, global recognition", hi: "वाराणसी — भारत की आध्यात्मिक राजधानी, वैश्विक पहचान" } },
  ],
};

const stallOptions = {
  title: { en: "Stall Options", hi: "स्टॉल विकल्प" },
  subtitle: {
    en: "Choose the perfect stall for your brand and budget",
    hi: "अपने ब्रांड और बजट के लिए सही स्टॉल चुनें",
  },
  tiers: [
    {
      id: "standard",
      name: { en: "Standard", hi: "स्टैंडर्ड" },
      price: "₹50,000",
      size: "10×10 ft",
      popular: false,
      features: [
        { en: "10×10 ft stall space", hi: "10×10 फ़ीट स्टॉल स्पेस" },
        { en: "Basic setup (table, chairs, backdrop)", hi: "बेसिक सेटअप (टेबल, कुर्सियां, बैकड्रॉप)" },
        { en: "Shared branding on event banner", hi: "इवेंट बैनर पर साझा ब्रांडिंग" },
        { en: "Event pass for 2 representatives", hi: "2 प्रतिनिधियों के लिए इवेंट पास" },
        { en: "Listing in event directory", hi: "इवेंट डायरेक्टरी में सूचीबद्ध" },
      ],
    },
    {
      id: "premium",
      name: { en: "Premium", hi: "प्रीमियम" },
      price: "₹1,00,000",
      size: "15×15 ft",
      popular: true,
      features: [
        { en: "15×15 ft premium location", hi: "15×15 फ़ीट प्रीमियम लोकेशन" },
        { en: "Custom-designed stall with branding", hi: "ब्रांडिंग सहित कस्टम-डिज़ाइन स्टॉल" },
        { en: "Individual banner & standee", hi: "व्यक्तिगत बैनर और स्टैंडी" },
        { en: "Electricity & lighting included", hi: "बिजली और लाइटिंग शामिल" },
        { en: "Event pass for 4 representatives", hi: "4 प्रतिनिधियों के लिए इवेंट पास" },
        { en: "Social media promotion", hi: "सोशल मीडिया प्रमोशन" },
      ],
    },
    {
      id: "prime",
      name: { en: "Prime", hi: "प्राइम" },
      price: "₹2,00,000",
      size: "20×20 ft",
      popular: false,
      features: [
        { en: "20×20 ft VIP zone placement", hi: "20×20 फ़ीट VIP ज़ोन प्लेसमेंट" },
        { en: "Fully customized stall with AC", hi: "AC सहित पूर्ण अनुकूलित स्टॉल" },
        { en: "Dedicated branding across venue", hi: "पूरे वेन्यू पर समर्पित ब्रांडिंग" },
        { en: "Priority placement near main stage", hi: "मुख्य मंच के पास प्राथमिकता प्लेसमेंट" },
        { en: "Event pass for 6 representatives", hi: "6 प्रतिनिधियों के लिए इवेंट पास" },
        { en: "Full media coverage & press mentions", hi: "पूर्ण मीडिया कवरेज और प्रेस उल्लेख" },
        { en: "VIP dinner invitation", hi: "VIP डिनर निमंत्रण" },
      ],
    },
  ],
};

const highlights = {
  title: { en: "Event Highlights", hi: "कार्यक्रम की मुख्य विशेषताएं" },
  stats: [
    { value: "108", label: { en: "Sacred Kunds", hi: "पवित्र कुंड" } },
    { value: "50,000+", label: { en: "Expected Footfall", hi: "अनुमानित उपस्थिति" } },
    { value: "7", label: { en: "Divine Days", hi: "दिव्य दिन" } },
    { value: "200+", label: { en: "Exhibition Stalls", hi: "प्रदर्शनी स्टॉल" } },
    { value: "100+", label: { en: "VIP Guests", hi: "VIP अतिथि" } },
    { value: "50+", label: { en: "Media Partners", hi: "मीडिया पार्टनर" } },
  ],
};

const audience = {
  title: { en: "Who Attends?", hi: "कौन आता है?" },
  subtitle: {
    en: "Your stall will be visited by a diverse, engaged audience",
    hi: "आपके स्टॉल पर विविध और सक्रिय दर्शक आएंगे",
  },
  segments: [
    { icon: "👨‍👩‍👧‍👦", title: { en: "Health-Conscious Families", hi: "स्वास्थ्य-जागरूक परिवार" }, desc: { en: "Families seeking wellness products & Ayurvedic solutions", hi: "कल्याण उत्पाद और आयुर्वेदिक समाधान खोजने वाले परिवार" } },
    { icon: "🙏", title: { en: "Spiritual Seekers", hi: "आध्यात्मिक साधक" }, desc: { en: "Devotees and spiritual practitioners from across India", hi: "पूरे भारत से भक्त और आध्यात्मिक साधक" } },
    { icon: "🧘", title: { en: "Yoga & Ayurveda Enthusiasts", hi: "योग और आयुर्वेद प्रेमी" }, desc: { en: "Practitioners interested in holistic health", hi: "समग्र स्वास्थ्य में रुचि रखने वाले साधक" } },
    { icon: "🏢", title: { en: "Business & FMCG Brands", hi: "व्यवसाय और FMCG ब्रांड" }, desc: { en: "Companies looking for high-visibility promotion", hi: "उच्च दृश्यता प्रचार खोजने वाली कंपनियां" } },
    { icon: "✈️", title: { en: "Tourists & NRIs", hi: "पर्यटक और NRI" }, desc: { en: "Domestic & international visitors to Varanasi", hi: "वाराणसी के घरेलू और अंतरराष्ट्रीय पर्यटक" } },
    { icon: "🏛️", title: { en: "Govt. Officials & Dignitaries", hi: "सरकारी अधिकारी और गणमान्य" }, desc: { en: "Local administration and cultural leaders", hi: "स्थानीय प्रशासन और सांस्कृतिक नेता" } },
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
  title: { en: "Book Your Stall", hi: "अपना स्टॉल बुक करें" },
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
  title: { en: "Organized By", hi: "आयोजक" },
  orgName: { en: "Swami Rupeshwaranand Ji Maharaj Ashram", hi: "स्वामी रूपेश्वरानंद जी महाराज आश्रम" },
  orgDesc: {
    en: "With decades of experience organizing large-scale spiritual events, yagyas, and community gatherings across India, the ashram is committed to preserving Vedic traditions while creating meaningful platforms for cultural and commercial exchange.",
    hi: "पूरे भारत में बड़े पैमाने पर आध्यात्मिक कार्यक्रमों, यज्ञों और सामुदायिक सभाओं के आयोजन के दशकों के अनुभव के साथ, आश्रम वैदिक परंपराओं को संरक्षित करते हुए सांस्कृतिक और व्यावसायिक आदान-प्रदान के लिए सार्थक मंच बनाने के लिए प्रतिबद्ध है।",
  },
  quote: {
    en: "This Maha Yagya is not just a spiritual event — it is a movement for world peace, holistic health, and cultural unity.",
    hi: "यह महायज्ञ सिर्फ एक आध्यात्मिक आयोजन नहीं है — यह विश्व शांति, समग्र स्वास्थ्य और सांस्कृतिक एकता का आंदोलन है।",
  },
  quoteAuthor: { en: "Swami Rupeshwaranand Ji Maharaj", hi: "स्वामी रूपेश्वरानंद जी महाराज" },
};

const finalCTA = {
  title: { en: "Don't Miss This Opportunity!", hi: "इस अवसर को न चूकें!" },
  subtitle: {
    en: "Join 200+ exhibitors at India's largest spiritual & wellness expo in the holy city of Varanasi",
    hi: "पवित्र वाराणसी में भारत के सबसे बड़े आध्यात्मिक और स्वास्थ्य एक्सपो में 200+ प्रदर्शकों से जुड़ें",
  },
  callLabel: { en: "Call Us", hi: "कॉल करें" },
  emailLabel: { en: "Email Us", hi: "ईमेल करें" },
  whatsappLabel: { en: "WhatsApp", hi: "व्हाट्सएप" },
};

const floating = {
  whatsappMsg: {
    en: "Hi, I'm interested in booking a stall at the 108 Kundiya Maha Yagya & Health Expo 2026 in Varanasi. Please share details.",
    hi: "नमस्ते, मैं वाराणसी में 108 कुंडीय महायज्ञ एवं स्वास्थ्य एक्सपो 2026 में स्टॉल बुक करने में रुचि रखता/रखती हूं। कृपया विवरण साझा करें।",
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
    en: "108 Kundiya World Peace Maha Yagya & Health Expo 2026 — Book Your Stall",
    hi: "108 कुंडीय विश्व शांति महायज्ञ एवं स्वास्थ्य एक्सपो 2026 — अपना स्टॉल बुक करें",
  };

  const descriptions: Record<AppLocale, string> = {
    en: "Book your exhibition stall at the 108 Kundiya World Peace Maha Yagya & Health Expo 2026 in Varanasi. 50,000+ visitors, 7 days, 200+ stalls. Standard ₹50K, Premium ₹1L, Prime ₹2L.",
    hi: "वाराणसी में 108 कुंडीय विश्व शांति महायज्ञ एवं स्वास्थ्य एक्सपो 2026 में अपना प्रदर्शनी स्टॉल बुक करें। 50,000+ आगंतुक, 7 दिन, 200+ स्टॉल।",
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
            name: "108 Kundiya World Peace Maha Yagya & Health Expo 2026",
            description: t(hero.tagline, "en"),
            startDate: EVENT_DATE,
            endDate: "2026-11-21T20:00:00+05:30",
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
              url: "https://swamirupeshwaranand.in",
            },
            offers: stallOptions.tiers.map((tier) => ({
              "@type": "Offer",
              name: tier.name.en,
              price: tier.price.replace(/[₹,]/g, ""),
              priceCurrency: "INR",
              availability: "https://schema.org/InStock",
            })),
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

          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
            {t(hero.title, locale)}
          </h1>

          <p className="text-lg sm:text-xl text-white/80 mb-3 font-medium">
            {t(hero.subtitle, locale)}
          </p>

          <p className="text-base sm:text-lg text-white/60 max-w-3xl mx-auto mb-8">
            {t(hero.tagline, locale)}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <GoldenButton href="#book-stall" className="text-lg px-8 py-4">
              {t(hero.cta, locale)}
            </GoldenButton>
            <a
              href={`tel:${PHONE_NUMBER}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-md font-medium text-white border border-white/30 hover:bg-white/10 transition-colors"
            >
              📞 {t(hero.ctaCall, locale)}
            </a>
          </div>
        </Container>
      </section>

      <SacredDivider icon="🙏" />

      {/* ═══ SECTION 2: WHY PARTICIPATE ═══ */}
      <section className="py-16 sm:py-20 md:py-24">
        <Container>
          <SectionHeading
            title={t(whyParticipate.title, locale)}
            subtitle={t(whyParticipate.subtitle, locale)}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {whyParticipate.benefits.map((b, i) => (
              <SacredCard key={i}>
                <div className="text-center">
                  <span className="text-4xl mb-4 block">{b.icon}</span>
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
            ))}
          </div>
        </Container>
      </section>

      <SacredDivider icon="✦" />

      {/* ═══ SECTION 3: STALL OPTIONS ═══ */}
      <section
        className="py-16 sm:py-20 md:py-24 relative"
        style={{ backgroundColor: "var(--color-secondary)" }}
      >
        <Container>
          <SectionHeading
            title={t(stallOptions.title, locale)}
            subtitle={t(stallOptions.subtitle, locale)}
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stallOptions.tiers.map((tier) => (
              <div
                key={tier.id}
                className={`relative bg-white dark:bg-zinc-800 rounded-xl shadow-sm border overflow-hidden transition-all duration-200 hover:shadow-md ${
                  tier.popular
                    ? "border-orange-300 dark:border-orange-700 md:scale-105 md:-my-2 z-10"
                    : "border-zinc-200 dark:border-zinc-700"
                }`}
              >
                {tier.popular && (
                  <div
                    className="text-white text-center py-1.5 text-sm font-medium"
                    style={{ background: "linear-gradient(135deg, var(--color-gold), var(--color-accent))" }}
                  >
                    {locale === "en" ? "⭐ Most Popular" : "⭐ सबसे लोकप्रिय"}
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-1">
                    {t(tier.name, locale)}
                  </h3>
                  <div className="mb-1">
                    <span className="text-3xl font-bold text-zinc-900 dark:text-white">
                      {tier.price}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                    {tier.size}
                  </p>
                  <ul className="space-y-2 mb-6">
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
                    onClick={undefined}
                    className={`block w-full py-3 rounded-lg font-medium text-center transition-colors ${
                      tier.popular
                        ? "text-white hover:brightness-110"
                        : "border-2 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                    }`}
                    style={
                      tier.popular
                        ? { background: "linear-gradient(135deg, var(--color-gold), var(--color-accent))" }
                        : { borderColor: "var(--color-accent)", color: "var(--color-accent)" }
                    }
                    data-stall={tier.id}
                  >
                    {t(hero.cta, locale)}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <SacredDivider icon="🔱" />

      {/* ═══ SECTION 4: EVENT HIGHLIGHTS ═══ */}
      <section className="py-16 sm:py-20 md:py-24">
        <Container>
          <SectionHeading title={t(highlights.title, locale)} />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
            {highlights.stats.map((stat, i) => (
              <div
                key={i}
                className="text-center p-4 sm:p-6 rounded-xl"
                style={{
                  backgroundColor: "var(--color-secondary)",
                  border: "1px solid var(--color-border)",
                }}
              >
                <div
                  className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold mb-1"
                  style={{ color: "var(--color-primary)" }}
                >
                  {stat.value}
                </div>
                <div
                  className="text-xs sm:text-sm font-medium uppercase tracking-wide"
                  style={{ color: "var(--color-muted)" }}
                >
                  {t(stat.label, locale)}
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <SacredDivider icon="ॐ" />

      {/* ═══ SECTION 5: TARGET AUDIENCE ═══ */}
      <section
        className="py-16 sm:py-20 md:py-24"
        style={{ backgroundColor: "var(--color-secondary)" }}
      >
        <Container>
          <SectionHeading
            title={t(audience.title, locale)}
            subtitle={t(audience.subtitle, locale)}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {audience.segments.map((seg, i) => (
              <SacredCard key={i}>
                <div className="text-center">
                  <span className="text-3xl mb-3 block">{seg.icon}</span>
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
            ))}
          </div>
        </Container>
      </section>

      <SacredDivider icon="🔥" />

      {/* ═══ SECTION 6: COUNTDOWN & URGENCY ═══ */}
      <section className="py-16 sm:py-20 md:py-24">
        <Container className="text-center">
          <SectionHeading
            title={t(urgency.title, locale)}
            subtitle={t(urgency.subtitle, locale)}
          />
          <CountdownTimer eventDate={EVENT_DATE} locale={locale} />
          <p
            className="mt-8 text-lg font-semibold animate-pulse"
            style={{ color: "var(--color-accent)" }}
          >
            {t(urgency.stallsRemaining, locale)}
          </p>
          <p className="mt-2 text-sm" style={{ color: "var(--color-muted)" }}>
            {t(urgency.earlyBird, locale)}
          </p>
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
          <SectionHeading
            title={t(formSection.title, locale)}
            subtitle={t(formSection.subtitle, locale)}
          />
          <div className="grid gap-8 lg:gap-12 lg:grid-cols-2">
            {/* Left: Why Book Now */}
            <div className="space-y-6">
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
                className="p-4 rounded-lg text-sm"
                style={{
                  backgroundColor: "var(--color-background)",
                  border: "1px solid var(--color-border)",
                }}
              >
                <p style={{ color: "var(--color-muted)" }}>
                  {locale === "en"
                    ? "Or reach us directly:"
                    : "या सीधे संपर्क करें:"}
                </p>
                <p className="mt-2 font-medium" style={{ color: "var(--color-primary)" }}>
                  📞 <a href={`tel:${PHONE_NUMBER}`} className="hover:underline">{PHONE_NUMBER}</a>
                </p>
                <p className="font-medium" style={{ color: "var(--color-primary)" }}>
                  ✉️ <a href={`mailto:${EMAIL_ADDRESS}`} className="hover:underline">{EMAIL_ADDRESS}</a>
                </p>
                <p className="font-medium" style={{ color: "var(--color-primary)" }}>
                  💬{" "}
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    WhatsApp
                  </a>
                </p>
              </div>
            </div>

            {/* Right: Lead Form */}
            <div
              className="bg-white dark:bg-zinc-800 rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-sm border border-zinc-100 dark:border-zinc-700"
            >
              <LeadForm locale={locale} />
            </div>
          </div>
        </Container>
      </section>

      <SacredDivider icon="🙏" />

      {/* ═══ SECTION 8: TRUST SIGNALS ═══ */}
      <section className="py-16 sm:py-20 md:py-24">
        <Container>
          <SectionHeading title={t(trust.title, locale)} />
          <div className="max-w-3xl mx-auto text-center mb-10">
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
          <div className="max-w-2xl mx-auto">
            <QuoteBlock
              quote={t(trust.quote, locale)}
              author={t(trust.quoteAuthor, locale)}
            />
          </div>
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
          <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            {t(finalCTA.title, locale)}
          </h2>
          <p className="text-lg text-white/70 max-w-2xl mx-auto mb-8">
            {t(finalCTA.subtitle, locale)}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <GoldenButton href="#book-stall" className="text-lg px-8 py-4">
              {t(hero.cta, locale)}
            </GoldenButton>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-white/80 text-sm sm:text-base">
            <a href={`tel:${PHONE_NUMBER}`} className="hover:text-white transition-colors">
              📞 {t(finalCTA.callLabel, locale)}: {PHONE_NUMBER}
            </a>
            <a href={`mailto:${EMAIL_ADDRESS}`} className="hover:text-white transition-colors">
              ✉️ {t(finalCTA.emailLabel, locale)}: {EMAIL_ADDRESS}
            </a>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              💬 {t(finalCTA.whatsappLabel, locale)}
            </a>
          </div>
        </Container>
      </section>

      {/* ═══ FLOATING WHATSAPP & CALL BUTTONS ═══ */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
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
