import { configureStore } from "@reduxjs/toolkit";
import uiReducer from "@/lib/uiSlice";
import themeReducer from "@/lib/themeSlice";
import authReducer from "@/lib/authSlice";

export const makeStore = () =>
  configureStore({
    reducer: { ui: uiReducer, theme: themeReducer, auth: authReducer },
    devTools: process.env.NODE_ENV !== "production"
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
