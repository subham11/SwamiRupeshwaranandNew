'use client';

import { useState, useRef, useEffect } from 'react';
import { useCurrency } from '@/lib/useCurrency';
import { CURRENCIES, CurrencyCode } from '@/lib/currency';

const CURRENCY_OPTIONS: { code: CurrencyCode; flag: string }[] = [
  { code: 'INR', flag: '\uD83C\uDDEE\uD83C\uDDF3' },
  { code: 'USD', flag: '\uD83C\uDDFA\uD83C\uDDF8' },
];

export default function CurrencySwitcher() {
  const { currency, setCurrency } = useCurrency();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [open]);

  const current = CURRENCY_OPTIONS.find((o) => o.code === currency) || CURRENCY_OPTIONS[0];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
        style={{ borderColor: 'var(--color-border, #e5e7eb)' }}
        aria-label="Switch currency"
        title="Switch currency"
        data-testid="currency-switcher"
      >
        <span className="text-sm leading-none">{current.flag}</span>
        <span style={{ color: 'var(--color-text-secondary, #6b7280)' }}>{current.code}</span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
          style={{ color: 'var(--color-muted, #9ca3af)' }}
        >
          <path d="M2 4l3 3 3-3" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1 z-50 min-w-[120px] rounded-lg border bg-white shadow-lg dark:bg-gray-800"
          style={{ borderColor: 'var(--color-border, #e5e7eb)' }}
        >
          {CURRENCY_OPTIONS.map((opt) => (
            <button
              key={opt.code}
              onClick={() => {
                setCurrency(opt.code);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-xs font-medium transition-colors first:rounded-t-lg last:rounded-b-lg ${
                currency === opt.code
                  ? 'bg-amber-50 dark:bg-amber-900/20'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <span className="text-sm leading-none">{opt.flag}</span>
              <span
                className="flex-1 text-left"
                style={{
                  color: currency === opt.code
                    ? 'var(--color-gold, #d97706)'
                    : 'var(--color-text-secondary, #6b7280)',
                }}
              >
                {opt.code}
              </span>
              <span
                className="text-[10px]"
                style={{ color: 'var(--color-muted, #9ca3af)' }}
              >
                {CURRENCIES[opt.code].symbol}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
