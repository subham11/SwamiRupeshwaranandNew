"use client";

import { useState, useEffect } from "react";
import type { AppLocale } from "@/i18n/config";

interface CountdownTimerProps {
  eventDate: string;
  locale: AppLocale;
}

function calculateTimeLeft(eventDate: string) {
  const diff = new Date(eventDate).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

const labels = {
  en: { days: "Days", hours: "Hours", minutes: "Minutes", seconds: "Seconds" },
  hi: { days: "दिन", hours: "घंटे", minutes: "मिनट", seconds: "सेकंड" },
};

export default function CountdownTimer({ eventDate, locale }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(eventDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(eventDate));
    }, 1000);
    return () => clearInterval(timer);
  }, [eventDate]);

  const units = [
    { value: timeLeft.days, label: labels[locale].days },
    { value: timeLeft.hours, label: labels[locale].hours },
    { value: timeLeft.minutes, label: labels[locale].minutes },
    { value: timeLeft.seconds, label: labels[locale].seconds },
  ];

  return (
    <div className="flex justify-center gap-3 sm:gap-4 md:gap-6">
      {units.map((unit) => (
        <div
          key={unit.label}
          className="flex flex-col items-center rounded-xl p-3 sm:p-4 md:p-6 min-w-[70px] sm:min-w-[90px]"
          style={{
            backgroundColor: "var(--color-secondary)",
            border: "1px solid var(--color-border)",
          }}
        >
          <span
            suppressHydrationWarning
            className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold"
            style={{ color: "var(--color-primary)" }}
          >
            {String(unit.value).padStart(2, "0")}
          </span>
          <span
            className="text-xs sm:text-sm mt-1 font-medium uppercase tracking-wider"
            style={{ color: "var(--color-muted)" }}
          >
            {unit.label}
          </span>
        </div>
      ))}
    </div>
  );
}
