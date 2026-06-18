import { create } from 'zustand';

interface UIState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  isRBACModalOpen: boolean;
  toggleRBACModal: (open?: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  isRBACModalOpen: false,
  toggleRBACModal: (open) =>
    set((state) => ({
      isRBACModalOpen: open !== undefined ? open : !state.isRBACModalOpen,
    })),
}));
