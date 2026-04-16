"use client";

import { useState, useEffect } from "react";
import type { AppLocale } from "@/i18n/config";
import { createSupportTicket } from "@/lib/api";
import { t } from "@/content/contentProvider";

interface LeadFormProps {
  locale: AppLocale;
}

const categories = [
  { value: "sponsor", en: "Partners (पार्टनर्स)", hi: "पार्टनर्स" },
  { value: "yajaman", en: "Yagyaman (यज्ञमान)", hi: "यज्ञमान" },
  { value: "shivirarthi", en: "Camps & Programs (शिविर और कार्यक्रम)", hi: "शिविर और कार्यक्रम" },
  { value: "business-stall", en: "Business / Startup Stall (व्यवसाय / स्टार्टअप स्टॉल)", hi: "व्यवसाय / स्टार्टअप स्टॉल" },
  { value: "food-stall", en: "State Food Stall (राज्य खाद्य स्टॉल)", hi: "राज्य खाद्य स्टॉल" },
];

const tiersByCategory: Record<string, { value: string; en: string; hi: string }[]> = {
  sponsor: [
    { value: "lead-csr-partner", en: "Lead CSR Partner — ₹1,00,00,000", hi: "लीड CSR पार्टनर — ₹1,00,00,000" },
    { value: "green-partner", en: "Green Partner — ₹50,00,000", hi: "ग्रीन पार्टनर — ₹50,00,000" },
    { value: "health-partner", en: "Health Partner — ₹25,00,000", hi: "हेल्थ पार्टनर — ₹25,00,000" },
    { value: "empact-partner", en: "Empact Partner — ₹10,00,000", hi: "एम्पैक्ट पार्टनर — ₹10,00,000" },
    { value: "stall-partner", en: "Stall Partner — ₹5,00,000", hi: "स्टॉल पार्टनर — ₹5,00,000" },
  ],
  yajaman: [
    { value: "vishisht-yajaman", en: "Vishisht Yagyaman (VVIP) — ₹5,51,000", hi: "विशिष्ट यज्ञमान (VVIP) — ₹5,51,000" },
    { value: "mukhya-yajaman", en: "Mukhya Yagyaman (VIP) — ₹2,51,000", hi: "मुख्य यज्ञमान (VIP) — ₹2,51,000" },
    { value: "sahyogi-yajaman", en: "Sahayogi Yagyaman (VIP) — ₹1,51,000", hi: "सहयोगी यज्ञमान (VIP) — ₹1,51,000" },
  ],
  shivirarthi: [
    { value: "shivirarthi-1day", en: "One Day Camp — ₹11,000", hi: "एक दिवसीय शिविर — ₹11,000" },
    { value: "shivirarthi-3day", en: "Three Days Camp — ₹21,000", hi: "3 दिवसीय शिविर — ₹21,000" },
    { value: "shivirarthi-5day", en: "Five Days Camp — ₹51,000", hi: "5 दिवसीय शिविर — ₹51,000" },
    { value: "divine-meet", en: "Divine Meet with Swamiji — ₹51,000", hi: "स्वामीजी से दिव्य भेंट — ₹51,000" },
  ],
  "business-stall": [
    { value: "business-standard", en: "Standard Stall (10×10 ft) — ₹50,000", hi: "स्टैंडर्ड स्टॉल (10×10 फ़ीट) — ₹50,000" },
    { value: "business-premium", en: "Premium Stall (12×12 ft) — ₹1,00,000", hi: "प्रीमियम स्टॉल (12×12 फ़ीट) — ₹1,00,000" },
    { value: "business-premium-tv", en: "Luxury Premium Stall + TV (12×12 ft) — ₹1,50,000", hi: "लक्ज़री प्रीमियम स्टॉल + टीवी (12×12 फ़ीट) — ₹1,50,000" },
    { value: "business-prime", en: "Prime Stall (6m×6m) — ₹2,00,000", hi: "प्राइम स्टॉल (6m×6m) — ₹2,00,000" },
  ],
  "food-stall": [
    { value: "food-standard", en: "Standard Food Stall (10×10 ft) — ₹50,000", hi: "स्टैंडर्ड फ़ूड स्टॉल (10×10 फ़ीट) — ₹50,000" },
    { value: "food-premium", en: "Premium Stall (12×12 ft) — ₹1,00,000", hi: "प्रीमियम स्टॉल (12×12 फ़ीट) — ₹1,00,000" },
    { value: "food-premium-tv", en: "Luxury Premium Stall + TV (12×12 ft) — ₹1,50,000", hi: "लक्ज़री प्रीमियम स्टॉल + टीवी (12×12 फ़ीट) — ₹1,50,000" },
    { value: "food-prime", en: "Prime Stall (6m×6m) — ₹2,00,000", hi: "प्राइम स्टॉल (6m×6m) — ₹2,00,000" },
  ],
};

const formLabels = {
  name: { en: "Full Name", hi: "पूरा नाम" },
  company: { en: "Company / Organization (if applicable)", hi: "कंपनी / संगठन (यदि लागू हो)" },
  mobile: { en: "Mobile Number", hi: "मोबाइल नंबर" },
  email: { en: "Email Address", hi: "ईमेल पता" },
  category: { en: "Participation Category", hi: "भागीदारी श्रेणी" },
  selectCategory: { en: "Select Category", hi: "श्रेणी चुनें" },
  tier: { en: "Preferred Tier", hi: "पसंदीदा स्तर" },
  selectTier: { en: "Select Tier", hi: "स्तर चुनें" },
  message: { en: "Additional Requirements", hi: "अतिरिक्त आवश्यकताएं" },
  submit: { en: "Submit Enquiry", hi: "पूछताछ भेजें" },
  submitting: { en: "Submitting...", hi: "भेजा जा रहा है..." },
  successTitle: { en: "Thank You!", hi: "धन्यवाद!" },
  successMsg: {
    en: "Your enquiry has been submitted. Our team will contact you within 24 hours.",
    hi: "आपकी पूछताछ जमा हो गई है। हमारी टीम 24 घंटे के भीतर आपसे संपर्क करेगी।",
  },
  errorMsg: {
    en: "Something went wrong. Please try again or call us directly.",
    hi: "कुछ गलत हो गया। कृपया पुनः प्रयास करें या सीधे हमें कॉल करें।",
  },
};

const inputClass =
  "w-full px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors";

type FormState = "idle" | "submitting" | "success" | "error";

export default function LeadForm({ locale }: LeadFormProps) {
  const [formState, setFormState] = useState<FormState>("idle");
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    mobile: "",
    email: "",
    category: "",
    tier: "",
    message: "",
  });

  // Listen for stall/category selection from pricing cards
  useEffect(() => {
    function handleSelectStall(e: Event) {
      const detail = (e as CustomEvent).detail;
      if (detail?.category && detail?.tier) {
        setFormData((prev) => ({ ...prev, category: detail.category, tier: detail.tier }));
      } else if (detail?.category) {
        setFormData((prev) => ({ ...prev, category: detail.category, tier: "" }));
      }
    }
    window.addEventListener("selectStall", handleSelectStall);
    return () => window.removeEventListener("selectStall", handleSelectStall);
  }, []);

  // Reset tier when category changes
  function handleCategoryChange(value: string) {
    setFormData((prev) => ({ ...prev, category: value, tier: "" }));
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    if (name === "category") {
      handleCategoryChange(value);
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormState("submitting");

    const catLabel = categories.find((c) => c.value === formData.category)?.en || formData.category;
    const tierLabel =
      tiersByCategory[formData.category]?.find((t) => t.value === formData.tier)?.en || formData.tier;

    try {
      await createSupportTicket({
        subject: `Maha Yagya Enquiry — ${catLabel} — ${tierLabel} — ${formData.name}`,
        message: [
          `Name: ${formData.name}`,
          formData.company ? `Company: ${formData.company}` : "",
          `Mobile: ${formData.mobile}`,
          `Email: ${formData.email}`,
          `Category: ${catLabel}`,
          `Tier: ${tierLabel}`,
          formData.message ? `Message: ${formData.message}` : "",
        ]
          .filter(Boolean)
          .join("\n"),
        category: `yagya-${formData.category}`,
        name: formData.name,
        email: formData.email,
      });
      setFormState("success");
      setTimeout(() => {
        setFormState("idle");
        setFormData({ name: "", company: "", mobile: "", email: "", category: "", tier: "", message: "" });
      }, 5000);
    } catch {
      setFormState("error");
      setTimeout(() => setFormState("idle"), 4000);
    }
  }

  const availableTiers = formData.category ? (tiersByCategory[formData.category] || []) : [];

  if (formState === "success") {
    return (
      <div className="text-center py-12 px-6 rounded-xl" style={{ backgroundColor: "var(--color-secondary)" }}>
        <div className="text-5xl mb-4">✅</div>
        <h3
          className="text-2xl font-heading font-semibold mb-2"
          style={{ color: "var(--color-primary)" }}
        >
          {t(formLabels.successTitle, locale)}
        </h3>
        <p style={{ color: "var(--color-muted)" }}>{t(formLabels.successMsg, locale)}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
      {formState === "error" && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm">
          {t(formLabels.errorMsg, locale)}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          {t(formLabels.name, locale)} *
        </label>
        <input
          type="text"
          name="name"
          required
          value={formData.name}
          onChange={handleChange}
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          {t(formLabels.company, locale)}
        </label>
        <input
          type="text"
          name="company"
          value={formData.company}
          onChange={handleChange}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            {t(formLabels.mobile, locale)} *
          </label>
          <input
            type="tel"
            name="mobile"
            required
            value={formData.mobile}
            onChange={handleChange}
            placeholder="+91"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            {t(formLabels.email, locale)} *
          </label>
          <input
            type="email"
            name="email"
            required
            value={formData.email}
            onChange={handleChange}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            {t(formLabels.category, locale)} *
          </label>
          <select
            name="category"
            required
            value={formData.category}
            onChange={handleChange}
            className={inputClass}
          >
            <option value="">{t(formLabels.selectCategory, locale)}</option>
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {locale === "en" ? cat.en : cat.hi}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            {t(formLabels.tier, locale)} *
          </label>
          <select
            name="tier"
            required
            value={formData.tier}
            onChange={handleChange}
            className={inputClass}
            disabled={!formData.category}
          >
            <option value="">{t(formLabels.selectTier, locale)}</option>
            {availableTiers.map((tier) => (
              <option key={tier.value} value={tier.value}>
                {locale === "en" ? tier.en : tier.hi}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          {t(formLabels.message, locale)}
        </label>
        <textarea
          name="message"
          rows={3}
          value={formData.message}
          onChange={handleChange}
          className={`${inputClass} resize-none`}
        />
      </div>

      <button
        type="submit"
        disabled={formState === "submitting"}
        className="w-full py-3 rounded-lg font-semibold text-white transition-all hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ background: "linear-gradient(135deg, var(--color-gold), var(--color-accent))" }}
      >
        {formState === "submitting" ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            {t(formLabels.submitting, locale)}
          </span>
        ) : (
          t(formLabels.submit, locale)
        )}
      </button>
    </form>
  );
}
