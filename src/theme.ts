/** Design system minimal — couleurs WhatsPAY (vert de marque #1BA24B) + espacements/typos. */
export const colors = {
  primary: '#1BA24B',
  primaryDark: '#15803d',
  primaryLight: '#22c55e',
  primarySoft: '#dcfce7',

  bg: '#f7f8fa',
  card: '#ffffff',
  border: '#e5e7eb',
  inputBg: 'rgba(43,94,94,0.1)', // fond des champs (charte PWA)

  text: '#111827',
  textMuted: '#6b7280',
  textOnPrimary: '#ffffff',

  danger: '#dc2626',
  dangerSoft: '#fef2f2',
  warning: '#f59e0b',
  warningSoft: '#fffbeb',
  success: '#16a34a',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
};

export const font = {
  size: { xs: 12, sm: 13, md: 15, lg: 18, xl: 22, xxl: 28 },
  weight: { regular: '400', medium: '600', bold: '700' } as const,
};
