// Theme system inspired by:
// - omswami.org (Sacred Maroon & Gold)
// - isha.sadhguru.org (Saffron & Earth)
// - gurudev.artofliving.org (Royal Blue & White)

export type ThemeName = "sacredGold" | "saffronEarth" | "royalBlue" | "sacredMaroon" | "divineWhite";

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  muted: string;
  gold: string;
  border: string;
}

export interface Theme {
  name: ThemeName;
  label: string;
  labelHi: string;
  colors: ThemeColors;
  css: string;
}

export const themes: Record<ThemeName, Theme> = {
  // Inspired by omswami.org - Deep maroon with sacred gold accents
  sacredMaroon: {
    name: "sacredMaroon",
    label: "Sacred Maroon",
    labelHi: "पवित्र मैरून",
    colors: {
      primary: "#8B1A3D",      // Deep maroon
      secondary: "#FDF7F8",    // Soft blush
      accent: "#D4A853",       // Sacred gold
      background: "#FEFCFC",   // Off-white
      foreground: "#2D1B1E",   // Deep brown
      muted: "#6B4E54",        // Muted rose
      gold: "#D4A853",         // Gold accent
      border: "#E8D4D8"        // Soft border
    },
    css: `
      --color-primary: #8B1A3D;
      --color-secondary: #FDF7F8;
      --color-accent: #D4A853;
      --color-accent-rgb: 212, 168, 83;
      --color-background: #FEFCFC;
      --color-foreground: #2D1B1E;
      --color-muted: #6B4E54;
      --color-gold: #D4A853;
      --color-border: #E8D4D8;
    `
  },
  // Inspired by isha.sadhguru.org - Saffron with earth tones
  saffronEarth: {
    name: "saffronEarth",
    label: "Saffron Earth",
    labelHi: "केसरिया",
    colors: {
      primary: "#E65100",      // Deep saffron
      secondary: "#FFF8F0",    // Warm cream
      accent: "#FF9800",       // Bright orange
      background: "#FFFAF5",   // Warm white
      foreground: "#3E2723",   // Earth brown
      muted: "#795548",        // Medium brown
      gold: "#FFB74D",         // Golden orange
      border: "#FFE0B2"        // Soft orange border
    },
    css: `
      --color-primary: #E65100;
      --color-secondary: #FFF8F0;
      --color-accent: #FF9800;
      --color-accent-rgb: 255, 152, 0;
      --color-background: #FFFAF5;
      --color-foreground: #3E2723;
      --color-muted: #795548;
      --color-gold: #FFB74D;
      --color-border: #FFE0B2;
    `
  },
  // Inspired by gurudev.artofliving.org - Royal blue with white
  royalBlue: {
    name: "royalBlue",
    label: "Royal Blue",
    labelHi: "नीला",
    colors: {
      primary: "#1A237E",      // Deep blue
      secondary: "#F5F7FF",    // Soft blue tint
      accent: "#3F51B5",       // Indigo
      background: "#FFFFFF",   // Pure white
      foreground: "#1A1A2E",   // Near black
      muted: "#5C6BC0",        // Light indigo
      gold: "#FFC107",         // Bright gold
      border: "#C5CAE9"        // Light indigo border
    },
    css: `
      --color-primary: #1A237E;
      --color-secondary: #F5F7FF;
      --color-accent: #3F51B5;
      --color-accent-rgb: 63, 81, 181;
      --color-background: #FFFFFF;
      --color-foreground: #1A1A2E;
      --color-muted: #5C6BC0;
      --color-gold: #FFC107;
      --color-border: #C5CAE9;
    `
  },
  // Sacred Gold - Classic spiritual gold theme
  sacredGold: {
    name: "sacredGold",
    label: "Sacred Gold",
    labelHi: "स्वर्ण",
    colors: {
      primary: "#B8860B",      // Dark gold
      secondary: "#FEF9EF",    // Cream
      accent: "#DAA520",       // Goldenrod
      background: "#FFFBF0",   // Ivory
      foreground: "#3D2914",   // Dark brown
      muted: "#8B7355",        // Tan
      gold: "#FFD700",         // Pure gold
      border: "#EED9A4"        // Pale gold border
    },
    css: `
      --color-primary: #B8860B;
      --color-secondary: #FEF9EF;
      --color-accent: #DAA520;
      --color-accent-rgb: 218, 165, 32;
      --color-background: #FFFBF0;
      --color-foreground: #3D2914;
      --color-muted: #8B7355;
      --color-gold: #FFD700;
      --color-border: #EED9A4;
    `
  },
  // Divine White - Clean minimal spiritual theme
  divineWhite: {
    name: "divineWhite",
    label: "Divine White",
    labelHi: "दिव्य श्वेत",
    colors: {
      primary: "#2C3E50",      // Dark slate
      secondary: "#F8F9FA",    // Light gray
      accent: "#8E44AD",       // Purple
      background: "#FFFFFF",   // Pure white
      foreground: "#2C3E50",   // Dark slate
      muted: "#7F8C8D",        // Gray
      gold: "#F39C12",         // Warm gold
      border: "#ECF0F1"        // Light border
    },
    css: `
      --color-primary: #2C3E50;
      --color-secondary: #F8F9FA;
      --color-accent: #8E44AD;
      --color-accent-rgb: 142, 68, 173;
      --color-background: #FFFFFF;
      --color-foreground: #2C3E50;
      --color-muted: #7F8C8D;
      --color-gold: #F39C12;
      --color-border: #ECF0F1;
    `
  }
};

// Default theme
export const defaultTheme: ThemeName = "sacredGold";

export const themeList = Object.values(themes);
