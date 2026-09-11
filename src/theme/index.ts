import { createContext, useContext } from 'react';

export type ThemeMode = 'system' | 'light' | 'dark';
export type Scheme = 'light' | 'dark';

export interface Palette {
  scheme: Scheme;
  bg: string;
  surface: string;
  surface2: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
  accentText: string;
  danger: string;
  success: string;
  overlay: string;
}

export const light: Palette = {
  scheme: 'light',
  bg: '#FFFFFF',
  surface: '#F5F5F7',
  surface2: '#EBEBEF',
  border: '#E3E3E8',
  text: '#111113',
  muted: '#7A7A85',
  accent: '#111113',
  accentText: '#FFFFFF',
  danger: '#E5484D',
  success: '#30A46C',
  overlay: 'rgba(0,0,0,0.5)',
};

export const dark: Palette = {
  scheme: 'dark',
  bg: '#0B0B0D',
  surface: '#161619',
  surface2: '#202024',
  border: '#26262B',
  text: '#F4F4F5',
  muted: '#8B8B94',
  accent: '#F4F4F5',
  accentText: '#0B0B0D',
  danger: '#FF6369',
  success: '#3DD68C',
  overlay: 'rgba(0,0,0,0.6)',
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;
export const radius = { sm: 10, md: 16, lg: 24, full: 999 } as const;

export const ThemeContext = createContext<Palette>(dark);
export const useTheme = () => useContext(ThemeContext);
