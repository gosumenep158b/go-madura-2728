'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export function applyTheme(dark: boolean) {
  const root = document.documentElement;
  if (dark) root.classList.add('dark');
  else root.classList.remove('dark');
  try {
    localStorage.setItem('go-theme', dark ? 'dark' : 'light');
  } catch {}
}

export function currentThemeDark(): boolean {
  if (typeof document === 'undefined') return false;
  return document.documentElement.classList.contains('dark');
}

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setDark(currentThemeDark());
    setMounted(true);
  }, []);

  if (!mounted) {
    return <span className={`inline-block h-8 w-8 rounded-full bg-slate-100 ${className}`} />;
  }

  return (
    <button
      type="button"
      onClick={() => {
        const next = !dark;
        setDark(next);
        applyTheme(next);
      }}
      title={dark ? 'Ubah ke terang' : 'Ubah ke gelap'}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-amber-300 ${className}`}
    >
      {dark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
