'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  Cart,
  CartItem,
  fetchCart,
  addToCart as apiAddToCart,
  updateCartItem as apiUpdateCartItem,
  removeFromCart as apiRemoveFromCart,
  clearCart as apiClearCart,
} from '@/lib/api';
import { useAuth } from '@/lib/useAuth';

interface CartContextType {
  cart: Cart | null;
  loading: boolean;
  error: string | null;
  addToCart: (productId: string, quantity?: number) => Promise<boolean>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  clearAll: () => Promise<void>;
  refreshCart: () => Promise<void>;
  totalItems: number;
}

const CartContext = createContext<CartContextType>({
  cart: null,
  loading: false,
  error: null,
  addToCart: async () => false,
  updateQuantity: async () => {},
  removeItem: async () => {},
  clearAll: async () => {},
  refreshCart: async () => {},
  totalItems: 0,
});

export function useCart() {
  return useContext(CartContext);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { accessToken, isAuthenticated } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshCart = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      setError(null);
      const data = await fetchCart(accessToken);
      setCart(data);
    } catch (err) {
      // Don't set error for initial load - cart may just be empty
      setCart({ items: [], totalItems: 0, totalAmount: 0, currency: 'INR' });
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  // Load cart when authenticated
  useEffect(() => {
    if (isAuthenticated && accessToken) {
      refreshCart();
    } else {
      setCart(null);
    }
  }, [isAuthenticated, accessToken, refreshCart]);

  const addToCart = useCallback(
    async (productId: string, quantity: number = 1): Promise<boolean> => {
      if (!accessToken) return false;
      try {
        setError(null);
        const data = await apiAddToCart(productId, quantity, accessToken);
        setCart(data);
        return true;
      } catch (err: any) {
        setError(err.message || 'Failed to add to cart');
        return false;
      }
    },
    [accessToken],
  );

  const updateQuantity = useCallback(
    async (productId: string, quantity: number) => {
      if (!accessToken) return;
      try {
        setError(null);
        const data = await apiUpdateCartItem(productId, quantity, accessToken);
        setCart(data);
      } catch (err: any) {
        setError(err.message || 'Failed to update quantity');
      }
    },
    [accessToken],
  );

  const removeItem = useCallback(
    async (productId: string) => {
      if (!accessToken) return;
      try {
        setError(null);
        const data = await apiRemoveFromCart(productId, accessToken);
        setCart(data);
      } catch (err: any) {
        setError(err.message || 'Failed to remove item');
      }
    },
    [accessToken],
  );

  const clearAll = useCallback(async () => {
    if (!accessToken) return;
    try {
      setError(null);
      const data = await apiClearCart(accessToken);
      setCart(data);
    } catch (err: any) {
      setError(err.message || 'Failed to clear cart');
    }
  }, [accessToken]);

  const totalItems = cart?.totalItems || 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        error,
        addToCart,
        updateQuantity,
        removeItem,
        clearAll,
        refreshCart,
        totalItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
