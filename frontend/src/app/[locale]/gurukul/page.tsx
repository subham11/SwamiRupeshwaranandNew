import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import type { AppLocale } from "@/i18n/config";
import { Container } from "@/components/ui/Container";
import { SacredDivider, SectionHeading } from "@/components/ui/Decorative";

// Generate metadata for SEO
export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ locale: AppLocale }> 
}): Promise<Metadata> {
  const { locale } = await params;
  
  const titles = {
    en: "One District One Gurukul - Swami Rupeshwaranand Ji Ashram",
    hi: "एक जिला एक गुरुकुल - स्वामी रूपेश्वरानंद जी आश्रम"
  };
  
  const descriptions = {
    en: "A visionary initiative to establish Gurukuls across every district, blending traditional Vedic education with contemporary learning.",
    hi: "हर जिले में गुरुकुल स्थापित करने की एक दूरदर्शी पहल, पारंपरिक वैदिक शिक्षा को समकालीन शिक्षा के साथ मिलाकर।"
  };
  
  return {
    title: titles[locale],
    description: descriptions[locale],
  };
}

// FUTURE: This content will come from API
const pageContent = {
  title: { 
    en: "One District One Gurukul", 
    hi: "एक जिला एक गुरुकुल" 
  },
  subtitle: { 
    en: "Reviving Ancient Wisdom Through Modern Education", 
    hi: "आधुनिक शिक्षा के माध्यम से प्राचीन ज्ञान का पुनरुद्धार" 
  },
  description: {
    en: "A visionary initiative to establish Gurukuls across every district, blending traditional Vedic education with contemporary learning to nurture spiritually grounded, morally upright, and intellectually capable citizens.",
    hi: "हर जिले में गुरुकुल स्थापित करने की एक दूरदर्शी पहल, पारंपरिक वैदिक शिक्षा को समकालीन शिक्षा के साथ मिलाकर आध्यात्मिक रूप से स्थापित, नैतिक रूप से सही और बौद्धिक रूप से सक्षम नागरिकों का पोषण करना।"
  },
  heroQuote: {
    en: "\"Education is the manifestation of the perfection already in man.\"",
    hi: "\"शिक्षा मनुष्य में पहले से मौजूद पूर्णता की अभिव्यक्ति है।\""
  },
  quoteAuthor: { en: "— Swami Vivekananda", hi: "— स्वामी विवेकानंद" }
};

const visionPoints = [
  {
    icon: "🕉️",
    title: { en: "Vedic Foundation", hi: "वैदिक आधार" },
    description: {
      en: "Rooted in the timeless wisdom of the Vedas, Upanishads, and ancient scriptures, providing students with a strong spiritual foundation.",
      hi: "वेदों, उपनिषदों और प्राचीन शास्त्रों के शाश्वत ज्ञान में निहित, छात्रों को एक मजबूत आध्यात्मिक आधार प्रदान करना।"
    }
  },
  {
    icon: "📚",
    title: { en: "Holistic Curriculum", hi: "समग्र पाठ्यक्रम" },
    description: {
      en: "Integration of Sanskrit, Yoga, Meditation, Arts, and modern subjects like Science, Mathematics, and Technology.",
      hi: "संस्कृत, योग, ध्यान, कला और विज्ञान, गणित और प्रौद्योगिकी जैसे आधुनिक विषयों का एकीकरण।"
    }
  },
  {
    icon: "🌱",
    title: { en: "Character Building", hi: "चरित्र निर्माण" },
    description: {
      en: "Emphasis on moral values, discipline, respect for elders, and service to society as core principles of education.",
      hi: "नैतिक मूल्यों, अनुशासन, बड़ों के प्रति सम्मान और समाज की सेवा पर शिक्षा के मूल सिद्धांतों के रूप में जोर।"
    }
  },
  {
    icon: "🏛️",
    title: { en: "Gurukul Environment", hi: "गुरुकुल वातावरण" },
    description: {
      en: "Residential learning in a serene, natural environment where students live with teachers and learn through direct experience.",
      hi: "शांत, प्राकृतिक वातावरण में आवासीय शिक्षा जहां छात्र शिक्षकों के साथ रहते हैं और प्रत्यक्ष अनुभव के माध्यम से सीखते हैं।"
    }
  }
];

const objectives = [
  {
    number: "01",
    title: { en: "Preserve Cultural Heritage", hi: "सांस्कृतिक विरासत को संरक्षित करें" },
    description: {
      en: "Safeguard and transmit India's rich spiritual and cultural heritage to future generations through systematic education.",
      hi: "व्यवस्थित शिक्षा के माध्यम से भारत की समृद्ध आध्यात्मिक और सांस्कृतिक विरासत को भावी पीढ़ियों तक सुरक्षित और संचारित करें।"
    }
  },
  {
    number: "02",
    title: { en: "Bridge Ancient & Modern", hi: "प्राचीन और आधुनिक का सेतु" },
    description: {
      en: "Create a harmonious blend of traditional Gurukul system with contemporary educational requirements and career opportunities.",
      hi: "पारंपरिक गुरुकुल प्रणाली को समकालीन शैक्षिक आवश्यकताओं और करियर के अवसरों के साथ सामंजस्यपूर्ण मिश्रण बनाएं।"
    }
  },
  {
    number: "03",
    title: { en: "Rural Empowerment", hi: "ग्रामीण सशक्तिकरण" },
    description: {
      en: "Bring quality spiritual education to rural areas, ensuring every child has access to transformative learning regardless of location.",
      hi: "ग्रामीण क्षेत्रों में गुणवत्तापूर्ण आध्यात्मिक शिक्षा लाएं, यह सुनिश्चित करते हुए कि हर बच्चे की स्थान की परवाह किए बिना परिवर्तनकारी शिक्षा तक पहुंच हो।"
    }
  },
  {
    number: "04",
    title: { en: "Self-Reliant Citizens", hi: "आत्मनिर्भर नागरिक" },
    description: {
      en: "Develop self-reliant individuals who can contribute positively to society while maintaining spiritual grounding and ethical values.",
      hi: "आत्मनिर्भर व्यक्तियों का विकास करें जो आध्यात्मिक आधार और नैतिक मूल्यों को बनाए रखते हुए समाज में सकारात्मक योगदान दे सकें।"
    }
  }
];

const curriculum = [
  { name: { en: "Sanskrit & Vedic Studies", hi: "संस्कृत और वैदिक अध्ययन" }, icon: "📜" },
  { name: { en: "Yoga & Meditation", hi: "योग और ध्यान" }, icon: "🧘" },
  { name: { en: "Ayurveda Basics", hi: "आयुर्वेद की मूल बातें" }, icon: "🌿" },
  { name: { en: "Mathematics & Science", hi: "गणित और विज्ञान" }, icon: "🔬" },
  { name: { en: "Arts & Music", hi: "कला और संगीत" }, icon: "🎨" },
  { name: { en: "Agriculture & Environment", hi: "कृषि और पर्यावरण" }, icon: "🌾" },
  { name: { en: "Life Skills", hi: "जीवन कौशल" }, icon: "💡" },
  { name: { en: "Computer & Technology", hi: "कंप्यूटर और प्रौद्योगिकी" }, icon: "💻" }
];

const stats = [
  { number: "100+", label: { en: "Districts Targeted", hi: "लक्षित जिले" } },
  { number: "10,000+", label: { en: "Students Envisioned", hi: "छात्र परिकल्पित" } },
  { number: "500+", label: { en: "Acharyas Required", hi: "आचार्य आवश्यक" } },
  { number: "∞", label: { en: "Lives to Transform", hi: "परिवर्तित जीवन" } }
];

export default async function GurukulPage({ 
  params 
}: { 
  params: Promise<{ locale: AppLocale }> 
}) {
  const { locale } = await params;

  return (
    <main style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Hero Section */}
      <section 
        className="relative py-16 sm:py-20 md:py-28 overflow-hidden"
        style={{ backgroundColor: 'var(--color-primary)' }}
      >
        {/* Sacred Pattern Background */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 30% 30%, #fff 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />
        
        <Container className="relative z-10 text-center">
          <div className="flex items-center justify-center gap-3 mb-4 text-white/80">
            <span className="h-px w-8 sm:w-12 bg-current" />
            <span className="text-xs sm:text-sm font-medium uppercase tracking-widest">
              {pageContent.subtitle[locale]}
            </span>
            <span className="h-px w-8 sm:w-12 bg-current" />
          </div>
          
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold mb-6 text-white">
            {pageContent.title[locale]}
          </h1>
          
          <p className="max-w-3xl mx-auto text-base sm:text-lg leading-relaxed mb-8 text-white/90">
            {pageContent.description[locale]}
          </p>

          {/* Quote */}
          <blockquote className="max-w-xl mx-auto italic text-lg sm:text-xl font-heading text-white/90">
            {pageContent.heroQuote[locale]}
            <footer className="mt-2 text-sm not-italic" style={{ color: 'var(--color-gold)' }}>
              {pageContent.quoteAuthor[locale]}
            </footer>
          </blockquote>

          {/* CTA Buttons */}
          <div className="flex flex-wrap justify-center gap-4 mt-10">
            <Link
              href={`/${locale}/contact`}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-md font-medium transition-all duration-300 hover:-translate-y-1"
              style={{ backgroundColor: 'var(--color-gold)', color: 'var(--color-foreground)' }}
            >
              {locale === "en" ? "Support This Initiative" : "इस पहल का समर्थन करें"}
            </Link>
            <Link
              href={`/${locale}/donation`}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-md font-medium border-2 border-white/50 text-white transition-all duration-300 hover:bg-white/10"
            >
              {locale === "en" ? "Donate Now" : "अभी दान करें"}
            </Link>
          </div>
        </Container>
      </section>

      {/* Stats Section */}
      <section className="py-12 sm:py-16" style={{ backgroundColor: 'var(--color-secondary)' }}>
        <Container>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div 
                  className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold mb-2"
                  style={{ color: 'var(--color-primary)' }}
                >
                  {stat.number}
                </div>
                <div 
                  className="text-sm sm:text-base"
                  style={{ color: 'var(--color-muted)' }}
                >
                  {stat.label[locale]}
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <SacredDivider icon="🕉️" />

      {/* Vision Section */}
      <section className="py-12 sm:py-16 md:py-20">
        <Container>
          <SectionHeading 
            title={locale === "en" ? "Our Vision" : "हमारी दृष्टि"}
            subtitle={locale === "en" ? "The pillars of Gurukul education" : "गुरुकुल शिक्षा के स्तंभ"}
          />

          <div className="grid gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-4 mt-12">
            {visionPoints.map((point, i) => (
              <div 
                key={i}
                className="p-6 rounded-2xl text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg bg-white"
                style={{ border: '1px solid var(--color-border)' }}
              >
                <div className="text-5xl mb-4">{point.icon}</div>
                <h3 
                  className="font-heading text-lg sm:text-xl font-semibold mb-3"
                  style={{ color: 'var(--color-primary)' }}
                >
                  {point.title[locale]}
                </h3>
                <p 
                  className="text-sm leading-relaxed"
                  style={{ color: 'var(--color-muted)' }}
                >
                  {point.description[locale]}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <SacredDivider icon="📿" />

      {/* Objectives Section */}
      <section 
        className="py-12 sm:py-16 md:py-20"
        style={{ backgroundColor: 'var(--color-secondary)' }}
      >
        <Container>
          <SectionHeading 
            title={locale === "en" ? "Key Objectives" : "मुख्य उद्देश्य"}
            subtitle={locale === "en" ? "What we aim to achieve" : "हम क्या हासिल करना चाहते हैं"}
          />

          <div className="grid gap-6 sm:gap-8 md:grid-cols-2 mt-12">
            {objectives.map((obj, i) => (
              <div 
                key={i}
                className="flex gap-4 sm:gap-6 p-6 rounded-xl bg-white transition-all duration-300 hover:shadow-lg"
                style={{ border: '1px solid var(--color-border)' }}
              >
                <div 
                  className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center font-heading text-lg sm:text-xl font-bold text-white"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  {obj.number}
                </div>
                <div>
                  <h3 
                    className="font-heading text-lg sm:text-xl font-semibold mb-2"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    {obj.title[locale]}
                  </h3>
                  <p 
                    className="text-sm sm:text-base leading-relaxed"
                    style={{ color: 'var(--color-muted)' }}
                  >
                    {obj.description[locale]}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <SacredDivider icon="✦" />

      {/* Curriculum Section */}
      <section className="py-12 sm:py-16 md:py-20">
        <Container>
          <SectionHeading 
            title={locale === "en" ? "Gurukul Curriculum" : "गुरुकुल पाठ्यक्रम"}
            subtitle={locale === "en" ? "A balanced blend of ancient and modern" : "प्राचीन और आधुनिक का संतुलित मिश्रण"}
          />

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 mt-12">
            {curriculum.map((subject, i) => (
              <div 
                key={i}
                className="p-4 sm:p-6 rounded-xl text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-md bg-white"
                style={{ border: '1px solid var(--color-border)' }}
              >
                <div className="text-3xl sm:text-4xl mb-3">{subject.icon}</div>
                <h4 
                  className="font-heading text-sm sm:text-base font-semibold"
                  style={{ color: 'var(--color-primary)' }}
                >
                  {subject.name[locale]}
                </h4>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <SacredDivider icon="🙏" />

      {/* Call to Action */}
      <section 
        className="py-12 sm:py-16 md:py-20"
        style={{ backgroundColor: 'var(--color-primary)' }}
      >
        <Container className="text-center">
          <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-semibold mb-4 text-white">
            {locale === "en" ? "Be Part of This Sacred Mission" : "इस पवित्र मिशन का हिस्सा बनें"}
          </h2>
          <p className="max-w-2xl mx-auto text-base sm:text-lg mb-8 text-white/90">
            {locale === "en" 
              ? "Your support can help establish Gurukuls across the nation, nurturing future generations with the light of dharma and knowledge. Join us in this noble endeavor."
              : "आपका समर्थन पूरे देश में गुरुकुल स्थापित करने में मदद कर सकता है, धर्म और ज्ञान के प्रकाश के साथ भावी पीढ़ियों का पोषण कर सकता है। इस महान प्रयास में हमारे साथ जुड़ें।"
            }
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href={`/${locale}/donation`}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-md font-medium transition-all duration-300 hover:-translate-y-1"
              style={{ backgroundColor: 'var(--color-gold)', color: 'var(--color-foreground)' }}
            >
              {locale === "en" ? "Contribute Now" : "अभी योगदान करें"}
            </Link>
            <Link
              href={`/${locale}/contact`}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-md font-medium border-2 border-white/50 text-white transition-all duration-300 hover:bg-white/10"
            >
              {locale === "en" ? "Get Involved" : "शामिल हों"}
            </Link>
          </div>
        </Container>
      </section>
    </main>
  );
}
