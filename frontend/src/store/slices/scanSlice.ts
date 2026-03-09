import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { CheckInResult } from "../../types";

interface ScanState {
  lastResult: CheckInResult | null;
  isScanning: boolean;
}

const initialState: ScanState = {
  lastResult: null,
  isScanning: false,
};

const scanSlice = createSlice({
  name: "scan",
  initialState,
  reducers: {
    setScanResult(state, action: PayloadAction<CheckInResult>) {
      state.lastResult = action.payload;
      state.isScanning = false;
    },
    startScanning(state) {
      state.isScanning = true;
      state.lastResult = null;
    },
    clearScanResult(state) {
      state.lastResult = null;
    },
  },
});

export const { setScanResult, startScanning, clearScanResult } =
  scanSlice.actions;
export default scanSlice.reducer;
