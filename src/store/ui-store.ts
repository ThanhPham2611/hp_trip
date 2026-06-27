import { create } from "zustand";

type UiState = {
  activeDay: number;
  selectedSeat: string | null;
  albumFilter: "all" | "day1" | "day2" | "day3";
  setActiveDay: (day: number) => void;
  setSelectedSeat: (code: string | null) => void;
  setAlbumFilter: (filter: UiState["albumFilter"]) => void;
};

export const useUiStore = create<UiState>((set) => ({
  activeDay: 1,
  selectedSeat: null,
  albumFilter: "all",
  setActiveDay: (day) => set({ activeDay: day }),
  setSelectedSeat: (code) => set({ selectedSeat: code }),
  setAlbumFilter: (filter) => set({ albumFilter: filter })
}));
