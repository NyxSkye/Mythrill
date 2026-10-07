import { create } from "zustand";

type BookState = {
  currentIndex: number;
  totalPages: number;
  setTotal: (n: number) => void;
  next: () => void;
  prev: () => void;
};

export const useBookStore = create<BookState>((set) => ({
  currentIndex: 0,
  totalPages: 0,
  setTotal: (n) => set({ totalPages: n }),
  next: () => set((s) => ({ currentIndex: Math.min(s.currentIndex + 1, s.totalPages) })),
  prev: () => set((s) => ({ currentIndex: Math.max(s.currentIndex - 1, 0) })),
}));