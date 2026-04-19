"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { AppLocale } from "@/i18n/config";
import { createSupportTicket, initiateYagyaPayment, type YagyaPaymentResponse } from "@/lib/api";
import RazorpayYagyaCheckout from "@/components/payment/RazorpayYagyaCheckout";
import { categories, tiersByCategory, getTier, formatINR } from "./tierData";

// ─── Types ───────────────────────────────────────────────────
type Step = 0 | 1 | 2 | 3 | 4;

interface FormData {
  name: string;
  company: string;
  mobile: string;
  email: string;
  category: string;
  tier: string;
  message: string;
}

// ─── Helpers ─────────────────────────────────────────────────
function t(obj: { en: string; hi: string }, locale: AppLocale) {
  return obj[locale] || obj.en;
}

const inputClass =
  "w-full px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors";

const STEPS = [
  { en: "Enquiry", hi: "पूछताछ" },
  { en: "Summary", hi: "सारांश" },
  { en: "Terms", hi: "नियम" },
  { en: "Payment", hi: "भुगतान" },
];

// ─── Progress Bar ─────────────────────────────────────────────
function ProgressBar({
  step,
  locale,
  onStepClick,
}: {
  step: Step;
  locale: AppLocale;
  onStepClick: (i: number) => void;
}) {
  if (step === 4) return null;
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((s, i) => {
        const active = i === step;
        const done = i < step;
        // Steps 0 & 1 are always clickable; steps 2 & 3 only if already reached
        const clickable = i <= 1 || i <= step;
        return (
          <div key={i} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={() => clickable && onStepClick(i)}
                disabled={!clickable}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  done ? "text-white" : active ? "text-white scale-110 shadow-lg" : "text-zinc-400 dark:text-zinc-500"
                } ${clickable ? "cursor-pointer hover:opacity-80" : "cursor-default"}`}
                style={{
                  background: done
                    ? "var(--color-primary)"
                    : active
                    ? "linear-gradient(135deg, var(--color-gold), var(--color-accent))"
                    : "var(--color-secondary)",
                  border: done || active ? "none" : "2px solid var(--color-border)",
                }}
              >
                {done ? "✓" : i + 1}
              </button>
              <span
                className="text-[10px] mt-1 font-medium hidden sm:block"
                style={{ color: active ? "var(--color-primary)" : "var(--color-muted)" }}
              >
                {t(s, locale)}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className="flex-1 h-0.5 mx-1"
                style={{ background: i < step ? "var(--color-primary)" : "var(--color-border)" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 0: Enquiry Form ────────────────────────────────────
function EnquiryStep({
  locale,
  formData,
  onChange,
  onCategoryChange,
  onSubmit,
  submitting,
}: {
  locale: AppLocale;
  formData: FormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onCategoryChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
}) {
  const availableTiers = formData.category ? (tiersByCategory[formData.category] || []) : [];

  return (
    <form onSubmit={onSubmit} className="space-y-4 sm:space-y-5">
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          {locale === "hi" ? "पूरा नाम" : "Full Name"} *
        </label>
        <input type="text" name="name" required value={formData.name} onChange={onChange} className={inputClass} />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          {locale === "hi" ? "कंपनी / संगठन (यदि लागू हो)" : "Company / Organization (if applicable)"}
        </label>
        <input type="text" name="company" value={formData.company} onChange={onChange} className={inputClass} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            {locale === "hi" ? "मोबाइल नंबर" : "Mobile Number"} *
          </label>
          <input type="tel" name="mobile" required value={formData.mobile} onChange={onChange} placeholder="+91" className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            {locale === "hi" ? "ईमेल पता" : "Email Address"} *
          </label>
          <input type="email" name="email" required value={formData.email} onChange={onChange} className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            {locale === "hi" ? "भागीदारी श्रेणी" : "Participation Category"} *
          </label>
          <select
            name="category"
            required
            value={formData.category}
            onChange={onChange}
            className={inputClass}
          >
            <option value="">{locale === "hi" ? "श्रेणी चुनें" : "Select Category"}</option>
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {locale === "en" ? cat.en : cat.hi}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            {locale === "hi" ? "पसंदीदा स्तर" : "Preferred Tier"} *
          </label>
          <select
            name="tier"
            required
            value={formData.tier}
            onChange={onChange}
            className={inputClass}
            disabled={!formData.category}
          >
            <option value="">{locale === "hi" ? "स्तर चुनें" : "Select Tier"}</option>
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
          {locale === "hi" ? "अतिरिक्त आवश्यकताएं" : "Additional Requirements"}
        </label>
        <textarea name="message" rows={3} value={formData.message} onChange={onChange} className={`${inputClass} resize-none`} />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3 rounded-lg font-semibold text-white transition-all hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ background: "linear-gradient(135deg, var(--color-gold), var(--color-accent))" }}
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            {locale === "hi" ? "सबमिट हो रहा है..." : "Submitting..."}
          </span>
        ) : (
          <>{locale === "hi" ? "आगे बढ़ें →" : "Submit & Proceed →"}</>
        )}
      </button>
    </form>
  );
}

// ─── Step 1: Booking Summary ─────────────────────────────────
function SummaryStep({
  locale,
  formData,
  onChange,
  onBack,
  onNext,
}: {
  locale: AppLocale;
  formData: FormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const cat = categories.find((c) => c.value === formData.category);
  const tier = getTier(formData.category, formData.tier);
  const deposit = tier ? Math.round(tier.amount / 2) : 0;
  const availableTiers = formData.category ? (tiersByCategory[formData.category] || []) : [];

  function handleNext() {
    if (!formData.name || !formData.mobile || !formData.email || !formData.category || !formData.tier) {
      setError(locale === "hi" ? "कृपया सभी आवश्यक फ़ील्ड भरें।" : "Please fill in all required fields.");
      return;
    }
    setError(null);
    onNext();
  }

  return (
    <div className="space-y-6">
      {/* Contact + selection fields — always editable */}
      <div
        className="rounded-xl p-5 sm:p-6 space-y-4"
        style={{ backgroundColor: "var(--color-secondary)", border: "1px solid var(--color-border)" }}
      >
        <h3 className="font-heading text-lg font-semibold" style={{ color: "var(--color-primary)" }}>
          {locale === "hi" ? "बुकिंग विवरण" : "Booking Details"}
        </h3>

        {error && (
          <div className="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-3">
          {/* Name */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
            <span className="text-sm w-28 shrink-0" style={{ color: "var(--color-muted)" }}>
              {locale === "hi" ? "पूरा नाम" : "Full Name"} *
            </span>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={onChange}
              placeholder={locale === "hi" ? "अपना नाम दर्ज करें" : "Enter your name"}
              className={`${inputClass} flex-1 text-sm py-2`}
            />
          </div>

          {/* Company */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
            <span className="text-sm w-28 shrink-0" style={{ color: "var(--color-muted)" }}>
              {locale === "hi" ? "कंपनी" : "Company"}
            </span>
            <input
              type="text"
              name="company"
              value={formData.company}
              onChange={onChange}
              placeholder={locale === "hi" ? "वैकल्पिक" : "Optional"}
              className={`${inputClass} flex-1 text-sm py-2`}
            />
          </div>

          {/* Mobile */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
            <span className="text-sm w-28 shrink-0" style={{ color: "var(--color-muted)" }}>
              {locale === "hi" ? "मोबाइल" : "Mobile"} *
            </span>
            <input
              type="tel"
              name="mobile"
              value={formData.mobile}
              onChange={onChange}
              placeholder="+91"
              className={`${inputClass} flex-1 text-sm py-2`}
            />
          </div>

          {/* Email */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
            <span className="text-sm w-28 shrink-0" style={{ color: "var(--color-muted)" }}>
              {locale === "hi" ? "ईमेल" : "Email"} *
            </span>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={onChange}
              placeholder="you@example.com"
              className={`${inputClass} flex-1 text-sm py-2`}
            />
          </div>

          <div className="border-t pt-3" style={{ borderColor: "var(--color-border)" }} />

          {/* Category */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
            <span className="text-sm w-28 shrink-0" style={{ color: "var(--color-muted)" }}>
              {locale === "hi" ? "श्रेणी" : "Category"} *
            </span>
            <select
              name="category"
              value={formData.category}
              onChange={onChange}
              className={`${inputClass} flex-1 text-sm py-2`}
            >
              <option value="">{locale === "hi" ? "श्रेणी चुनें" : "Select Category"}</option>
              {categories.map((c) => (
                <option key={c.value} value={c.value}>{locale === "en" ? c.en : c.hi}</option>
              ))}
            </select>
          </div>

          {/* Tier */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
            <span className="text-sm w-28 shrink-0" style={{ color: "var(--color-muted)" }}>
              {locale === "hi" ? "स्तर" : "Tier"} *
            </span>
            <select
              name="tier"
              value={formData.tier}
              onChange={onChange}
              disabled={!formData.category}
              className={`${inputClass} flex-1 text-sm py-2`}
            >
              <option value="">{locale === "hi" ? "स्तर चुनें" : "Select Tier"}</option>
              {availableTiers.map((t) => (
                <option key={t.value} value={t.value}>{locale === "en" ? t.en : t.hi}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Pricing breakdown */}
      <div
        className="rounded-xl p-5 sm:p-6 space-y-3"
        style={{ background: "linear-gradient(135deg, var(--color-primary), #1a0a00)" }}
      >
        <h3 className="font-heading text-base font-semibold text-white/80 uppercase tracking-wide text-sm">
          {locale === "hi" ? "मूल्य विवरण" : "Price Breakdown"}
        </h3>
        <div className="flex justify-between items-center">
          <span className="text-white/70 text-sm">{locale === "hi" ? "कुल मूल्य" : "Total Amount"}</span>
          <span className="text-white font-semibold">{tier ? formatINR(tier.amount) : "—"}</span>
        </div>
        <div className="border-t border-white/15 pt-3">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-white font-bold text-lg">{locale === "hi" ? "अभी देय (50%)" : "Payable Now (50%)"}</span>
              <p className="text-white/50 text-xs mt-0.5">
                {locale === "hi" ? "शेष 50% आयोजन स्थल पर देय" : "Remaining 50% payable on-site"}
              </p>
            </div>
            <span
              className="font-bold text-2xl"
              style={{ color: "var(--color-gold)" }}
            >
              {tier ? formatINR(deposit) : "—"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-3 rounded-lg font-semibold border transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800"
          style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}
        >
          ← {locale === "hi" ? "वापस" : "Back"}
        </button>
        <button
          onClick={handleNext}
          className="flex-[2] py-3 rounded-lg font-semibold text-white transition-all hover:brightness-110"
          style={{ background: "linear-gradient(135deg, var(--color-gold), var(--color-accent))" }}
        >
          {locale === "hi" ? "पुष्टि करें →" : "Confirm & Continue →"}
        </button>
      </div>
    </div>
  );
}

// ─── Step 2: Terms & Conditions ──────────────────────────────
function TermsStep({
  locale,
  agreed,
  onAgreedChange,
  onBack,
  onNext,
}: {
  locale: AppLocale;
  agreed: boolean;
  onAgreedChange: (v: boolean) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div className="space-y-6">
      <div
        className="rounded-xl p-5 sm:p-6 space-y-5 text-sm leading-relaxed"
        style={{ backgroundColor: "var(--color-secondary)", border: "1px solid var(--color-border)" }}
      >
        <h3 className="font-heading text-base font-bold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>
          {locale === "hi" ? "नियम और शर्तें" : "Terms & Conditions"}
        </h3>

        <div className="space-y-4" style={{ color: "var(--color-muted)" }}>
          {/* Refund — Event cancellation */}
          <div>
            <p className="font-semibold text-zinc-800 dark:text-zinc-100 mb-1">
              {locale === "hi" ? "🔵 आयोजक द्वारा रद्दीकरण" : "🔵 Event Cancellation by Organizers"}
            </p>
            <p>
              {locale === "hi"
                ? "यदि आयोजक किसी भी कारण से कार्यक्रम रद्द करते हैं, तो आपको 100% धनवापसी प्राप्त होगी। Razorpay गेटवे शुल्क (यदि लागू हो) वापस नहीं किए जाएंगे क्योंकि ये भुगतान प्रोसेसर द्वारा लिए जाते हैं।"
                : "If the organizers cancel the event for any reason, you will receive a 100% refund of your booking amount. Razorpay payment gateway charges (as applicable) are non-recoverable as they are charged by the payment processor."}
            </p>
          </div>

          {/* Refund — Participant cancellation */}
          <div>
            <p className="font-semibold text-zinc-800 dark:text-zinc-100 mb-1">
              {locale === "hi" ? "🔴 प्रतिभागी द्वारा रद्दीकरण" : "🔴 Cancellation by Participant"}
            </p>
            <p>
              {locale === "hi"
                ? "यदि आप अपनी बुकिंग रद्द करते हैं, तो अग्रिम बुकिंग राशि का 20% (अर्थात् अभी भुगतान की गई 50% जमा राशि का 20%) गैर-वापसी योग्य है। शेष 80% 7–10 कार्य दिवसों के भीतर वापस कर दिया जाएगा।"
                : "If you cancel your booking, 20% of the advance booking amount (i.e. 20% of the 50% deposit paid now) is non-refundable. The remaining 80% will be refunded within 7–10 business days."}
            </p>
          </div>

          {/* Payment note */}
          <div className="rounded-lg p-3" style={{ background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.2)" }}>
            <p className="font-medium text-zinc-700 dark:text-zinc-200">
              {locale === "hi"
                ? "💡 आप अभी कुल राशि का 50% अग्रिम भुगतान करेंगे। शेष 50% आयोजन स्थल पर देय होगा।"
                : "💡 You are paying 50% of the total amount as an advance now. The remaining 50% is payable at the event venue."}
            </p>
          </div>
        </div>
      </div>

      {/* Agree checkbox */}
      <label className="flex items-start gap-3 cursor-pointer group">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => onAgreedChange(e.target.checked)}
          className="mt-0.5 w-5 h-5 rounded accent-amber-500 cursor-pointer flex-shrink-0"
        />
        <span className="text-sm" style={{ color: "var(--color-muted)" }}>
          {locale === "hi"
            ? "मैंने उपरोक्त नियम और शर्तें पढ़ ली हैं और मैं उनसे सहमत हूं।"
            : "I have read and agree to the Terms & Conditions above."}
        </span>
      </label>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-3 rounded-lg font-semibold border transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800"
          style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}
        >
          ← {locale === "hi" ? "वापस" : "Back"}
        </button>
        <button
          onClick={onNext}
          disabled={!agreed}
          className="flex-[2] py-3 rounded-lg font-semibold text-white transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: "linear-gradient(135deg, var(--color-gold), var(--color-accent))" }}
        >
          {locale === "hi" ? "भुगतान करें →" : "Proceed to Pay →"}
        </button>
      </div>
    </div>
  );
}

// ─── Step 3: Payment ─────────────────────────────────────────
// Sponsor amounts exceed Razorpay per-order limits (₹5L+). Show contact flow instead.
function SponsorContactStep({
  locale,
  formData,
  onBack,
}: {
  locale: AppLocale;
  formData: FormData;
  onBack: () => void;
}) {
  const tier = getTier(formData.category, formData.tier);
  const cat = categories.find((c) => c.value === formData.category);

  return (
    <div className="space-y-5">
      {/* Confirmation card */}
      <div
        className="rounded-xl p-5"
        style={{ background: "linear-gradient(135deg, var(--color-primary), #1a0a00)" }}
      >
        <div className="flex items-start gap-3">
          <div className="text-3xl mt-0.5">✅</div>
          <div>
            <p className="font-bold text-white text-lg">
              {locale === "hi" ? "आपकी रुचि दर्ज की गई!" : "Interest Registered!"}
            </p>
            <p className="text-white/70 text-sm mt-1">
              {locale === "hi"
                ? `${cat?.hi || formData.category} — ${tier?.hi || formData.tier}`
                : `${cat?.en || formData.category} — ${tier?.en || formData.tier}`}
            </p>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div
        className="rounded-xl p-5 space-y-4"
        style={{ backgroundColor: "var(--color-secondary)", border: "1px solid var(--color-border)" }}
      >
        <p className="font-semibold" style={{ color: "var(--color-primary)" }}>
          {locale === "hi" ? "अगले चरण" : "Next Steps"}
        </p>
        <ol className="space-y-2 text-sm" style={{ color: "var(--color-text)" }}>
          <li className="flex gap-2">
            <span className="font-bold" style={{ color: "var(--color-gold)" }}>1.</span>
            <span>
              {locale === "hi"
                ? "हमारी टीम 24 घंटों के भीतर आपसे संपर्क करेगी।"
                : "Our team will contact you within 24 hours to confirm your partnership."}
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold" style={{ color: "var(--color-gold)" }}>2.</span>
            <span>
              {locale === "hi"
                ? "MOU / अनुबंध पर हस्ताक्षर के बाद भुगतान लिंक या बैंक विवरण साझा किया जाएगा।"
                : "After MOU / agreement signing, we'll share a payment link or bank transfer details."}
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold" style={{ color: "var(--color-gold)" }}>3.</span>
            <span>
              {locale === "hi"
                ? "तत्काल सहायता के लिए नीचे दिए नंबर पर संपर्क करें।"
                : "For immediate assistance, contact us on the number below."}
            </span>
          </li>
        </ol>

        <div
          className="rounded-lg p-4 mt-2 flex flex-col gap-2"
          style={{ backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)" }}
        >
          <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: "var(--color-muted)" }}>
            {locale === "hi" ? "संपर्क" : "Contact"}
          </p>
          <a
            href="tel:+919826010000"
            className="font-bold text-lg"
            style={{ color: "var(--color-primary)" }}
          >
            📞 +91 98260 10000
          </a>
          <a
            href="mailto:partnerships@swamirupeshwaranand.com"
            className="text-sm underline"
            style={{ color: "var(--color-muted)" }}
          >
            partnerships@swamirupeshwaranand.com
          </a>
        </div>
      </div>

      <button
        onClick={onBack}
        className="w-full py-2.5 rounded-lg font-medium border transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800 text-sm"
        style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}
      >
        ← {locale === "hi" ? "वापस" : "Back"}
      </button>
    </div>
  );
}

function PaymentStep({
  locale,
  formData,
  onSuccess,
  onBack,
}: {
  locale: AppLocale;
  formData: FormData;
  onSuccess: (res: { bookingId: string; message: string }) => void;
  onBack: () => void;
}) {
  // Sponsor = high-value corporate deals (₹5L–₹1Cr). Razorpay per-order cap exceeded.
  // Show contact/bank-transfer flow instead.
  if (formData.category === "sponsor") {
    return <SponsorContactStep locale={locale} formData={formData} onBack={onBack} />;
  }

  const [paymentData, setPaymentData] = useState<YagyaPaymentResponse | null>(null);
  const [initiating, setInitiating] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tier = getTier(formData.category, formData.tier);
  const deposit = tier ? Math.round(tier.amount / 2) : 0;

  const initiate = useCallback(async () => {
    setInitiating(true);
    setError(null);
    setPaymentData(null);
    try {
      const data = await initiateYagyaPayment({
        amount: deposit,
        category: formData.category,
        tierId: formData.tier,
        name: formData.name,
        email: formData.email || undefined,
        phone: formData.mobile || undefined,
        company: formData.company || undefined,
      });
      setPaymentData(data);
    } catch (e: any) {
      setError(e?.message || "Failed to initiate payment. Please try again.");
    } finally {
      setInitiating(false);
    }
  }, [deposit, formData]);

  useEffect(() => {
    initiate();
  }, [initiate]);

  return (
    <div className="space-y-6">
      {/* Amount reminder */}
      <div
        className="rounded-xl p-4 flex items-center justify-between"
        style={{ background: "linear-gradient(135deg, var(--color-primary), #1a0a00)" }}
      >
        <div>
          <p className="text-white/70 text-sm">{locale === "hi" ? "अभी देय (50% अग्रिम)" : "Payable Now (50% Advance)"}</p>
          <p className="font-bold text-2xl" style={{ color: "var(--color-gold)" }}>
            {formatINR(deposit)}
          </p>
        </div>
        <div className="text-3xl">🔐</div>
      </div>

      {/* States */}
      {initiating && (
        <div className="text-center py-8">
          <div className="animate-spin w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p style={{ color: "var(--color-muted)" }}>
            {locale === "hi" ? "भुगतान तैयार हो रहा है..." : "Preparing payment gateway..."}
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-lg p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm space-y-3">
          <p>{error}</p>
          <button
            onClick={initiate}
            className="font-semibold underline hover:no-underline"
          >
            {locale === "hi" ? "पुनः प्रयास करें" : "Retry"}
          </button>
        </div>
      )}

      {paymentData && !initiating && (
        <RazorpayYagyaCheckout
          paymentData={paymentData}
          category={formData.category}
          participant={{ name: formData.name, email: formData.email, phone: formData.mobile }}
          onSuccess={onSuccess}
          onFailure={(e) => setError(e.message)}
          onDismiss={() => setError(locale === "hi" ? "भुगतान रद्द किया गया। पुनः प्रयास करें।" : "Payment was cancelled. You can retry below.")}
          autoOpen
        />
      )}

      <button
        onClick={onBack}
        className="w-full py-2.5 rounded-lg font-medium border transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800 text-sm"
        style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}
      >
        ← {locale === "hi" ? "वापस" : "Back"}
      </button>
    </div>
  );
}

// ─── Step 4: Success ──────────────────────────────────────────
function SuccessStep({
  locale,
  bookingId,
}: {
  locale: AppLocale;
  bookingId: string;
}) {
  return (
    <div className="text-center py-8 space-y-5">
      <div className="text-6xl mb-2">🎉</div>
      <h3 className="font-heading text-2xl font-bold" style={{ color: "var(--color-primary)" }}>
        {locale === "hi" ? "बुकिंग सफल!" : "Booking Confirmed!"}
      </h3>
      <p style={{ color: "var(--color-muted)" }}>
        {locale === "hi"
          ? "आपका 50% अग्रिम भुगतान सफलतापूर्वक प्राप्त हो गया है। शेष 50% आयोजन स्थल पर देय होगा।"
          : "Your 50% advance deposit has been successfully received. The remaining 50% is payable at the event venue."}
      </p>

      {bookingId && (
        <div
          className="inline-block px-4 py-2 rounded-lg text-sm font-mono"
          style={{ backgroundColor: "var(--color-secondary)", border: "1px solid var(--color-border)" }}
        >
          <span style={{ color: "var(--color-muted)" }}>{locale === "hi" ? "बुकिंग ID: " : "Booking ID: "}</span>
          <span className="font-semibold" style={{ color: "var(--color-primary)" }}>{bookingId}</span>
        </div>
      )}

      <p className="text-sm" style={{ color: "var(--color-muted)" }}>
        {locale === "hi"
          ? "हमारी टीम जल्द ही आपसे संपर्क करेगी।"
          : "Our team will contact you shortly with further details."}
      </p>

      <Link
        href={`/${locale}/maha-yagya`}
        className="inline-block mt-2 px-6 py-3 rounded-lg font-semibold text-white transition-all hover:brightness-110"
        style={{ background: "linear-gradient(135deg, var(--color-gold), var(--color-accent))" }}
      >
        {locale === "hi" ? "मुख्य पृष्ठ पर जाएं" : "Back to Maha Yagya"}
      </Link>
    </div>
  );
}

// ─── Main Wizard ──────────────────────────────────────────────
export default function BookingWizard({ locale }: { locale: AppLocale }) {
  const [step, setStep] = useState<Step>(0);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    company: "",
    mobile: "",
    email: "",
    category: "",
    tier: "",
    message: "",
  });
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [bookingId, setBookingId] = useState("");

  // Pre-fill from tier card buttons and jump to target step
  useEffect(() => {
    function handleSelectStall(e: Event) {
      const detail = (e as CustomEvent).detail;
      if (detail?.category && detail?.tier) {
        setFormData((prev) => ({ ...prev, category: detail.category, tier: detail.tier }));
      } else if (detail?.category) {
        setFormData((prev) => ({ ...prev, category: detail.category, tier: "" }));
      }
      const targetStep = typeof detail?.targetStep === "number" ? detail.targetStep : 0;
      setStep(targetStep as Step);
      document.getElementById("book-stall")?.scrollIntoView({ behavior: "smooth" });
    }
    window.addEventListener("selectStall", handleSelectStall);
    return () => window.removeEventListener("selectStall", handleSelectStall);
  }, []);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    if (name === "category") {
      setFormData((prev) => ({ ...prev, category: value, tier: "" }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  }

  async function handleEnquirySubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const cat = categories.find((c) => c.value === formData.category);
    const tier = getTier(formData.category, formData.tier);
    const catLabel = cat?.en || formData.category;
    const tierLabel = tier?.en || formData.tier;

    // Fire-and-forget support ticket
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
        category: "yagya",
        name: formData.name,
        email: formData.email,
      });
    } catch {
      // Non-blocking — proceed to booking regardless
    }

    setSubmitting(false);
    setStep(1);
  }

  function handleSuccess(res: { bookingId: string; message: string }) {
    setBookingId(res.bookingId);
    setStep(4);
  }

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-sm border border-zinc-100 dark:border-zinc-700">
      <ProgressBar step={step} locale={locale} onStepClick={(i) => setStep(i as Step)} />

      {step === 0 && (
        <EnquiryStep
          locale={locale}
          formData={formData}
          onChange={handleChange}
          onCategoryChange={(v) => setFormData((prev) => ({ ...prev, category: v, tier: "" }))}
          onSubmit={handleEnquirySubmit}
          submitting={submitting}
        />
      )}

      {step === 1 && (
        <SummaryStep
          locale={locale}
          formData={formData}
          onChange={handleChange}
          onBack={() => setStep(0)}
          onNext={() => setStep(2)}
        />
      )}

      {step === 2 && (
        <TermsStep
          locale={locale}
          agreed={termsAgreed}
          onAgreedChange={setTermsAgreed}
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
        />
      )}

      {step === 3 && (
        <PaymentStep
          locale={locale}
          formData={formData}
          onSuccess={handleSuccess}
          onBack={() => { setStep(2); setTermsAgreed(false); }}
        />
      )}

      {step === 4 && (
        <SuccessStep locale={locale} bookingId={bookingId} />
      )}
    </div>
  );
}
