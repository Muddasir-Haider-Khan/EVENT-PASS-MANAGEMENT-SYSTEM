'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { THEME_STORAGE_KEY, type ColorTheme } from '@/lib/theme';

export function ThemeToggle({ className = 'ibtn' }: { className?: string }) {
  const [theme, setTheme] = useState<ColorTheme>('dark');

  useEffect(() => {
    setTheme(document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark');
  }, []);

  function toggle() {
    const next: ColorTheme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // storage unavailable (private mode) — theme still applies for this visit
    }
    setTheme(next);
  }

  const label = theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
  return (
    <button type="button" onClick={toggle} className={className} aria-label={label} title={label}>
      {theme === 'dark' ? <Sun className="w-[17px] h-[17px]" /> : <Moon className="w-[17px] h-[17px]" />}
    </button>
  );
}
