import { create } from "zustand";
import { devtools } from "zustand/middleware";

export type MobileTab = "chat" | "preview" | "tools";

interface UiState {
  activeMobileTab: MobileTab;
  isPreviewLoading: boolean;
  setActiveMobileTab: (tab: MobileTab) => void;
  setPreviewLoading: (loading: boolean) => void;
}

export const useUiStore = create<UiState>()(
  devtools(
    (set) => ({
      activeMobileTab: "chat",
      isPreviewLoading: false,
      setActiveMobileTab: (tab) => set({ activeMobileTab: tab }),
      setPreviewLoading: (loading) => set({ isPreviewLoading: loading }),
    }),
    { name: "ui-store" }
  )
);
