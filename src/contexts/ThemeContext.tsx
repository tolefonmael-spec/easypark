// src/contexts/ThemeContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import { ThemeKey, THEMES, THEME_META, setActiveTheme } from '../constants/theme';

interface ThemeCtx {
  themeKey:    ThemeKey;
  colors:      typeof THEMES.dark;
  isDark:      boolean;
  setTheme:    (key: ThemeKey) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeCtx>({
  themeKey:'dark', colors:THEMES.dark, isDark:true,
  setTheme:()=>{}, toggleTheme:()=>{},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemDark = Appearance.getColorScheme() === 'dark';
  const [themeKey, setKey] = useState<ThemeKey>(systemDark ? 'dark' : 'light');

  useEffect(() => {
    AsyncStorage.getItem('@ep_theme').then(s => {
      if (s && THEMES[s as ThemeKey]) apply(s as ThemeKey);
    });
  }, []);

  function apply(key: ThemeKey) {
    setKey(key);
    setActiveTheme(key);
    AsyncStorage.setItem('@ep_theme', key);
  }

  return (
    <ThemeContext.Provider value={{
      themeKey, colors:THEMES[themeKey],
      isDark: THEME_META[themeKey].isDark,
      setTheme: apply,
      toggleTheme: () => apply(themeKey === 'light' ? 'dark' : 'light'),
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() { return useContext(ThemeContext); }
