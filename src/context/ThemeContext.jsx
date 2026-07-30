import React, { createContext, useContext, useState, useEffect } from 'react';

export const THEME_PRESETS = {
  logo: {
    id: 'logo',
    name: 'Logo Brand Glassmorphism (Recommended)',
    primaryColor: '#005F53', // Deep Emerald Teal
    accentColor: '#FF6D00',  // Vibrant Key Orange
    mode: 'glass',
    desc: 'Official ElitePass BD Teal & Key Orange theme with frosted glass aesthetics.'
  },
  ocean: {
    id: 'ocean',
    name: 'Ocean Cyan & Amber',
    primaryColor: '#0284c7',
    accentColor: '#f59e0b',
    mode: 'glass',
    desc: 'Bright cyan blue primary with warm amber accents.'
  },
  violet: {
    id: 'violet',
    name: 'Neon Violet & Coral',
    primaryColor: '#7c3aed',
    accentColor: '#ff4757',
    mode: 'glass',
    desc: 'Vivid purple primary with energetic coral pink accents.'
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald Green & Gold',
    primaryColor: '#059669',
    accentColor: '#eab308',
    mode: 'glass',
    desc: 'Rich green tone with golden yellow highlights.'
  }
};

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    const saved = localStorage.getItem('elitepass_theme');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse stored theme', e);
      }
    }
    return THEME_PRESETS.logo;
  });

  useEffect(() => {
    applyThemeVariables(theme);
    localStorage.setItem('elitepass_theme', JSON.stringify(theme));
  }, [theme]);

  const applyThemeVariables = (themeConfig) => {
    const root = document.documentElement;
    const primary = themeConfig.primaryColor || '#005F53';
    const accent = themeConfig.accentColor || '#FF6D00';

    root.style.setProperty('--color-primary', primary);
    root.style.setProperty('--color-primary-hover', adjustColorBrightness(primary, -15));
    root.style.setProperty('--color-primary-light', hexToRgba(primary, 0.12));
    
    root.style.setProperty('--color-accent', accent);
    root.style.setProperty('--color-accent-hover', adjustColorBrightness(accent, -10));
    root.style.setProperty('--color-accent-light', hexToRgba(accent, 0.15));
  };

  const updateTheme = (newConfig) => {
    setThemeState((prev) => ({
      ...prev,
      ...newConfig
    }));
  };

  const selectPreset = (presetKey) => {
    if (THEME_PRESETS[presetKey]) {
      setThemeState(THEME_PRESETS[presetKey]);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, updateTheme, selectPreset, THEME_PRESETS }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Utility: Adjust Hex Color Brightness
function adjustColorBrightness(hex, percent) {
  let num = parseInt(hex.replace('#', ''), 16);
  let amt = Math.round(2.55 * percent);
  let R = (num >> 16) + amt;
  let G = (num >> 8 & 0x00FF) + amt;
  let B = (num & 0x0000FF) + amt;

  return '#' + (
    0x1000000 +
    (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
    (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
    (B < 255 ? (B < 1 ? 0 : B) : 255)
  ).toString(16).slice(1);
}

// Utility: Convert Hex to RGBA
function hexToRgba(hex, alpha = 1) {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('');
  }
  const num = parseInt(c, 16);
  return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
}
