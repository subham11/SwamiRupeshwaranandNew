import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      // Custom fonts inspired by spiritual websites
      fontFamily: {
        heading: ['Cormorant Garamond', 'Noto Sans Devanagari', 'Georgia', 'serif'],
        body: ['Inter', 'Noto Sans Devanagari', 'system-ui', 'sans-serif'],
        devanagari: ['Noto Sans Devanagari', 'sans-serif'],
      },
      // Theme-aware colors using CSS variables
      colors: {
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        accent: 'var(--color-accent)',
        background: 'var(--color-background)',
        foreground: 'var(--color-foreground)',
        muted: 'var(--color-muted)',
        gold: 'var(--color-gold)',
        border: 'var(--color-border)',
        // Additional spiritual colors
        sacred: {
          maroon: '#8B1A3D',
          gold: '#D4A853',
          saffron: '#E65100',
          orange: '#FF9800',
          blue: '#1A237E',
          indigo: '#3F51B5',
        },
      },
      // Custom spacing for sections
      spacing: {
        'section': '5rem',
        'section-sm': '3rem',
        'section-lg': '8rem',
      },
      // Sacred border radius
      borderRadius: {
        'sacred': '0.5rem',
        'sacred-lg': '1rem',
      },
      // Typography scale
      fontSize: {
        'display': ['4rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-sm': ['3rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'heading': ['2.5rem', { lineHeight: '1.2' }],
        'heading-sm': ['1.875rem', { lineHeight: '1.3' }],
        'subheading': ['1.5rem', { lineHeight: '1.4' }],
      },
      // Shadows for cards
      boxShadow: {
        'sacred': '0 4px 20px -2px rgba(0, 0, 0, 0.08)',
        'sacred-hover': '0 20px 40px -10px rgba(0, 0, 0, 0.15)',
        'golden': '0 4px 20px -2px rgba(218, 165, 32, 0.2)',
      },
      // Animation keyframes
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in-left': {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'pulse-gold': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(218, 165, 32, 0.4)' },
          '50%': { boxShadow: '0 0 0 10px rgba(218, 165, 32, 0)' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.6s ease-out',
        'fade-in': 'fade-in 0.4s ease-out',
        'slide-in-left': 'slide-in-left 0.5s ease-out',
        'pulse-gold': 'pulse-gold 2s ease-in-out infinite',
      },
      // Background patterns
      backgroundImage: {
        'sacred-gradient': 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
        'gold-gradient': 'linear-gradient(135deg, var(--color-gold), var(--color-accent))',
        'subtle-pattern': 'radial-gradient(circle at 25% 25%, var(--color-gold) 1px, transparent 1px)',
      },
    }
  },
  plugins: []
} satisfies Config;
