import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
    }),
    { name: "auth-storage" }
  )
);

interface StudioState {
  garmentUrl: string | null;
  selectedModelId: string | null;
  isBatchMode: boolean;
  batchModelIds: string[];
  setGarmentUrl: (url: string | null) => void;
  setSelectedModelId: (id: string | null) => void;
  setIsBatchMode: (batch: boolean) => void;
  toggleBatchModel: (id: string) => void;
  reset: () => void;
}

export const useStudioStore = create<StudioState>()((set, get) => ({
  garmentUrl: null,
  selectedModelId: null,
  isBatchMode: false,
  batchModelIds: [],
  setGarmentUrl: (url) => set({ garmentUrl: url }),
  setSelectedModelId: (id) => set({ selectedModelId: id }),
  setIsBatchMode: (isBatchMode) => set({ isBatchMode, batchModelIds: [] }),
  toggleBatchModel: (id) => {
    const current = get().batchModelIds;
    if (current.includes(id)) {
      set({ batchModelIds: current.filter((m) => m !== id) });
    } else if (current.length < 10) {
      set({ batchModelIds: [...current, id] });
    }
  },
  reset: () =>
    set({
      garmentUrl: null,
      selectedModelId: null,
      isBatchMode: false,
      batchModelIds: [],
    }),
}));
