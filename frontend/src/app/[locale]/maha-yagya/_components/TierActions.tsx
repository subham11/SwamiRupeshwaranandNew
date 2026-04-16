"use client";

import type { AppLocale } from "@/i18n/config";

interface TierActionsProps {
  locale: AppLocale;
  categoryId: string;
  tierId: string;
  hasPrice: boolean;
  isYajaman: boolean;
}

function dispatch(category: string, tier: string, targetStep: number) {
  window.dispatchEvent(
    new CustomEvent("selectStall", { detail: { category, tier, targetStep } })
  );
  document.getElementById("book-stall")?.scrollIntoView({ behavior: "smooth" });
}

export default function TierActions({
  locale,
  categoryId,
  tierId,
  hasPrice,
  isYajaman,
}: TierActionsProps) {
  if (!hasPrice) {
    return (
      <button
        onClick={() => dispatch(categoryId, tierId, 0)}
        className="yagya-cta-btn-grey block w-full py-3 rounded-lg font-semibold text-center transition-all hover:-translate-y-0.5"
      >
        {locale === "hi" ? "रुचि दर्ज करें" : "Register Interest"}
      </button>
    );
  }

  const enquireLabel = isYajaman
    ? (locale === "hi" ? "यज्ञमान बनें" : "Join as Yagyaman")
    : (locale === "hi" ? "अभी पूछें" : "Enquire Now");

  const bookLabel = locale === "hi" ? "अभी बुक करें" : "Book Now";

  return (
    <div className="flex gap-2">
      <button
        onClick={() => dispatch(categoryId, tierId, 0)}
        className="flex-1 py-2.5 rounded-lg font-semibold text-center text-sm border transition-all hover:-translate-y-0.5"
        style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}
      >
        {enquireLabel}
      </button>
      <button
        onClick={() => dispatch(categoryId, tierId, 2)}
        className="flex-1 yagya-cta-btn py-2.5 rounded-lg font-semibold text-center text-sm transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,0,0,0.15)]"
      >
        {bookLabel}
      </button>
    </div>
  );
}
