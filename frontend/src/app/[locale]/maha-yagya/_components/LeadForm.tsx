"use client";

import { useState, useEffect } from "react";
import type { AppLocale } from "@/i18n/config";
import { createSupportTicket } from "@/lib/api";
import { t } from "@/content/contentProvider";

interface LeadFormProps {
  locale: AppLocale;
}

const stallTypes = [
  { value: "standard", en: "Standard — ₹50,000", hi: "स्टैंडर्ड — ₹50,000" },
  { value: "premium", en: "Premium — ₹1,00,000", hi: "प्रीमियम — ₹1,00,000" },
  { value: "prime", en: "Prime — ₹2,00,000", hi: "प्राइम — ₹2,00,000" },
];

const formLabels = {
  company: { en: "Company / Organization Name", hi: "कंपनी / संगठन का नाम" },
  contact: { en: "Contact Person", hi: "संपर्क व्यक्ति" },
  mobile: { en: "Mobile Number", hi: "मोबाइल नंबर" },
  email: { en: "Email Address", hi: "ईमेल पता" },
  stallType: { en: "Preferred Stall Type", hi: "पसंदीदा स्टॉल प्रकार" },
  selectStall: { en: "Select Stall Type", hi: "स्टॉल प्रकार चुनें" },
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
  const [selectedStall, setSelectedStall] = useState("");
  const [formData, setFormData] = useState({
    company: "",
    contact: "",
    mobile: "",
    email: "",
    stallType: "",
    message: "",
  });

  // Listen for stall selection from pricing cards
  useEffect(() => {
    function handleSelectStall(e: Event) {
      const detail = (e as CustomEvent).detail;
      if (detail) {
        setSelectedStall(detail);
        setFormData((prev) => ({ ...prev, stallType: detail }));
      }
    }
    window.addEventListener("selectStall", handleSelectStall);
    return () => window.removeEventListener("selectStall", handleSelectStall);
  }, []);

  // Sync selectedStall with formData
  useEffect(() => {
    if (selectedStall) {
      setFormData((prev) => ({ ...prev, stallType: selectedStall }));
    }
  }, [selectedStall]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "stallType") setSelectedStall(value);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormState("submitting");

    const stallLabel =
      stallTypes.find((s) => s.value === formData.stallType)?.en || formData.stallType;

    try {
      await createSupportTicket({
        subject: `Maha Yagya Stall Enquiry — ${formData.company} — ${stallLabel}`,
        message: [
          `Company: ${formData.company}`,
          `Contact Person: ${formData.contact}`,
          `Mobile: ${formData.mobile}`,
          `Email: ${formData.email}`,
          `Preferred Stall: ${stallLabel}`,
          formData.message ? `Message: ${formData.message}` : "",
        ]
          .filter(Boolean)
          .join("\n"),
        category: "yagya-stall-booking",
        name: formData.contact,
        email: formData.email,
      });
      setFormState("success");
      setTimeout(() => {
        setFormState("idle");
        setFormData({ company: "", contact: "", mobile: "", email: "", stallType: "", message: "" });
        setSelectedStall("");
      }, 5000);
    } catch {
      setFormState("error");
      setTimeout(() => setFormState("idle"), 4000);
    }
  }

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
          {t(formLabels.company, locale)} *
        </label>
        <input
          type="text"
          name="company"
          required
          value={formData.company}
          onChange={handleChange}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            {t(formLabels.contact, locale)} *
          </label>
          <input
            type="text"
            name="contact"
            required
            value={formData.contact}
            onChange={handleChange}
            className={inputClass}
          />
        </div>
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

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          {t(formLabels.stallType, locale)} *
        </label>
        <select
          name="stallType"
          required
          value={formData.stallType}
          onChange={handleChange}
          className={inputClass}
        >
          <option value="">{t(formLabels.selectStall, locale)}</option>
          {stallTypes.map((stall) => (
            <option key={stall.value} value={stall.value}>
              {locale === "en" ? stall.en : stall.hi}
            </option>
          ))}
        </select>
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
