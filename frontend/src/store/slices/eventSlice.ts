import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { EventDTO } from "../../types";

interface EventState {
  selectedEvent: EventDTO | null;
  searchQuery: string;
  showUpcomingOnly: boolean;
}

const initialState: EventState = {
  selectedEvent: null,
  searchQuery: "",
  showUpcomingOnly: false,
};

const eventSlice = createSlice({
  name: "event",
  initialState,
  reducers: {
    setSelectedEvent(state, action: PayloadAction<EventDTO | null>) {
      state.selectedEvent = action.payload;
    },
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
    },
    setShowUpcomingOnly(state, action: PayloadAction<boolean>) {
      state.showUpcomingOnly = action.payload;
    },
  },
});

export const { setSelectedEvent, setSearchQuery, setShowUpcomingOnly } =
  eventSlice.actions;
export default eventSlice.reducer;
