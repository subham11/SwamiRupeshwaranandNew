import type { Metadata } from "next";
import type { AppLocale } from "@/i18n/config";
import { Container } from "@/components/ui/Container";
import { t } from "@/content/contentProvider";
import CMSTextBlocks from "@/components/CMSTextBlocks";

// Generate metadata for SEO
export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ locale: AppLocale }> 
}): Promise<Metadata> {
  const { locale } = await params;
  
  const titles = {
    en: "Support Our Mission - Donate to the Ashram",
    hi: "हमारे मिशन का समर्थन करें - आश्रम को दान दें"
  };
  
  return {
    title: titles[locale],
  };
}

// Static page content (bilingual)
const pageData = {
  title: {
    en: "Support Our Mission",
    hi: "हमारे मिशन का समर्थन करें"
  },
  subtitle: {
    en: "Your contribution helps spread the light of knowledge",
    hi: "आपका योगदान ज्ञान की रोशनी फैलाने में मदद करता है"
  },
  description: {
    en: "Every donation, no matter the size, helps us continue our spiritual services, maintain the ashram, and support those in need. Your generosity enables us to spread divine wisdom and serve humanity.",
    hi: "हर दान, चाहे वह कितना भी हो, हमें अपनी आध्यात्मिक सेवाओं को जारी रखने, आश्रम का रखरखाव करने और जरूरतमंदों की सहायता करने में मदद करता है। आपकी उदारता हमें दैवी ज्ञान फैलाने और मानवता की सेवा करने में सक्षम बनाती है।"
  },
  purposes: [
    {
      id: "ashram",
      icon: "🏠",
      title: { en: "Ashram Maintenance", hi: "आश्रम रखरखाव" },
      description: { en: "Help maintain our sacred spaces", hi: "हमारे पवित्र स्थानों के रखरखाव में मदद करें" }
    },
    {
      id: "food",
      icon: "🍲",
      title: { en: "Anna Daan (Food)", hi: "अन्न दान" },
      description: { en: "Provide meals to devotees and visitors", hi: "भक्तों और आगंतुकों को भोजन प्रदान करें" }
    },
    {
      id: "education",
      icon: "📚",
      title: { en: "Vidya Daan (Education)", hi: "विद्या दान" },
      description: { en: "Support spiritual education programs", hi: "आध्यात्मिक शिक्षा कार्यक्रमों का समर्थन करें" }
    },
    {
      id: "seva",
      icon: "🙏",
      title: { en: "General Seva", hi: "सामान्य सेवा" },
      description: { en: "Support all ashram activities", hi: "सभी आश्रम गतिविधियों का समर्थन करें" }
    }
  ],
  bankDetails: {
    title: { en: "Bank Transfer Details", hi: "बैंक ट्रांसफर विवरण" },
    accountName: "Swami Rupeshwaranand Ji Ashram Trust",
    accountNumber: "XXXXXXXXXXXXXXXX",
    ifsc: "XXXXXXXXX",
    bankName: "Bank Name"
  },
  note: {
    en: "All donations are tax-deductible under Section 80G of the Income Tax Act.",
    hi: "सभी दान आयकर अधिनियम की धारा 80G के तहत कर कटौती योग्य हैं।"
  }
};

// Static fallback — only shown when CMS text blocks are not available
const fallbackSections = [
  {
    id: "description",
    title: { en: "Support Our Mission", hi: "हमारे मिशन का समर्थन करें" },
    content: {
      en: "Every donation, no matter the size, helps us continue our spiritual services, maintain the ashram, and support those in need. Your generosity enables us to spread divine wisdom and serve humanity.",
      hi: "हर दान, चाहे वह कितना भी हो, हमें अपनी आध्यात्मिक सेवाओं को जारी रखने, आश्रम का रखरखाव करने और जरूरतमंदों की सहायता करने में मदद करता है।"
    }
  },
  {
    id: "purposes",
    title: { en: "Ways to Contribute", hi: "योगदान के तरीके" },
    content: {
      en: "🏠 Ashram Maintenance — Help maintain our sacred spaces.\n🍲 Anna Daan (Food) — Provide meals to devotees and visitors.\n📚 Vidya Daan (Education) — Support spiritual education programs.\n🙏 General Seva — Support all ashram activities.",
      hi: "🏠 आश्रम रखरखाव — हमारे पवित्र स्थानों के रखरखाव में मदद करें।\n🍲 अन्न दान — भक्तों और आगंतुकों को भोजन प्रदान करें।\n📚 विद्या दान — आध्यात्मिक शिक्षा कार्यक्रमों का समर्थन करें।\n🙏 सामान्य सेवा — सभी आश्रम गतिविधियों का समर्थन करें।"
    }
  },
  {
    id: "bank-details",
    title: { en: "Bank Transfer Details", hi: "बैंक ट्रांसफर विवरण" },
    content: {
      en: "Account Name: Swami Rupeshwaranand Ji Ashram Trust\nAccount Number: XXXXXXXXXXXXXXXX\nIFSC Code: XXXXXXXXX\nBank Name: Bank Name\nAll donations are tax-deductible under Section 80G of the Income Tax Act.",
      hi: "खाते का नाम: Swami Rupeshwaranand Ji Ashram Trust\nखाता संख्या: XXXXXXXXXXXXXXXX\nIFSC कोड: XXXXXXXXX\nबैंक का नाम: Bank Name\nसभी दान आयकर अधिनियम की धारा 80G के तहत कर कटौती योग्य हैं।"
    }
  }
];

export default async function DonationPage({ 
  params 
}: { 
  params: Promise<{ locale: AppLocale }> 
}) {
  const { locale } = await params;
  
  return (
    <div className="bg-gradient-to-b from-amber-50/50 to-white dark:from-zinc-900 dark:to-zinc-950">
      {/* Hero Section */}
      <section className="relative py-16 sm:py-20 overflow-hidden">
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
            <span className="text-2xl sm:text-3xl">❤️</span>
            <span className="h-px w-8 sm:w-12 bg-current" />
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-zinc-800 dark:text-zinc-100 mb-4">
            {t(pageData.title, locale)}
          </h1>
          
          <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto mb-6">
            {t(pageData.subtitle, locale)}
          </p>
          
        </Container>
      </section>

      {/* CMS Text Blocks — editable content with fallback */}
      <Container className="pb-12 sm:pb-16">
        <div className="max-w-4xl mx-auto space-y-12 sm:space-y-16">
          <CMSTextBlocks 
            pageSlug="donation" 
            locale={locale} 
            fallbackSections={fallbackSections}
          />
        </div>
      </Container>
      
      {/* Donation Purposes */}
      <Container className="pb-12 sm:pb-16">
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {pageData.purposes.map((purpose) => (
            <div 
              key={purpose.id}
              className="bg-white dark:bg-zinc-800 rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-sm border border-zinc-100 dark:border-zinc-700 text-center hover:shadow-md transition-shadow"
            >
              <span className="text-4xl sm:text-5xl mb-4 block">{purpose.icon}</span>
              <h3 className="text-lg sm:text-xl font-semibold text-zinc-800 dark:text-zinc-100 mb-2">
                {t(purpose.title, locale)}
              </h3>
              <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
                {t(purpose.description, locale)}
              </p>
            </div>
          ))}
        </div>
      </Container>
      
      {/* Bank Details */}
      <Container className="pb-16 sm:pb-20 md:pb-24">
        <div className="max-w-2xl mx-auto bg-white dark:bg-zinc-800 rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-sm border border-zinc-100 dark:border-zinc-700">
          <h2 className="text-xl sm:text-2xl font-semibold text-zinc-800 dark:text-zinc-100 mb-6 text-center">
            {t(pageData.bankDetails.title, locale)}
          </h2>
          
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between py-3 border-b border-zinc-100 dark:border-zinc-700">
              <span className="font-medium text-zinc-600 dark:text-zinc-400">
                {locale === "en" ? "Account Name" : "खाते का नाम"}
              </span>
              <span className="text-zinc-800 dark:text-zinc-100">{pageData.bankDetails.accountName}</span>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:justify-between py-3 border-b border-zinc-100 dark:border-zinc-700">
              <span className="font-medium text-zinc-600 dark:text-zinc-400">
                {locale === "en" ? "Account Number" : "खाता संख्या"}
              </span>
              <span className="text-zinc-800 dark:text-zinc-100">{pageData.bankDetails.accountNumber}</span>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:justify-between py-3 border-b border-zinc-100 dark:border-zinc-700">
              <span className="font-medium text-zinc-600 dark:text-zinc-400">IFSC Code</span>
              <span className="text-zinc-800 dark:text-zinc-100">{pageData.bankDetails.ifsc}</span>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:justify-between py-3">
              <span className="font-medium text-zinc-600 dark:text-zinc-400">
                {locale === "en" ? "Bank Name" : "बैंक का नाम"}
              </span>
              <span className="text-zinc-800 dark:text-zinc-100">{pageData.bankDetails.bankName}</span>
            </div>
          </div>
          
          <p className="mt-6 text-sm text-center text-zinc-500 dark:text-zinc-500">
            {t(pageData.note, locale)}
          </p>
        </div>
      </Container>
    </div>
  );
}
