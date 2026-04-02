'use client';

import { createContext, useContext } from 'react';
import { CurrencyCode, formatPrice } from './currency';

export interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  format: (amountINR: number) => string;
}

export const CurrencyContext = createContext<CurrencyContextType>({
  currency: 'INR',
  setCurrency: () => {},
  format: (amount: number) => formatPrice(amount, 'INR'),
});

export function useCurrency(): CurrencyContextType {
  return useContext(CurrencyContext);
}
