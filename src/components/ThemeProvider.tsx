'use client';

import React, { createContext, useContext, useEffect } from 'react';

interface ThemeContextType {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
}

const ThemeContext = createContext<ThemeContextType>({
  primaryColor: '#0F172A',
  secondaryColor: '#3B82F6',
  accentColor: '#F59E0B',
  fontFamily: 'Inter',
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({
  children,
  primaryColor = '#0F172A',
  secondaryColor = '#3B82F6',
  accentColor = '#F59E0B',
  fontFamily = 'Inter',
}: {
  children: React.ReactNode;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
}) {
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', primaryColor);
    root.style.setProperty('--color-secondary', secondaryColor);
    root.style.setProperty('--color-accent', accentColor);
    root.style.setProperty('--font-family', `'${fontFamily}', sans-serif`);

    // Dynamically load Google Font if custom font selected
    const linkId = 'epms-dynamic-font';
    let linkElement = document.getElementById(linkId) as HTMLLinkElement | null;

    if (fontFamily && fontFamily !== 'Inter' && fontFamily !== 'sans-serif') {
      if (!linkElement) {
        linkElement = document.createElement('link');
        linkElement.id = linkId;
        linkElement.rel = 'stylesheet';
        document.head.appendChild(linkElement);
      }
      const fontUrlParam = fontFamily.replace(/ /g, '+');
      linkElement.href = `https://fonts.googleapis.com/css2?family=${fontUrlParam}:wght@400;500;600;700;800&display=swap`;
    }

    return () => {
      root.style.removeProperty('--color-primary');
      root.style.removeProperty('--color-secondary');
      root.style.removeProperty('--color-accent');
      root.style.removeProperty('--font-family');
    };
  }, [primaryColor, secondaryColor, accentColor, fontFamily]);

  return (
    <ThemeContext.Provider value={{ primaryColor, secondaryColor, accentColor, fontFamily }}>
      {children}
    </ThemeContext.Provider>
  );
}

