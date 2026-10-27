import { createContext, useContext } from 'react';
export const AppCtx = createContext(null);    // everything a logged-in page needs
export const ThemeCtx = createContext(null);  // theme (also needed on the login screen)
export const useApp = () => useContext(AppCtx);
export const useTheme = () => useContext(ThemeCtx);
