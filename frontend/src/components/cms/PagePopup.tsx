"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import type { AppLocale } from "@/i18n/config";

interface PagePopupProps {
  componentId: string;
  popupType: "image_only" | "image_with_text" | string;
  image: string;
  title?: string;
  description?: string;
  ctaText?: string;
  ctaLink?: string;
  delayMs?: number;
  showOnce?: boolean;
  animationStyle?: "fade" | "slide-up" | "scale" | "blur-in" | string;
  overlayColor?: string;
  locale: AppLocale;
}

const animationVariants: Record<string, { initial: any; animate: any; exit: any }> = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  "slide-up": {
    initial: { opacity: 0, y: 100 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 100 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 },
  },
  "blur-in": {
    initial: { opacity: 0, filter: "blur(10px)" },
    animate: { opacity: 1, filter: "blur(0px)" },
    exit: { opacity: 0, filter: "blur(10px)" },
  },
};

export default function PagePopup({
  componentId,
  popupType = "image_with_text",
  image,
  title,
  description,
  ctaText,
  ctaLink,
  delayMs = 2000,
  showOnce = true,
  animationStyle = "scale",
  overlayColor = "rgba(0,0,0,0.6)",
}: PagePopupProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storageKey = `popup_dismissed_${componentId}`;
    if (showOnce && sessionStorage.getItem(storageKey)) return;

    const timer = setTimeout(() => setIsVisible(true), delayMs);
    return () => clearTimeout(timer);
  }, [componentId, delayMs, showOnce]);

  function dismiss() {
    setIsVisible(false);
    if (showOnce && typeof window !== "undefined") {
      sessionStorage.setItem(`popup_dismissed_${componentId}`, "1");
    }
  }

  const variant = animationVariants[animationStyle] || animationVariants.scale;
  const isImageOnly = popupType === "image_only";

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: overlayColor }}
          onClick={dismiss}
        >
          <motion.div
            initial={variant.initial}
            animate={variant.animate}
            exit={variant.exit}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`relative bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl overflow-hidden max-w-lg w-full ${
              isImageOnly ? "" : "max-h-[90vh] overflow-y-auto"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={dismiss}
              className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              aria-label="Close"
            >
              ✕
            </button>

            {/* Image */}
            {image && (
              <div className={`relative w-full ${isImageOnly ? "aspect-auto" : "aspect-video"}`}>
                <Image
                  src={image}
                  alt={title || "Popup"}
                  fill={!isImageOnly}
                  width={isImageOnly ? 600 : undefined}
                  height={isImageOnly ? 400 : undefined}
                  className={isImageOnly ? "w-full h-auto" : "object-cover"}
                />
              </div>
            )}

            {/* Text Content */}
            {!isImageOnly && (title || description || ctaText) && (
              <div className="p-6 sm:p-8">
                {title && (
                  <motion.h3
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="font-heading text-xl sm:text-2xl font-bold mb-3"
                    style={{ color: "var(--color-primary)" }}
                  >
                    {title}
                  </motion.h3>
                )}
                {description && (
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-sm sm:text-base mb-4"
                    style={{ color: "var(--color-muted)" }}
                  >
                    {description}
                  </motion.p>
                )}
                {ctaText && ctaLink && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <a
                      href={ctaLink}
                      className="inline-block px-6 py-3 rounded-lg font-semibold text-white transition-all hover:brightness-110"
                      style={{
                        background: "linear-gradient(135deg, var(--color-gold), var(--color-accent))",
                      }}
                    >
                      {ctaText}
                    </a>
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
