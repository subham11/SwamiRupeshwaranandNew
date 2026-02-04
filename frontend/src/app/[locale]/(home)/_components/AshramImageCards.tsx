"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { AppLocale } from "@/i18n/config";

interface CardInfo {
  id: string;
  image: string;
  icon: string;
  title: { en: string; hi: string };
  description: { en: string; hi: string };
  link: string;
  linkText: { en: string; hi: string };
}

const cards: CardInfo[] = [
  {
    id: "ashram",
    image: "/images/hero-1.svg",
    icon: "🙏",
    title: {
      en: "Sacred Himalayan Ashram",
      hi: "पवित्र हिमालयी आश्रम"
    },
    description: {
      en: "Nestled in the sacred foothills of the Himalayas, our ashram serves as a sanctuary for spiritual seekers. Experience the divine energy, participate in ancient rituals, and find inner peace in this sacred abode where sages have meditated for centuries.",
      hi: "हिमालय की पवित्र तलहटी में बसा हमारा आश्रम आध्यात्मिक साधकों के लिए एक अभयारण्य है। दिव्य ऊर्जा का अनुभव करें, प्राचीन अनुष्ठानों में भाग लें, और इस पवित्र स्थान में आंतरिक शांति पाएं जहाँ सदियों से ऋषि-मुनि ध्यान करते आए हैं।"
    },
    link: "/ashram",
    linkText: { en: "Explore Ashram", hi: "आश्रम देखें" }
  },
  {
    id: "satsang",
    image: "/images/hero-2.svg",
    icon: "✨",
    title: {
      en: "Satsang & Spiritual Gatherings",
      hi: "सत्संग एवं आध्यात्मिक सभाएं"
    },
    description: {
      en: "Join our weekly satsangs where devotees gather to sing bhajans, listen to spiritual discourses, and experience collective meditation. These gatherings uplift the soul and create a community of like-minded seekers on the path of dharma.",
      hi: "हमारे साप्ताहिक सत्संगों में शामिल हों जहाँ भक्त भजन गाने, आध्यात्मिक प्रवचन सुनने और सामूहिक ध्यान का अनुभव करने के लिए एकत्रित होते हैं। ये सभाएं आत्मा को उन्नत करती हैं और धर्म के मार्ग पर समान विचारधारा वाले साधकों का समुदाय बनाती हैं।"
    },
    link: "/events",
    linkText: { en: "View Events", hi: "कार्यक्रम देखें" }
  },
  {
    id: "seva",
    image: "/images/hero-3.svg",
    icon: "🙏🏻",
    title: {
      en: "Seva & Sacred Services",
      hi: "सेवा एवं पवित्र अनुष्ठान"
    },
    description: {
      en: "Participate in sacred poojas, yagnas, and spiritual services conducted by learned priests. From Rudrabhishek to special sankalp-based rituals, experience the transformative power of ancient Vedic traditions and receive divine blessings.",
      hi: "विद्वान पुजारियों द्वारा संचालित पवित्र पूजा, यज्ञ और आध्यात्मिक सेवाओं में भाग लें। रुद्राभिषेक से लेकर विशेष संकल्प आधारित अनुष्ठानों तक, प्राचीन वैदिक परंपराओं की परिवर्तनकारी शक्ति का अनुभव करें और दिव्य आशीर्वाद प्राप्त करें।"
    },
    link: "/services",
    linkText: { en: "Our Services", hi: "हमारी सेवाएं" }
  }
];

export default function AshramImageCards({ locale }: { locale: AppLocale }) {
  const [selectedCard, setSelectedCard] = useState<CardInfo | null>(null);

  return (
    <>
      {/* Image Grid - Responsive for mobile/tablet/desktop */}
      <div className="lg:col-span-7 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 sm:gap-5">
          {/* Main large card */}
          <div className="col-span-1 sm:col-span-12 md:col-span-7">
            <button
              onClick={() => setSelectedCard(cards[0])}
              className="w-full overflow-hidden rounded-xl shadow-sacred transition-transform duration-300 hover:scale-[1.02] min-h-[200px] sm:min-h-[280px] md:min-h-[320px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{ border: '1px solid var(--color-border)' }}
            >
              <Image 
                src={cards[0].image} 
                alt={cards[0].title[locale]} 
                width={1200} 
                height={630} 
                className="h-full w-full object-cover" 
              />
            </button>
          </div>
          
          {/* Side cards - stack on mobile, side-by-side on larger screens */}
          <div className="col-span-1 sm:col-span-6 md:col-span-5 grid grid-cols-2 sm:grid-cols-1 gap-4 sm:gap-5">
            <button
              onClick={() => setSelectedCard(cards[1])}
              className="w-full overflow-hidden rounded-xl shadow-sacred transition-transform duration-300 hover:scale-[1.02] min-h-[120px] sm:min-h-[130px] md:min-h-[150px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{ border: '1px solid var(--color-border)' }}
            >
              <Image 
                src={cards[1].image} 
                alt={cards[1].title[locale]} 
                width={600} 
                height={400} 
                className="h-full w-full object-cover" 
              />
            </button>
            <button
              onClick={() => setSelectedCard(cards[2])}
              className="w-full overflow-hidden rounded-xl shadow-sacred transition-transform duration-300 hover:scale-[1.02] min-h-[120px] sm:min-h-[130px] md:min-h-[150px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{ border: '1px solid var(--color-border)' }}
            >
              <Image 
                src={cards[2].image} 
                alt={cards[2].title[locale]} 
                width={600} 
                height={400} 
                className="h-full w-full object-cover" 
              />
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {selectedCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
            onClick={() => setSelectedCard(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm sm:max-w-md md:max-w-lg rounded-2xl overflow-hidden shadow-2xl bg-white my-4"
            >
              {/* Close button */}
              <button
                onClick={() => setSelectedCard(null)}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-gray-600 hover:text-gray-900 bg-white/90 hover:bg-white transition-colors shadow-md"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Card Image */}
              <div className="relative h-36 sm:h-48 md:h-56 overflow-hidden">
                <Image
                  src={selectedCard.image}
                  alt={selectedCard.title[locale]}
                  fill
                  className="object-cover"
                />
                <div 
                  className="absolute inset-0"
                  style={{ background: 'linear-gradient(to top, white 0%, transparent 100%)' }}
                />
              </div>

              {/* Modal Content */}
              <div className="p-4 sm:p-6 pt-0 -mt-6 sm:-mt-8 relative">
                {/* Animated Icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", damping: 15, stiffness: 200, delay: 0.1 }}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-4xl sm:text-5xl mb-3 sm:mb-4 mx-auto shadow-lg bg-white"
                  style={{ border: '3px solid #d4a853' }}
                >
                  {selectedCard.icon}
                </motion.div>

                {/* Animated Title */}
                <motion.h3
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="font-heading text-xl sm:text-2xl font-semibold text-center mb-3 sm:mb-4 text-gray-900"
                >
                  {selectedCard.title[locale]}
                </motion.h3>

                {/* Animated Description */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-center text-sm sm:text-base leading-relaxed mb-4 sm:mb-6 text-gray-600"
                >
                  {selectedCard.description[locale]}
                </motion.p>

                {/* Animated Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex justify-center pb-2"
                >
                  <Link
                    href={`/${locale}${selectedCard.link}`}
                    className="inline-flex items-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 rounded-full font-medium text-white text-sm sm:text-base transition-all duration-300 hover:scale-105 hover:shadow-lg"
                    style={{ backgroundColor: 'var(--color-accent)' }}
                    onClick={() => setSelectedCard(null)}
                  >
                    {selectedCard.linkText[locale]}
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
