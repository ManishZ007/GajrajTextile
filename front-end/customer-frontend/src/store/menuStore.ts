import { clientFetch } from '@/lib/clientFetch';
import { create } from 'zustand';

export interface MenuItem {
  categoryId: string;
  name: string;
  description: string | null;
  baseImageUrl: string | null;
  baseTitle: string | null;
  baseShortDescription: string | null;
  baseDescription: string | null;
  productCount: number;
  customizable: boolean;
  baseModelUrl: string | null;
  createdAt: string;
}

interface MenuStore {
  items: MenuItem[];
  loaded: boolean;
  fetchItems: () => Promise<void>;
}

export const useMenuStore = create<MenuStore>((set, get) => ({
  items: [],
  loaded: false,

  fetchItems: async () => {
    if (get().loaded) return;
    try {
      const res = await clientFetch('/api/products/categories');
      const data = await res.json();
      // console.log(data);
      set({ items: Array.isArray(data) ? data : [], loaded: true });
    } catch {
      set({ loaded: true });
    }
  },
}));
