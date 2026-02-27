'use client';

import React, {createContext, useContext, useEffect, useState} from 'react';
import {themeColors} from "@lib/theme";

const ThemeContext = createContext({
  currentTheme: themeColors.eclipse,
  isMounted: false,
  toggleTheme: (name: string) => {}
});

export function ThemeProvider({children}: {children: React.ReactNode}) {
  const [currentTheme, setCurrentTheme] = useState(themeColors.eclipse);
  const [isMounted, setIsMounted] = useState(false);

  const toggleTheme = (name: string) => {
    const newTheme = themeColors[name as keyof typeof themeColors];
    if (newTheme) {
      setCurrentTheme(newTheme);
      document.cookie = `theme=${name}; path=/; max-age=31536000; SameSite=Lax`;
    }
  };

  useEffect(() => {
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) {
        return parts.pop()?.split(';').shift();
      }
      return undefined;
    };

    const preference = getCookie('theme') || 'eclipse';
    setCurrentTheme(themeColors[preference as keyof typeof themeColors] || themeColors.eclipse);
    setIsMounted(true); 
  }, []);

  return (
    <ThemeContext.Provider value={{currentTheme, isMounted, toggleTheme}}>
      <div style={{opacity: isMounted ? 1 : 0}}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);