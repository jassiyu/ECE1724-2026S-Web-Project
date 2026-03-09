import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import eventReducer from "./slices/eventSlice";
import scanReducer from "./slices/scanSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    event: eventReducer,
    scan: scanReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
