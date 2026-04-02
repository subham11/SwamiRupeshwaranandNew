'use client';

import { useState, useEffect, useCallback, PropsWithChildren } from 'react';
import { CurrencyCode, formatPrice } from './currency';
import { CurrencyContext } from './useCurrency';

const STORAGE_KEY = 'preferred-currency';

export function CurrencyProvider({ children }: PropsWithChildren) {
  const [currency, setCurrencyState] = useState<CurrencyCode>('INR');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'USD' || stored === 'INR') {
        setCurrencyState(stored);
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  const setCurrency = useCallback((c: CurrencyCode) => {
    setCurrencyState(c);
    try {
      localStorage.setItem(STORAGE_KEY, c);
    } catch {
      // localStorage unavailable
    }
  }, []);

  const format = useCallback(
    (amountINR: number) => formatPrice(amountINR, currency),
    [currency],
  );

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, format }}>
      {children}
    </CurrencyContext.Provider>
  );
}
