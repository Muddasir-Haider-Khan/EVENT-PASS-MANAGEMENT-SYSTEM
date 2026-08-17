'use client';

import React, { createContext, useContext, useEffect } from 'react';

interface ThemeContextType {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

const ThemeContext = createContext<ThemeContextType>({
  primaryColor: '#0F172A',
  secondaryColor: '#3B82F6',
  accentColor: '#F59E0B',
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({
  children,
  primaryColor = '#0F172A',
  secondaryColor = '#3B82F6',
  accentColor = '#F59E0B',
}: {
  children: React.ReactNode;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
}) {
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', primaryColor);
    root.style.setProperty('--color-secondary', secondaryColor);
    root.style.setProperty('--color-accent', accentColor);
    return () => {
      root.style.removeProperty('--color-primary');
      root.style.removeProperty('--color-secondary');
      root.style.removeProperty('--color-accent');
    };
  }, [primaryColor, secondaryColor, accentColor]);

  return (
    <ThemeContext.Provider value={{ primaryColor, secondaryColor, accentColor }}>
      {children}
    </ThemeContext.Provider>
  );
}
