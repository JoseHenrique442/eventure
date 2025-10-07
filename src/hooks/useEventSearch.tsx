import { create } from 'zustand';

interface EventSearchState {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export const useEventSearch = create<EventSearchState>((set) => ({
  searchTerm: '',
  setSearchTerm: (term) => set({ searchTerm: term }),
}));
