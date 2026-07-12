import { create } from 'zustand';

type HelloStore = {
  message: string;
  setMessage: (msg: string) => void;
};

export const useHelloStore = create<HelloStore>((set) => ({
  message: '',
  setMessage: (msg) => set({ message: msg }),
}));
