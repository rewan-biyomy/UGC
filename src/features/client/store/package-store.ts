import { create } from "zustand";
import type { PortfolioItem } from "@/components/core/models/PortfolioItem";

interface PackageState {
  items: PortfolioItem[];
  add: (item: PortfolioItem) => void;
  remove: (id: string) => void;
  clear: () => void;
}

export const usePackageStore = create<PackageState>((set) => ({
  items: [],
  add: (item) => set((state) => state.items.some((existing) => existing.id === item.id)
    ? state
    : { items: [...state.items, item] }),
  remove: (id) => set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
  clear: () => set({ items: [] }),
}));