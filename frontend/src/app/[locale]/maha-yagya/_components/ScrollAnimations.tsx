"use client";

import { useRef } from "react";
import { motion, useInView } from "motion/react";
import type { ReactNode } from "react";

/* ─── Fade-up on scroll (sections, headings, text blocks) ─── */
export function FadeUp({
  children,
  delay = 0,
  y = 50,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-10% 0px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Staggered cards grid wrapper ─── */
export function StaggerContainer({
  children,
  className,
  stagger = 0.12,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-5% 0px" });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: stagger } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Individual stagger child — card with hover lift ─── */
export function StaggerCard({
  children,
  className,
  hoverLift = true,
}: {
  children: ReactNode;
  className?: string;
  hoverLift?: boolean;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0 },
      }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={
        hoverLift
          ? { y: -6, scale: 1.02, transition: { duration: 0.25, ease: "easeOut" } }
          : undefined
      }
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Scale pop with bounce (stat numbers, values) ─── */
export function ScalePop({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-10% 0px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.7 }}
      animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.7 }}
      transition={{
        duration: 0.5,
        delay,
        type: "spring",
        stiffness: 300,
        damping: 15,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Icon bounce-in (scale from 0 with spring) ─── */
export function IconPop({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.span
      variants={{
        hidden: { opacity: 0, scale: 0 },
        visible: { opacity: 1, scale: 1 },
      }}
      transition={{
        duration: 0.5,
        delay,
        type: "spring",
        stiffness: 350,
        damping: 12,
      }}
      className={className}
    >
      {children}
    </motion.span>
  );
}

/* ─── Slide-in from right (sidebar text) ─── */
export function SlideRight({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-10% 0px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: 60 }}
      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 60 }}
      transition={{ duration: 0.8, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Tier card with premium hover glow effect ─── */
export function TierCard({
  children,
  popular,
  className,
}: {
  children: ReactNode;
  popular?: boolean;
  className?: string;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0 },
      }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{
        y: -8,
        scale: 1.03,
        boxShadow: popular
          ? "0 20px 40px rgba(234,179,8,0.25), 0 0 0 1px rgba(234,179,8,0.15)"
          : "0 20px 40px rgba(0,0,0,0.12)",
        transition: { duration: 0.3, ease: "easeOut" },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
