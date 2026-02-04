"use client";

import { ComponentProps } from "react";
import clsx from "clsx";
import { motion, HTMLMotionProps } from "motion/react";

type Props = Omit<HTMLMotionProps<"button">, "ref"> & { variant?: "primary" | "secondary" | "outline" };

export function Button({ className, variant = "primary", ...props }: Props) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const styles = {
    primary: "text-white hover:opacity-90 focus:ring-zinc-400 transition-colors duration-300",
    secondary: "bg-white text-black border border-zinc-200 hover:bg-zinc-50 focus:ring-zinc-300 transition-colors duration-300",
    outline: "bg-transparent border-2 border-current hover:bg-black/5 dark:hover:bg-white/5 focus:ring-zinc-300 transition-colors duration-300",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={clsx(base, styles[variant], className)}
      style={variant === "primary" ? { backgroundColor: 'var(--color-primary)', color: 'var(--color-secondary)' } : undefined}
      {...props}
    />
  );
}

export default Button;
