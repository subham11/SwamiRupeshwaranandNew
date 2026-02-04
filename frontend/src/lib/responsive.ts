/**
 * Responsive Utility Classes and Hooks
 * 
 * Provides consistent responsive behavior across the app.
 * Tailwind breakpoints:
 * - sm: 640px
 * - md: 768px  
 * - lg: 1024px
 * - xl: 1280px
 * - 2xl: 1536px
 */

"use client";

import { useState, useEffect } from "react";

// Breakpoint values (must match Tailwind config)
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

type Breakpoint = keyof typeof breakpoints;

/**
 * Hook to detect current breakpoint
 */
export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<Breakpoint | "xs">("xs");
  const [width, setWidth] = useState(0);

  useEffect(() => {
    function updateBreakpoint() {
      const w = window.innerWidth;
      setWidth(w);

      if (w >= breakpoints["2xl"]) {
        setBreakpoint("2xl");
      } else if (w >= breakpoints.xl) {
        setBreakpoint("xl");
      } else if (w >= breakpoints.lg) {
        setBreakpoint("lg");
      } else if (w >= breakpoints.md) {
        setBreakpoint("md");
      } else if (w >= breakpoints.sm) {
        setBreakpoint("sm");
      } else {
        setBreakpoint("xs");
      }
    }

    updateBreakpoint();
    window.addEventListener("resize", updateBreakpoint);
    return () => window.removeEventListener("resize", updateBreakpoint);
  }, []);

  return { breakpoint, width };
}

/**
 * Hook to check if screen is mobile
 */
export function useIsMobile() {
  const { width } = useBreakpoint();
  return width > 0 && width < breakpoints.md;
}

/**
 * Hook to check if screen is tablet
 */
export function useIsTablet() {
  const { width } = useBreakpoint();
  return width >= breakpoints.md && width < breakpoints.lg;
}

/**
 * Hook to check if screen is desktop
 */
export function useIsDesktop() {
  const { width } = useBreakpoint();
  return width >= breakpoints.lg;
}

/**
 * Hook for media query matching
 */
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    function handleChange(e: MediaQueryListEvent) {
      setMatches(e.matches);
    }

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [query]);

  return matches;
}

/**
 * Responsive grid column classes
 */
export const gridCols = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
  6: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
} as const;

/**
 * Responsive spacing classes
 */
export const spacing = {
  section: "py-12 sm:py-16 md:py-20 lg:py-24",
  sectionSm: "py-8 sm:py-12 md:py-16",
  container: "px-4 sm:px-6 lg:px-8",
  gap: "gap-4 sm:gap-6 lg:gap-8",
  gapSm: "gap-3 sm:gap-4 lg:gap-6",
} as const;

/**
 * Responsive text size classes
 */
export const textSizes = {
  hero: "text-3xl sm:text-4xl md:text-5xl lg:text-6xl",
  h1: "text-2xl sm:text-3xl md:text-4xl lg:text-5xl",
  h2: "text-xl sm:text-2xl md:text-3xl lg:text-4xl",
  h3: "text-lg sm:text-xl md:text-2xl",
  h4: "text-base sm:text-lg md:text-xl",
  body: "text-sm sm:text-base",
  small: "text-xs sm:text-sm",
} as const;

/**
 * Combine class names utility
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
