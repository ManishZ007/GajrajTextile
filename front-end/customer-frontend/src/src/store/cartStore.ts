import { create } from 'zustand';
import { clientFetch } from '@/lib/clientFetch';
import { AddToCartPayload, CartResponse } from '@/types/cart';

interface CartStore {
  totalItems: number;
  summaryFetched: boolean;

  fetchSummary: () => Promise<void>;
  addItem: (payload: AddToCartPayload) => Promise<{ success: boolean; cart?: CartResponse }>;
  updateItem: (cartItemId: string, action: 'INCREASE' | 'DECREASE' | 'SET', quantity: number) => Promise<CartResponse | null>;
  removeItem: (cartItemId: string) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
  setTotalItems: (n: number) => void;
}

export const useCartStore = create<CartStore>((set, get) => ({
  totalItems: 0,
  summaryFetched: false,

  setTotalItems: (n) => set({ totalItems: n }),

  fetchSummary: async () => {
    if (get().summaryFetched) return;
    try {
      const res = await clientFetch('/api/cart/summary');
      if (!res.ok) return;
      const data = await res.json();
      set({ totalItems: data.totalItems ?? 0, summaryFetched: true });
    } catch {
      set({ summaryFetched: true });
    }
  },

  addItem: async (payload) => {
    try {
      const res = await clientFetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) return { success: false };
      const cart: CartResponse = await res.json();
      set({ totalItems: cart.totalItems });
      return { success: true, cart };
    } catch {
      return { success: false };
    }
  },

  updateItem: async (cartItemId, action, quantity) => {
    try {
      const res = await clientFetch(`/api/cart/item/${cartItemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, quantity }),
      });
      if (!res.ok) return null;
      const cart: CartResponse = await res.json();
      set({ totalItems: cart.totalItems });
      return cart;
    } catch {
      return null;
    }
  },

  removeItem: async (cartItemId) => {
    try {
      const res = await clientFetch(`/api/cart/item/${cartItemId}`, { method: 'DELETE' });
      if (!res.ok) return false;
      set((s) => ({ totalItems: Math.max(0, s.totalItems - 1) }));
      return true;
    } catch {
      return false;
    }
  },

  clearCart: async () => {
    try {
      const res = await clientFetch('/api/cart/clear', { method: 'DELETE' });
      if (!res.ok) return false;
      set({ totalItems: 0 });
      return true;
    } catch {
      return false;
    }
  },
}));
