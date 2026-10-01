/**
 * ECJY Density Hook
 * Manages table density mode with localStorage persistence and CSS variable sync
 */

import { useState, useEffect, useCallback } from 'react';

export type DensityMode = 'comfortable' | 'compact' | 'dense';

export interface UseDensityReturn {
  density: DensityMode;
  setDensity: (d: DensityMode) => void;
  rowHeight: number;
  multiplier: number;
}

const DENSITY_STORAGE_KEY = 'ecjy-density-mode';
const CSS_VAR_NAME = '--ecjy-density-multiplier';

const DENSITY_CONFIG: Record<DensityMode, { rowHeight: number; multiplier: number }> = {
  comfortable: { rowHeight: 24, multiplier: 1.0 },
  compact: { rowHeight: 18, multiplier: 0.75 },
  dense: { rowHeight: 14, multiplier: 0.5 },
};

function getInitialDensity(): DensityMode {
  if (typeof window === 'undefined') return 'comfortable';
  
  const stored = localStorage.getItem(DENSITY_STORAGE_KEY);
  if (stored && (stored === 'comfortable' || stored === 'compact' || stored === 'dense')) {
    return stored as DensityMode;
  }
  return 'comfortable';
}

function applyDensityToCSS(multiplier: number): void {
  if (typeof document !== 'undefined') {
    document.documentElement.style.setProperty(CSS_VAR_NAME, String(multiplier));
  }
}

export function useDensity(): UseDensityReturn {
  const [density, setDensityState] = useState<DensityMode>(() => getInitialDensity());

  // Apply CSS variable on mount and when density changes
  useEffect(() => {
    const config = DENSITY_CONFIG[density];
    applyDensityToCSS(config.multiplier);
  }, [density]);

  const setDensity = useCallback((newDensity: DensityMode) => {
    setDensityState(newDensity);
    if (typeof window !== 'undefined') {
      localStorage.setItem(DENSITY_STORAGE_KEY, newDensity);
    }
  }, []);

  const config = DENSITY_CONFIG[density];

  return {
    density,
    setDensity,
    rowHeight: config.rowHeight,
    multiplier: config.multiplier,
  };
}

export function getDensityConfig(mode: DensityMode) {
  return DENSITY_CONFIG[mode];
}

export function getCSSVarName(): string {
  return CSS_VAR_NAME;
}