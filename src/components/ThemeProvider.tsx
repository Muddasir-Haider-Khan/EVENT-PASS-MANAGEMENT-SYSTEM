'use client';

import React, { createContext, useContext, useEffect } from 'react';

interface ThemeContextType {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  customFontFileUrl?: string | null;
  customFontUrl?: string | null;
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
  customFontFileUrl,
  customFontUrl,
}: {
  children: React.ReactNode;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  customFontFileUrl?: string | null;
  customFontUrl?: string | null;
}) {
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', primaryColor);
    root.style.setProperty('--color-secondary', secondaryColor);
    root.style.setProperty('--color-accent', accentColor);

    const styleId = 'epms-custom-font-style';
    const linkId = 'epms-dynamic-font';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement | null;
    let linkElement = document.getElementById(linkId) as HTMLLinkElement | null;

    if (customFontFileUrl) {
      // Custom uploaded font file via @font-face
      root.style.setProperty('--font-family', `'CustomThemeFont', '${fontFamily}', sans-serif`);
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
      }
      styleElement.innerHTML = `
        @font-face {
          font-family: 'CustomThemeFont';
          src: url('${customFontFileUrl}') format('truetype');
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }
      `;
    } else if (customFontUrl) {
      // Direct stylesheet URL fallback
      root.style.setProperty('--font-family', `'${fontFamily}', sans-serif`);
      if (!linkElement) {
        linkElement = document.createElement('link');
        linkElement.id = linkId;
        linkElement.rel = 'stylesheet';
        document.head.appendChild(linkElement);
      }
      linkElement.href = customFontUrl;
    } else if (fontFamily && fontFamily !== 'Inter' && fontFamily !== 'sans-serif') {
      // Google Font named lookup
      root.style.setProperty('--font-family', `'${fontFamily}', sans-serif`);
      if (!linkElement) {
        linkElement = document.createElement('link');
        linkElement.id = linkId;
        linkElement.rel = 'stylesheet';
        document.head.appendChild(linkElement);
      }
      const fontUrlParam = fontFamily.replace(/ /g, '+');
      linkElement.href = `https://fonts.googleapis.com/css2?family=${fontUrlParam}:wght@400;500;600;700;800&display=swap`;
    } else {
      root.style.setProperty('--font-family', `'Inter', sans-serif`);
    }

    return () => {
      root.style.removeProperty('--color-primary');
      root.style.removeProperty('--color-secondary');
      root.style.removeProperty('--color-accent');
      root.style.removeProperty('--font-family');
    };
  }, [primaryColor, secondaryColor, accentColor, fontFamily, customFontFileUrl, customFontUrl]);

  return (
    <ThemeContext.Provider
      value={{ primaryColor, secondaryColor, accentColor, fontFamily, customFontFileUrl, customFontUrl }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

