// Shared tier data for wizard + form — single source of truth

export interface TierEntry {
  value: string;
  en: string;
  hi: string;
  amount: number; // INR (full amount)
}

export interface CategoryEntry {
  value: string;
  en: string;
  hi: string;
}

export const categories: CategoryEntry[] = [
  { value: "sponsor", en: "Partners (पार्टनर्स)", hi: "पार्टनर्स" },
  { value: "yajaman", en: "Yagyaman (यज्ञमान)", hi: "यज्ञमान" },
  { value: "shivirarthi", en: "Camps & Programs (शिविर और कार्यक्रम)", hi: "शिविर और कार्यक्रम" },
  { value: "business-stall", en: "Business / Startup Stall (व्यवसाय / स्टार्टअप स्टॉल)", hi: "व्यवसाय / स्टार्टअप स्टॉल" },
  { value: "food-stall", en: "State Food Stall (राज्य खाद्य स्टॉल)", hi: "राज्य खाद्य स्टॉल" },
];

export const tiersByCategory: Record<string, TierEntry[]> = {
  sponsor: [
    { value: "lead-csr-partner", en: "Lead CSR Partner", hi: "लीड CSR पार्टनर", amount: 10000000 },
    { value: "green-partner", en: "Green Partner", hi: "ग्रीन पार्टनर", amount: 5000000 },
    { value: "health-partner", en: "Health Partner", hi: "हेल्थ पार्टनर", amount: 2500000 },
    { value: "empact-partner", en: "Empact Partner", hi: "एम्पैक्ट पार्टनर", amount: 1000000 },
    { value: "stall-partner", en: "Stall Partner", hi: "स्टॉल पार्टनर", amount: 500000 },
  ],
  yajaman: [
    { value: "vishisht-yajaman", en: "Vishisht Yagyaman (VVIP)", hi: "विशिष्ट यज्ञमान (VVIP)", amount: 551000 },
    { value: "mukhya-yajaman", en: "Mukhya Yagyaman (VIP)", hi: "मुख्य यज्ञमान (VIP)", amount: 251000 },
    { value: "sahyogi-yajaman", en: "Sahayogi Yagyaman (VIP)", hi: "सहयोगी यज्ञमान (VIP)", amount: 151000 },
  ],
  shivirarthi: [
    { value: "shivirarthi-1day", en: "One Day Camp", hi: "एक दिवसीय शिविर", amount: 11000 },
    { value: "shivirarthi-3day", en: "Three Days Camp", hi: "3 दिवसीय शिविर", amount: 21000 },
    { value: "shivirarthi-5day", en: "Five Days Camp", hi: "5 दिवसीय शिविर", amount: 51000 },
    { value: "divine-meet", en: "Divine Meet with Swamiji", hi: "स्वामीजी से दिव्य भेंट", amount: 51000 },
  ],
  "business-stall": [
    { value: "business-standard", en: "Standard Stall (10×10 ft)", hi: "स्टैंडर्ड स्टॉल (10×10 फ़ीट)", amount: 50000 },
    { value: "business-premium", en: "Premium Stall (12×12 ft)", hi: "प्रीमियम स्टॉल (12×12 फ़ीट)", amount: 100000 },
    { value: "business-premium-tv", en: "Luxury Premium Stall + TV (12×12 ft)", hi: "लक्ज़री प्रीमियम स्टॉल + टीवी (12×12 फ़ीट)", amount: 150000 },
    { value: "business-prime", en: "Prime Stall (6m×6m)", hi: "प्राइम स्टॉल (6m×6m)", amount: 200000 },
  ],
  "food-stall": [
    { value: "food-standard", en: "Standard Food Stall (10×10 ft)", hi: "स्टैंडर्ड फ़ूड स्टॉल (10×10 फ़ीट)", amount: 50000 },
    { value: "food-premium", en: "Premium Stall (12×12 ft)", hi: "प्रीमियम स्टॉल (12×12 फ़ीट)", amount: 100000 },
    { value: "food-premium-tv", en: "Luxury Premium Stall + TV (12×12 ft)", hi: "लक्ज़री प्रीमियम स्टॉल + टीवी (12×12 फ़ीट)", amount: 150000 },
    { value: "food-prime", en: "Prime Stall (6m×6m)", hi: "प्राइम स्टॉल (6m×6m)", amount: 200000 },
  ],
};

/** Format INR amount as ₹X,XX,XXX */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Get tier entry by category + tierId */
export function getTier(category: string, tierId: string): TierEntry | undefined {
  return tiersByCategory[category]?.find((t) => t.value === tierId);
}
