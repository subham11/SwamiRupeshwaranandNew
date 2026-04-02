export type CurrencyCode = 'INR' | 'USD';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  locale: string;
  rate: number; // Exchange rate relative to INR (INR = 1)
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  INR: { code: 'INR', symbol: '\u20B9', name: 'Indian Rupee', locale: 'en-IN', rate: 1 },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US', rate: 0.012 }, // ~1 INR = 0.012 USD
};

export function formatPrice(amountInINR: number, currency: CurrencyCode = 'INR'): string {
  const config = CURRENCIES[currency];
  const converted = amountInINR * config.rate;
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.code,
    minimumFractionDigits: currency === 'INR' ? 0 : 2,
    maximumFractionDigits: currency === 'INR' ? 0 : 2,
  }).format(converted);
}

export function convertPrice(amountInINR: number, currency: CurrencyCode): number {
  return Math.round(amountInINR * CURRENCIES[currency].rate * 100) / 100;
}
