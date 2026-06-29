import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

interface SidebarState {
  isPinned: boolean; // true = always expanded (user pinned it)
  isHovered: boolean; // true = expanded because of hover
  isMobileOpen: boolean; // true = mobile sidebar drawer is open
}

interface SidebarActions {
  togglePin: () => void;
  setHovered: (hovered: boolean) => void;
  setExpanded: (expanded: boolean) => void;
  setMobileOpen: (open: boolean) => void;
}

type SidebarStore = SidebarState & SidebarActions & {
  /** Computed: is the sidebar visually expanded? */
  isExpanded: () => boolean;
};

export const useSidebarStore = create<SidebarStore>()(
  devtools(
    persist(
      (set, get) => ({
        isPinned: false,
        isHovered: false,
        isMobileOpen: false,

        isExpanded: () => get().isPinned || get().isHovered,

        togglePin: () => set((s) => ({ isPinned: !s.isPinned, isHovered: false }), false, "sidebar/togglePin"),

        setHovered: (hovered) => set({ isHovered: hovered }, false, "sidebar/setHovered"),

        setExpanded: (expanded) => set({ isPinned: expanded, isHovered: false }, false, "sidebar/setExpanded"),

        setMobileOpen: (open) => set({ isMobileOpen: open }, false, "sidebar/setMobileOpen"),
      }),
      {
        name: "litebi-sidebar",
        partialize: (state) => ({ isPinned: state.isPinned }),
      }
    ),
    {
      name: "sidebar-store",
    }
  )
);
