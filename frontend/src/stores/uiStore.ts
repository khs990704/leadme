import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  currentMilestoneId: string | null;
  wizardStep: number;

  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setCurrentMilestoneId: (id: string | null) => void;
  setWizardStep: (step: number) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  currentMilestoneId: null,
  wizardStep: 0,

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setCurrentMilestoneId: (id) => set({ currentMilestoneId: id }),
  setWizardStep: (step) => set({ wizardStep: step }),
}));
