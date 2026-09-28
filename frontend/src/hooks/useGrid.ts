/**
 * ECJY Grid Hook
 * Provides 12-column fluid grid utilities derived from design tokens
 */

import { useMemo, useCallback } from 'react';
import { useECJYTokens } from '../theme/ECJYThemeProvider';
import { BreakpointScale } from '../design-tokens/tokens';

export interface UseGridReturn {
  columns: 12;
  gutter: string;
  margin: string;
  colSpan: (n: number) => string;
  breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  breakpointValue: string;
}

const BREAKPOINTS_ORDER: Array<keyof BreakpointScale> = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];

function getCurrentBreakpoint(breakpoints: BreakpointScale): 'xs' | 'sm' | 'md' | 'lg' | 'xl' {
  if (typeof window === 'undefined') return 'lg';
  
  const width = window.innerWidth;
  
  // Check from largest to smallest
  for (let i = BREAKPOINTS_ORDER.length - 1; i >= 0; i--) {
    const bp = BREAKPOINTS_ORDER[i];
    const bpValue = parseInt(breakpoints[bp], 10);
    if (width >= bpValue) {
      return bp === '2xl' ? 'xl' : bp;
    }
  }
  return 'xs';
}

export function useGrid(): UseGridReturn {
  const { tokens } = useECJYTokens();
  
  const breakpoint = useMemo(() => getCurrentBreakpoint(tokens.breakpoints), [tokens.breakpoints]);
  const breakpointValue = tokens.breakpoints[breakpoint];
  
  const gutter = tokens.spacing[4]; // 16px = spacing.md
  const margin = tokens.spacing[6]; // 24px = spacing.lg

  const colSpan = useCallback((n: number): string => {
    const clamped = Math.max(1, Math.min(12, n));
    return `span ${clamped} / span ${clamped}`;
  }, []);

  return {
    columns: 12,
    gutter,
    margin,
    colSpan,
    breakpoint,
    breakpointValue,
  };
}

// CSS Grid utility classes that can be used directly in components
export const gridStyles = {
  container: (gutter?: string, margin?: string) => ({
    display: 'grid',
    gridTemplateColumns: 'repeat(12, 1fr)',
    gap: gutter || '16px',
    padding: margin || '24px',
    width: '100%',
    boxSizing: 'border-box' as const,
  }),
  
  item: (span: number, start?: number) => ({
    gridColumn: start ? `${start} / span ${span}` : `span ${span} / span ${span}`,
  }),
  
  // Responsive grid template columns
  responsiveColumns: (breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl') => {
    const configs: Record<string, string> = {
      xs: 'repeat(4, 1fr)',
      sm: 'repeat(8, 1fr)',
      md: 'repeat(10, 1fr)',
      lg: 'repeat(12, 1fr)',
      xl: 'repeat(12, 1fr)',
    };
    return configs[breakpoint] || configs.lg;
  },
};