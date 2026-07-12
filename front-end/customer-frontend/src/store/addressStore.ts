import { create } from 'zustand';
import { Address } from '@/types/customer';

interface AddressStore {
  addresses: Address[];
  setAddresses: (addresses: Address[]) => void;
  appendAddress: (address: Address) => void;
  clearAddresses: () => void;
}

export const useAddressStore = create<AddressStore>((set) => ({
  addresses: [],
  setAddresses: (addresses) => set({ addresses: Array.isArray(addresses) ? addresses : [] }),
  appendAddress: (address) =>
    set((state) => ({ addresses: [...state.addresses, address] })),
  clearAddresses: () => set({ addresses: [] }),
}));
