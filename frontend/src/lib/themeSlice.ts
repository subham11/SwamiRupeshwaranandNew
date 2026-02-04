import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { ThemeName } from "@/lib/themes";
import { defaultTheme } from "@/lib/themes";

type ThemeState = {
  currentTheme: ThemeName;
};

const initialState: ThemeState = {
  currentTheme: defaultTheme
};

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    setTheme(state, action: PayloadAction<ThemeName>) {
      state.currentTheme = action.payload;
    }
  }
});

export const { setTheme } = themeSlice.actions;
export default themeSlice.reducer;
