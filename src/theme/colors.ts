/**
 * Color tokens for PersonalizedMAUSAM.
 * Inspired by modern meteorological systems and public-service interfaces.
 */
export const colors = {
  primary: {
    50: '#f0f7ff',
    100: '#e0effe',
    200: '#b9ddfd',
    300: '#7cc0fb',
    400: '#369ef6',
    500: '#0c82ea',
    600: '#0266c8',
    700: '#0352a1',
    800: '#074685',
    900: '#0b3c6f',
    950: '#062649',
  },
  accent: {
    amber: '#f59e0b',
    emerald: '#10b981',
    cyan: '#06b6d4',
  },
  neutral: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
} as const;

export type Colors = typeof colors;
