import { createContext, useContext, useEffect, useState } from 'react';
import * as RippleHook from 'use-ripple-hook';

import { flagsHooks } from '@/hooks/flags-hooks';
import { colorsUtils } from '@/lib/color-utils';

type Theme = 'dark' | 'light' | 'system';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  forceLightMode: boolean;
  setForceLightMode: (value: boolean) => void;
};

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
  forceLightMode: false,
  setForceLightMode: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

const setFavicon = (url: string) => {
  document.querySelectorAll("link[rel*='icon']").forEach((el) => el.remove());
  const link = document.createElement('link');
  link.rel = 'icon';
  link.href = url;
  document.head.appendChild(link);
};

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'ap-ui-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme,
  );
  const [forceLightMode, setForceLightMode] = useState(false);
  // Plugr mobile is a premium dark experience. Phones (<768px) force the dark
  // palette so every portal (dropdowns, drawers, dialogs, toasts) inherits it.
  // Desktop is unaffected. Tracks the breakpoint live so rotate/resize re-resolves.
  const [isMobileViewport, setIsMobileViewport] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 768,
  );
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)');
    const onChange = () => setIsMobileViewport(window.innerWidth < 768);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);
  const branding = flagsHooks.useWebsiteBranding();
  useEffect(() => {
    if (!branding) {
      console.warn('Website brand is not defined');
      return;
    }
    const root = window.document.documentElement;

    const resolvedTheme = forceLightMode
      ? 'light'
      : isMobileViewport
      ? 'dark'
      : theme === 'system'
      ? 'light'
      : theme;
    root.classList.remove('light', 'dark');
    document.title = branding.websiteName;
    document.documentElement.style.setProperty(
      '--primary',
      colorsUtils.hexToHslString(branding.colors.primary.default),
    );

    setFavicon(branding.logos.favIconUrl);
    switch (resolvedTheme) {
      case 'light': {
        document.documentElement.style.setProperty(
          '--primary-100',
          colorsUtils.hexToHslString(branding.colors.primary.light),
        );
        document.documentElement.style.setProperty(
          '--primary-300',
          colorsUtils.hexToHslString(branding.colors.primary.dark),
        );
        break;
      }
      case 'dark': {
        document.documentElement.style.setProperty(
          '--primary-100',
          colorsUtils.hexToHslString(branding.colors.primary.dark),
        );
        document.documentElement.style.setProperty(
          '--primary-300',
          colorsUtils.hexToHslString(branding.colors.primary.light),
        );
        break;
      }
      default:
        break;
    }

    root.classList.add(resolvedTheme);
  }, [theme, branding, forceLightMode, isMobileViewport]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
    forceLightMode,
    setForceLightMode,
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider');

  return context;
};

export const useApRipple = () => {
  const { theme } = useTheme();
  return RippleHook.default({
    color:
      theme === 'dark'
        ? 'rgba(0, 212, 255, 0.18)'
        : 'rgba(155, 155, 155, 0.2)',
    cancelAutomatically: true,
  });
};
