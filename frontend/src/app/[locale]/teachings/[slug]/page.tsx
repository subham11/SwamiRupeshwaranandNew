import type { AppLocale } from "@/i18n/config";
import { Container } from "@/components/ui/Container";
import { notFound } from "next/navigation";
import Link from "next/link";

// Teaching content - FUTURE: Fetch from API by slug
const teachings: Record<string, {
  icon: string;
  title: { en: string; hi: string };
  description: { en: string; hi: string };
  content: { en: string; hi: string };
}> = {
  "inner-peace": {
    icon: "🙏",
    title: { en: "Path to Inner Peace", hi: "आंतरिक शांति का मार्ग" },
    description: {
      en: "Discover ancient techniques for finding tranquility in the modern world.",
      hi: "आधुनिक दुनिया में शांति पाने की प्राचीन तकनीकें खोजें।"
    },
    content: {
      en: `In the hustle of modern life, finding inner peace seems like a distant dream. Swami Ji teaches that peace is not something external to be found, but an internal state to be uncovered.

Through daily meditation practice, mindful breathing, and conscious living, we can peel away the layers of stress and anxiety that cloud our natural state of serenity.

The path to inner peace begins with understanding that true happiness comes from within. When we stop seeking validation and fulfillment from external sources, we begin to discover the infinite reservoir of peace that resides in our hearts.

Swami Ji recommends starting with just 10 minutes of silent meditation each morning. Sit comfortably, close your eyes, and simply observe your breath. Don't try to control it—just witness. This simple practice, done consistently, can transform your relationship with yourself and the world around you.`,
      hi: `आधुनिक जीवन की भागदौड़ में, आंतरिक शांति पाना एक दूर का सपना लगता है। स्वामी जी सिखाते हैं कि शांति कोई बाहरी चीज़ नहीं है जो खोजी जाए, बल्कि यह एक आंतरिक अवस्था है जिसे उजागर किया जाना है।

दैनिक ध्यान अभ्यास, सचेत श्वास और जागरूक जीवन के माध्यम से, हम तनाव और चिंता की उन परतों को हटा सकते हैं जो हमारी प्राकृतिक शांति की स्थिति को ढक देती हैं।

आंतरिक शांति का मार्ग यह समझने से शुरू होता है कि सच्चा सुख भीतर से आता है। जब हम बाहरी स्रोतों से मान्यता और पूर्णता की तलाश बंद कर देते हैं, तो हम अपने हृदय में निवास करने वाले शांति के अनंत भंडार की खोज शुरू करते हैं।

स्वामी जी हर सुबह केवल 10 मिनट के मौन ध्यान से शुरू करने की सलाह देते हैं। आराम से बैठें, आंखें बंद करें और बस अपनी सांस को देखें। इसे नियंत्रित करने की कोशिश न करें—बस साक्षी बनें।`
    }
  },
  "mantras": {
    icon: "📿",
    title: { en: "Power of Mantras", hi: "मंत्रों की शक्ति" },
    description: {
      en: "Learn how sacred sounds and vibrations can transform your consciousness.",
      hi: "जानें कैसे पवित्र ध्वनियां आपकी चेतना को बदल सकती हैं।"
    },
    content: {
      en: `Mantras are not mere words but powerful vibrations that have been passed down through millennia. When chanted with devotion and proper understanding, they create resonance patterns that align our mind, body, and spirit with cosmic frequencies.

Swami Ji guides seekers in the authentic practice of mantra sadhana, revealing the science behind these sacred sounds. Each mantra carries specific energy that can heal, protect, and elevate consciousness.

The most powerful aspect of mantra practice is consistency. A mantra chanted 108 times daily for 40 days creates a deep imprint in your consciousness. This practice, known as a mantra anushthana, can bring profound transformation.

Start with the universal mantra "Om" - the primordial sound of creation. Sit quietly, take a deep breath, and chant "Om" slowly, feeling the vibration resonate through your entire being.`,
      hi: `मंत्र केवल शब्द नहीं हैं बल्कि शक्तिशाली कंपन हैं जो सहस्राब्दियों से चले आ रहे हैं। जब भक्ति और उचित समझ के साथ जप किया जाता है, तो वे ऐसे अनुनाद पैटर्न बनाते हैं जो हमारे मन, शरीर और आत्मा को ब्रह्मांडीय आवृत्तियों के साथ संरेखित करते हैं।

स्वामी जी साधकों को मंत्र साधना के प्रामाणिक अभ्यास में मार्गदर्शन करते हैं, इन पवित्र ध्वनियों के पीछे के विज्ञान को प्रकट करते हैं। प्रत्येक मंत्र विशिष्ट ऊर्जा वहन करता है जो चेतना को ठीक कर सकता है, रक्षा कर सकता है और उन्नत कर सकता है।

मंत्र अभ्यास का सबसे शक्तिशाली पहलू निरंतरता है। 40 दिनों तक प्रतिदिन 108 बार जपा गया मंत्र आपकी चेतना में गहरी छाप बनाता है।

सार्वभौमिक मंत्र "ॐ" से शुरू करें - सृष्टि की आदिम ध्वनि।`
    }
  },
  "seva": {
    icon: "🙏🏻",
    title: { en: "Service to Humanity", hi: "मानवता की सेवा" },
    description: {
      en: "Understand why selfless service is the highest form of spiritual practice.",
      hi: "समझें कि निःस्वार्थ सेवा सर्वोच्च आध्यात्मिक अभ्यास क्यों है।"
    },
    content: {
      en: `Seva, or selfless service, is the purest expression of spiritual love. When we serve others without expectation of reward, we dissolve the boundaries of ego and experience the oneness of all existence.

The ashram provides numerous opportunities for seva, from feeding the hungry to teaching the young, each act becoming a prayer in motion. Swami Ji teaches that true seva is performed without any sense of doership—we are merely instruments of the divine.

Through seva, we learn humility, compassion, and the joy of giving. It is said that the hands that serve are holier than the lips that pray. When we serve others, we serve the divine that resides in every being.

Find opportunities in your daily life to practice seva—help a neighbor, volunteer at a local shelter, or simply offer a kind word to someone in need.`,
      hi: `सेवा, या निःस्वार्थ सेवा, आध्यात्मिक प्रेम की शुद्धतम अभिव्यक्ति है। जब हम बिना किसी प्रतिफल की अपेक्षा के दूसरों की सेवा करते हैं, तो हम अहंकार की सीमाओं को भंग कर देते हैं और सभी अस्तित्व की एकता का अनुभव करते हैं।

आश्रम सेवा के कई अवसर प्रदान करता है, भूखों को खिलाने से लेकर युवाओं को पढ़ाने तक, प्रत्येक कार्य गति में प्रार्थना बन जाता है। स्वामी जी सिखाते हैं कि सच्ची सेवा बिना किसी कर्तापन की भावना के की जाती है—हम केवल परमात्मा के उपकरण हैं।

सेवा के माध्यम से, हम विनम्रता, करुणा और देने का आनंद सीखते हैं। कहा जाता है कि सेवा करने वाले हाथ प्रार्थना करने वाले होंठों से अधिक पवित्र होते हैं।`
    }
  },
  "dharma": {
    icon: "🙏🏼",
    title: { en: "Living with Purpose", hi: "उद्देश्य के साथ जीना" },
    description: {
      en: "Find your dharma and align your daily actions with your higher purpose.",
      hi: "अपने धर्म को खोजें और अपनी दैनिक क्रियाओं को उच्च उद्देश्य के साथ संरेखित करें।"
    },
    content: {
      en: `Dharma is your unique path, the sacred duty that gives meaning to your existence. Swami Ji helps seekers discover their true calling and align their daily actions with their higher purpose.

When we live in accordance with our dharma, every moment becomes meaningful, every action becomes worship, and life flows with grace and fulfillment. Dharma is not about what we do, but how we do it—with awareness, dedication, and love.

To discover your dharma, ask yourself: What activities make you lose track of time? What service can you provide that the world needs? Where do your talents and the world's needs intersect?

Your dharma may evolve as you grow spiritually. Stay open, stay humble, and trust that the universe will guide you toward your highest purpose.`,
      hi: `धर्म आपका अनूठा मार्ग है, वह पवित्र कर्तव्य जो आपके अस्तित्व को अर्थ देता है। स्वामी जी साधकों को उनकी सच्ची बुलाहट खोजने और उनकी दैनिक क्रियाओं को उनके उच्च उद्देश्य के साथ संरेखित करने में मदद करते हैं।

जब हम अपने धर्म के अनुसार जीते हैं, तो हर पल सार्थक हो जाता है, हर कार्य पूजा बन जाता है, और जीवन कृपा और पूर्णता के साथ बहता है। धर्म इस बारे में नहीं है कि हम क्या करते हैं, बल्कि यह इस बारे में है कि हम इसे कैसे करते हैं—जागरूकता, समर्पण और प्रेम के साथ।

अपने धर्म को खोजने के लिए, अपने आप से पूछें: कौन सी गतिविधियां आपको समय का ध्यान भूला देती हैं? आप कौन सी सेवा प्रदान कर सकते हैं जिसकी दुनिया को जरूरत है?`
    }
  }
};

export function generateStaticParams() {
  return Object.keys(teachings).map((slug) => ({ slug }));
}

export default async function TeachingPage({ 
  params 
}: { 
  params: Promise<{ locale: AppLocale; slug: string }> 
}) {
  const { locale, slug } = await params;
  
  const teaching = teachings[slug];
  
  if (!teaching) {
    notFound();
  }

  return (
    <div style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Hero Section */}
      <section 
        className="py-20 relative overflow-hidden"
        style={{ 
          background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))'
        }}
      >
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
            backgroundSize: '30px 30px'
          }}
        />
        <Container className="relative z-10 text-center">
          <div className="text-8xl mb-6">{teaching.icon}</div>
          <h1 className="font-heading text-4xl md:text-5xl font-semibold text-white mb-4">
            {teaching.title[locale]}
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            {teaching.description[locale]}
          </p>
        </Container>
      </section>

      {/* Content Section */}
      <section className="py-16">
        <Container>
          <div className="max-w-3xl mx-auto">
            <div 
              className="prose prose-lg max-w-none"
              style={{ color: 'var(--color-foreground)' }}
            >
              {teaching.content[locale].split('\n\n').map((paragraph, idx) => (
                <p key={idx} className="mb-6 leading-relaxed text-lg">
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Back Link */}
            <div className="mt-12 pt-8 border-t" style={{ borderColor: 'var(--color-border)' }}>
              <Link
                href={`/${locale}`}
                className="inline-flex items-center gap-2 font-medium transition-colors hover:opacity-80"
                style={{ color: 'var(--color-primary)' }}
              >
                <span>←</span>
                <span>{locale === "en" ? "Back to Home" : "होम पर वापस जाएं"}</span>
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
