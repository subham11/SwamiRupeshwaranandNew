import type { Metadata } from "next";
import type { AppLocale } from "@/i18n/config";
import { Container } from "@/components/ui/Container";
import { getPageContent, PAGE_IDS, t } from "@/content/contentProvider";
import CMSTextBlocks from "@/components/CMSTextBlocks";

// Generate metadata for SEO
export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ locale: AppLocale }> 
}): Promise<Metadata> {
  const { locale } = await params;
  
  const titles = {
    en: "About Swami Rupeshwaranand Ji - Spiritual Guide & Teacher",
    hi: "स्वामी रूपेश्वरानंद जी के बारे में - आध्यात्मिक गुरु और शिक्षक"
  };
  
  const descriptions = {
    en: "Learn about the life, teachings, and spiritual journey of Swami Rupeshwaranand Ji, a revered spiritual guide dedicated to spreading divine wisdom.",
    hi: "स्वामी रूपेश्वरानंद जी के जीवन, शिक्षाओं और आध्यात्मिक यात्रा के बारे में जानें, जो दिव्य ज्ञान फैलाने के लिए समर्पित एक पूजनीय आध्यात्मिक गुरु हैं।"
  };
  
  return {
    title: titles[locale],
    description: descriptions[locale],
  };
}

// Static page content (bilingual)
const pageData = {
  title: {
    en: "About Swami Rupeshwaranand Ji",
    hi: "स्वामी रूपेश्वरानंद जी के बारे में"
  },
  subtitle: {
    en: "A Life Dedicated to Spiritual Service",
    hi: "आध्यात्मिक सेवा को समर्पित जीवन"
  },
  sections: [
    {
      id: "early-life",
      title: {
        en: "Early Life & Calling",
        hi: "प्रारंभिक जीवन और आह्वान"
      },
      content: {
        en: "From an early age, Swami Rupeshwaranand Ji showed an extraordinary inclination towards spirituality and the quest for truth. His journey began in the sacred lands of India, where he spent years in deep meditation and study under the guidance of enlightened masters.",
        hi: "बचपन से ही, स्वामी रूपेश्वरानंद जी ने आध्यात्मिकता और सत्य की खोज के प्रति असाधारण झुकाव दिखाया। उनकी यात्रा भारत की पवित्र भूमि में शुरू हुई, जहां उन्होंने प्रबुद्ध गुरुओं के मार्गदर्शन में गहन ध्यान और अध्ययन में वर्षों बिताए।"
      }
    },
    {
      id: "teachings",
      title: {
        en: "Teachings & Philosophy",
        hi: "शिक्षाएं और दर्शन"
      },
      content: {
        en: "Swami Ji's teachings blend ancient Vedic wisdom with practical guidance for modern life. He emphasizes the importance of self-realization, selfless service (seva), and the cultivation of inner peace through meditation and devotion.",
        hi: "स्वामी जी की शिक्षाएं प्राचीन वैदिक ज्ञान को आधुनिक जीवन के लिए व्यावहारिक मार्गदर्शन के साथ मिलाती हैं। वे आत्म-साक्षात्कार, निःस्वार्थ सेवा (सेवा), और ध्यान और भक्ति के माध्यम से आंतरिक शांति की खेती के महत्व पर जोर देते हैं।"
      }
    },
    {
      id: "mission",
      title: {
        en: "Mission & Vision",
        hi: "मिशन और दृष्टि"
      },
      content: {
        en: "His mission is to help seekers from all walks of life discover their true spiritual nature and live a life of purpose, peace, and fulfillment. Through the ashram, he provides a sanctuary for spiritual growth and community service.",
        hi: "उनका मिशन सभी क्षेत्रों के साधकों को उनके सच्चे आध्यात्मिक स्वभाव की खोज करने और उद्देश्य, शांति और पूर्णता का जीवन जीने में मदद करना है। आश्रम के माध्यम से, वे आध्यात्मिक विकास और सामुदायिक सेवा के लिए एक अभयारण्य प्रदान करते हैं।"
      }
    }
  ]
};

export default async function SwamijiPage({ 
  params 
}: { 
  params: Promise<{ locale: AppLocale }> 
}) {
  const { locale } = await params;
  
  return (
    <div className="bg-gradient-to-b from-amber-50/50 to-white dark:from-zinc-900 dark:to-zinc-950">
      {/* Hero Section */}
      <section className="relative py-16 sm:py-20 md:py-24 overflow-hidden">
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, var(--color-gold) 1px, transparent 1px)`,
            backgroundSize: '30px 30px'
          }}
        />
        
        <Container className="relative z-10 text-center">
          <div 
            className="flex items-center justify-center gap-3 mb-4"
            style={{ color: 'var(--color-gold)' }}
          >
            <span className="h-px w-8 sm:w-12 bg-current" />
            <span className="text-2xl sm:text-3xl">🙏</span>
            <span className="h-px w-8 sm:w-12 bg-current" />
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-zinc-800 dark:text-zinc-100 mb-4">
            {t(pageData.title, locale)}
          </h1>
          
          <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
            {t(pageData.subtitle, locale)}
          </p>
        </Container>
      </section>
      
      {/* Content Sections */}
      <Container className="pb-16 sm:pb-20 md:pb-24">
        <div className="max-w-4xl mx-auto space-y-12 sm:space-y-16">
          {pageData.sections.map((section, index) => (
            <section 
              key={section.id}
              className={`${index !== 0 ? 'pt-8 sm:pt-12 border-t border-zinc-200 dark:border-zinc-800' : ''}`}
            >
              <h2 className="text-xl sm:text-2xl md:text-3xl font-heading font-semibold text-zinc-800 dark:text-zinc-100 mb-4 sm:mb-6">
                {t(section.title, locale)}
              </h2>
              <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {t(section.content, locale)}
              </p>
            </section>
          ))}

          {/* CMS-managed text blocks (added via Content Editor) */}
          <CMSTextBlocks pageSlug="swamiji" locale={locale} />
        </div>
      </Container>
    </div>
  );
}
