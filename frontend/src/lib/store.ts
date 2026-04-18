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
  garmentDetailUrls: string[];
  selectedModelId: string | null;
  isBatchMode: boolean;
  batchModelIds: string[];
  glassesUrl: string | null;
  studioMode: "kiyafet" | "eyewear" | "video" | "ghost" | "nano";
  videoImageUrls: string[];
  videoMode: "image_to_video" | "reference_to_video";
  ghostInputUrl: string | null;
  setGarmentUrl: (url: string | null) => void;
  setGarmentDetailUrls: (urls: string[]) => void;
  setSelectedModelId: (id: string | null) => void;
  setIsBatchMode: (batch: boolean) => void;
  toggleBatchModel: (id: string) => void;
  setGlassesUrl: (url: string | null) => void;
  setStudioMode: (mode: "kiyafet" | "eyewear" | "video" | "ghost" | "nano") => void;
  setVideoImageUrls: (urls: string[]) => void;
  setVideoMode: (mode: "image_to_video" | "reference_to_video") => void;
  setGhostInputUrl: (url: string | null) => void;
  reset: () => void;
}

export const useStudioStore = create<StudioState>()((set, get) => ({
  garmentUrl: null,
  garmentDetailUrls: [],
  selectedModelId: null,
  isBatchMode: false,
  batchModelIds: [],
  glassesUrl: null,
  studioMode: "kiyafet",
  videoImageUrls: [],
  videoMode: "image_to_video",
  ghostInputUrl: null,
  setGarmentUrl: (url) => set({ garmentUrl: url }),
  setGarmentDetailUrls: (urls) => set({ garmentDetailUrls: urls }),
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
  setGlassesUrl: (url) => set({ glassesUrl: url }),
  setStudioMode: (mode) => set({ studioMode: mode }),
  setVideoImageUrls: (urls) => set({ videoImageUrls: urls }),
  setVideoMode: (mode) => set({ videoMode: mode }),
  setGhostInputUrl: (url) => set({ ghostInputUrl: url }),
  reset: () =>
    set({
      garmentUrl: null,
      garmentDetailUrls: [],
      selectedModelId: null,
      isBatchMode: false,
      batchModelIds: [],
      glassesUrl: null,
      studioMode: "kiyafet",
      videoImageUrls: [],
      videoMode: "image_to_video",
      ghostInputUrl: null,
    }),
}));
