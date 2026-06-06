import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SidebarState {
  isPinned: boolean; // true = always expanded (user pinned it)
  isHovered: boolean; // true = expanded because of hover
}

interface SidebarActions {
  togglePin: () => void;
  setHovered: (hovered: boolean) => void;
  setExpanded: (expanded: boolean) => void;
}

type SidebarStore = SidebarState & SidebarActions & {
  /** Computed: is the sidebar visually expanded? */
  isExpanded: () => boolean;
};

export const useSidebarStore = create<SidebarStore>()(
  persist(
    (set, get) => ({
      isPinned: false,
      isHovered: false,

      isExpanded: () => get().isPinned || get().isHovered,

      togglePin: () => set((s) => ({ isPinned: !s.isPinned, isHovered: false })),

      setHovered: (hovered) => set({ isHovered: hovered }),

      setExpanded: (expanded) => set({ isPinned: expanded, isHovered: false }),
    }),
    {
      name: "litebi-sidebar",
      partialize: (state) => ({ isPinned: state.isPinned }),
    }
  )
);
