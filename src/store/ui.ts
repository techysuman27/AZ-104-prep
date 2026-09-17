import { create } from 'zustand';

/** Ephemeral UI state shared across the shell (never persisted). */
interface UiState {
  conceptId: string | null;
  openConcept: (id: string) => void;
  closeConcept: () => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
}

export const useUi = create<UiState>()((set) => ({
  conceptId: null,
  openConcept: (id) => set({ conceptId: id }),
  closeConcept: () => set({ conceptId: null }),
  searchOpen: false,
  setSearchOpen: (open) => set({ searchOpen: open }),
  mobileNavOpen: false,
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
}));
