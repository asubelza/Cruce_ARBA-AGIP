/**
 * ECJY Theme Provider - React Context Provider wrapping MUI ThemeProvider
 * Consumes CSS vars; exposes useECJYTokens() hook; feature-flag gated
 * Provides density context and feature flag helpers
 */

import { 
  createContext, 
  useContext, 
  useMemo, 
  useEffect, 
  ReactNode, 
  useState,
  useCallback 
} from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme, CssBaseline, Theme, Shadows } from '@mui/material';
import { tokens, DesignTokens, DensityMode } from '../design-tokens/tokens';
import { generateAllCSSVars, injectCSSVars, removeCSSVars } from '../design-tokens/css-vars';
import { semanticColors, muiPaletteColors } from './semantic-colors';

// Feature flag - can be set via Vite define or environment variable
const FEATURE_FLAG = (import.meta.env.VITE_ECJY_VISUAL_PHASE_1 === 'true' || 
                      import.meta.env.VITE_ECJY_VISUAL_PHASE_1 === '1') as boolean;

// ============================================
// Density Context
// ============================================

interface DensityContextValue {
  density: DensityMode;
  setDensity: (d: DensityMode) => void;
  rowHeight: number;
  multiplier: number;
}

const DensityContext = createContext<DensityContextValue | null>(null);

export function useDensityContext(): DensityContextValue {
  const context = useContext(DensityContext);
  if (!context) {
    throw new Error('useDensityContext must be used within an ECJYThemeProvider');
  }
  return context;
}

export function useDensityContextOptional(): DensityContextValue | null {
  return useContext(DensityContext);
}

// ============================================
// Feature Flag Context
// ============================================

interface FeatureFlagContextValue {
  isEnabled: (flag: string) => boolean;
  allFlags: Record<string, boolean>;
}

const FeatureFlagContext = createContext<FeatureFlagContextValue | null>(null);

export function useFeatureFlagContext(): FeatureFlagContextValue {
  const context = useContext(FeatureFlagContext);
  if (!context) {
    throw new Error('useFeatureFlagContext must be used within an ECJYThemeProvider');
  }
  return context;
}

export function useFeatureFlagContextOptional(): FeatureFlagContextValue | null {
  return useContext(FeatureFlagContext);
}

// ============================================
// Theme Context (existing)
// ============================================

export interface ECJYThemeContextValue {
  tokens: DesignTokens;
  semanticColors: typeof semanticColors;
  isEnabled: boolean;
  theme: Theme;
}

const ECJYThemeContext = createContext<ECJYThemeContextValue | null>(null);

export function useECJYTokens(): ECJYThemeContextValue {
  const context = useContext(ECJYThemeContext);
  if (!context) {
    throw new Error('useECJYTokens must be used within an ECJYThemeProvider');
  }
  return context;
}

export function useECJYTokensOptional(): ECJYThemeContextValue | null {
  return useContext(ECJYThemeContext);
}

// ============================================
// Provider Props
// ============================================

interface ECJYThemeProviderProps {
  children: ReactNode;
  /** Override tokens for theming customization */
  tokensOverride?: Partial<DesignTokens>;
  /** Disable the provider entirely (useful for testing) */
  disabled?: boolean;
}

// ============================================
// Helper functions for feature flags
// ============================================

const FLAG_PREFIX = 'VITE_ECJY_';
const STORAGE_PREFIX = 'ecjy-';

function getEnvFlag(flag: string): boolean | undefined {
  const envKey = `${FLAG_PREFIX}${flag.toUpperCase().replace(/-/g, '_')}`;
  const value = import.meta.env[envKey];
  if (value === undefined) return undefined;
  return value === 'true' || value === '1';
}

function getStorageFlag(flag: string): boolean | undefined {
  if (typeof window === 'undefined') return undefined;
  const stored = localStorage.getItem(`${STORAGE_PREFIX}${flag.toLowerCase()}`);
  if (stored === null) return undefined;
  return stored === 'true';
}

function resolveFlag(flag: string): boolean {
  // Priority: localStorage override > env var > false (default)
  const storageValue = getStorageFlag(flag);
  if (storageValue !== undefined) return storageValue;
  
  const envValue = getEnvFlag(flag);
  if (envValue !== undefined) return envValue;
  
  return false;
}

function getAllKnownFlags(): string[] {
  return [
    'PHASE_1',
    'HERO_OPENING',
    'DIFFERENCE_DETECTOR',
    'STATE_INDICATORS',
    'COMPARISON_TABLE',
    'CONNECTION_LINES',
    'COMPARISON_ENGINE',
    'DATA_LAYERS',
    'DETECTION_PANEL',
    'VALIDATION_WORKSPACE',
    'STATS_DISPLAY',
    'FILE_UPLOAD',
    'APP_HEADER',
    'PARALLEL_RENDER',
  ];
}

// Density config with proper typing
const DENSITY_CONFIG: Record<DensityMode, { rowHeight: number; multiplier: number }> = {
  comfortable: { rowHeight: 24, multiplier: 1.0 },
  compact: { rowHeight: 18, multiplier: 0.75 },
  dense: { rowHeight: 14, multiplier: 0.5 },
};

// ============================================
// Main Provider
// ============================================

export function ECJYThemeProvider({
  children,
  tokensOverride,
  disabled = false,
}: ECJYThemeProviderProps) {
  const isEnabled = FEATURE_FLAG && !disabled;

  // Density state (synced with localStorage)
  const [density, setDensityState] = useState<DensityMode>(() => {
    if (typeof window === 'undefined') return 'comfortable';
    const stored = localStorage.getItem('ecjy-density-mode');
    if (stored && (stored === 'comfortable' || stored === 'compact' || stored === 'dense')) {
      return stored as DensityMode;
    }
    return 'comfortable';
  });

  const setDensity = useCallback((newDensity: DensityMode) => {
    setDensityState(newDensity);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ecjy-density-mode', newDensity);
    }
  }, []);

  const { rowHeight, multiplier } = DENSITY_CONFIG[density];

  // Apply density CSS variable
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--ecjy-density-multiplier', String(multiplier));
    }
  }, [multiplier]);

  // Feature flag state
  const [flagsCache, setFlagsCache] = useState<Record<string, boolean>>({});
  
  useEffect(() => {
    const initialFlags: Record<string, boolean> = {};
    getAllKnownFlags().forEach(flag => {
      initialFlags[flag] = resolveFlag(flag);
    });
    setFlagsCache(initialFlags);
  }, []);

  const featureFlagHelpers = useMemo<FeatureFlagContextValue>(() => ({
    isEnabled: (flag: string) => resolveFlag(flag),
    allFlags: flagsCache,
  }), [flagsCache]);

  const mergedTokens = useMemo<DesignTokens>(() => {
    if (!tokensOverride) return tokens;
    return deepMerge<DesignTokens>(tokens, tokensOverride);
  }, [tokensOverride]);

// Build MUI shadows array (exactly 25 elements)
  const muiShadows = useMemo<Shadows>(() => [
    'none',
    mergedTokens.shadows.xs,
    mergedTokens.shadows.sm,
    mergedTokens.shadows.md,
    mergedTokens.shadows.md,
    mergedTokens.shadows.lg,
    mergedTokens.shadows.lg,
    mergedTokens.shadows.xl,
    mergedTokens.shadows.xl,
    mergedTokens.shadows.xl,
    mergedTokens.shadows.xl,
    mergedTokens.shadows['2xl'],
    mergedTokens.shadows['2xl'],
    mergedTokens.shadows['2xl'],
    mergedTokens.shadows['2xl'],
    mergedTokens.shadows['2xl'],
    mergedTokens.shadows['2xl'],
    mergedTokens.shadows['2xl'],
    mergedTokens.shadows['2xl'],
    mergedTokens.shadows['2xl'],
    mergedTokens.shadows['2xl'],
    mergedTokens.shadows['2xl'],
    mergedTokens.shadows['2xl'],
    mergedTokens.shadows['2xl'],
    mergedTokens.shadows['2xl'],
  ], [mergedTokens]);

  const muiTheme = useMemo(() => {
    return createTheme({
      palette: {
        mode: 'dark',
        ...muiPaletteColors,
      },
      typography: {
        fontFamily: mergedTokens.typography.fontFamilies.body,
        h1: { fontFamily: mergedTokens.typography.fontFamilies.display, fontWeight: mergedTokens.typography.fontWeights.bold },
        h2: { fontFamily: mergedTokens.typography.fontFamilies.display, fontWeight: mergedTokens.typography.fontWeights.bold },
        h3: { fontFamily: mergedTokens.typography.fontFamilies.display, fontWeight: mergedTokens.typography.fontWeights.semibold },
        h4: { fontFamily: mergedTokens.typography.fontFamilies.display, fontWeight: mergedTokens.typography.fontWeights.semibold },
        h5: { fontFamily: mergedTokens.typography.fontFamilies.display, fontWeight: mergedTokens.typography.fontWeights.medium },
        h6: { fontFamily: mergedTokens.typography.fontFamilies.display, fontWeight: mergedTokens.typography.fontWeights.medium },
        body1: { fontSize: mergedTokens.typography.fontSizes.base, lineHeight: mergedTokens.typography.lineHeights.normal },
        body2: { fontSize: mergedTokens.typography.fontSizes.sm, lineHeight: mergedTokens.typography.lineHeights.normal },
        button: { fontWeight: mergedTokens.typography.fontWeights.semibold, textTransform: 'none' },
        fontWeightLight: mergedTokens.typography.fontWeights.normal,
        fontWeightRegular: mergedTokens.typography.fontWeights.normal,
        fontWeightMedium: mergedTokens.typography.fontWeights.medium,
        fontWeightBold: mergedTokens.typography.fontWeights.bold,
      },
      shape: {
        borderRadius: parseInt(mergedTokens.radii.md, 10),
      },
      shadows: muiShadows,
      transitions: {
        duration: {
          shortest: parseInt(mergedTokens.motion.durations.fast, 10),
          shorter: parseInt(mergedTokens.motion.durations.fast, 10),
          short: parseInt(mergedTokens.motion.durations.normal, 10),
          standard: parseInt(mergedTokens.motion.durations.normal, 10),
          complex: parseInt(mergedTokens.motion.durations.slow, 10),
          enteringScreen: parseInt(mergedTokens.motion.durations.normal, 10),
          leavingScreen: parseInt(mergedTokens.motion.durations.fast, 10),
        },
        easing: {
          easeInOut: mergedTokens.motion.easings.standard,
          easeOut: mergedTokens.motion.easings.decelerate,
          easeIn: mergedTokens.motion.easings.emphasize,
          sharp: mergedTokens.motion.easings.sharp,
        },
      },
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            ':root': {
              ...Object.fromEntries(
                Object.entries(flattenTokensForCSS(mergedTokens as unknown as Record<string, unknown>)).map(([k, v]) => [`--ecjy-${k}`, v])
              ),
            },
            '[data-theme="dark"]': {
              ...Object.fromEntries(
                Object.entries(flattenTokensForCSS(mergedTokens as unknown as Record<string, unknown>)).map(([k, v]) => [`--ecjy-${k}`, v])
              ),
            },
            '*': {
              boxSizing: 'border-box',
            },
            html: {
              fontSize: '16px',
            },
            body: {
              backgroundColor: mergedTokens.colors.surface.bg,
              color: mergedTokens.colors.text.primary,
              fontFamily: mergedTokens.typography.fontFamilies.body,
              lineHeight: mergedTokens.typography.lineHeights.normal,
            },
          },
        },
      },
    });
  }, [mergedTokens]);

  // Inject CSS vars on mount and when tokens change
  useEffect(() => {
    if (isEnabled) {
      injectCSSVars(generateAllCSSVars(mergedTokens));
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      removeCSSVars();
      document.documentElement.removeAttribute('data-theme');
    }
    return () => {
      if (isEnabled) {
        removeCSSVars();
      }
    };
  }, [isEnabled, mergedTokens]);

  const themeContextValue = useMemo<ECJYThemeContextValue>(() => ({
    tokens: mergedTokens,
    semanticColors,
    isEnabled,
    theme: muiTheme,
  }), [mergedTokens, isEnabled, muiTheme]);

  const densityContextValue = useMemo<DensityContextValue>(() => ({
    density,
    setDensity,
    rowHeight,
    multiplier,
  }), [density, setDensity, rowHeight, multiplier]);

  if (!isEnabled) {
    // When disabled, render children without ECJY theming but still provide context
    return (
      <ECJYThemeContext.Provider value={themeContextValue}>
        <DensityContext.Provider value={densityContextValue}>
          <FeatureFlagContext.Provider value={featureFlagHelpers}>
            {children}
          </FeatureFlagContext.Provider>
        </DensityContext.Provider>
      </ECJYThemeContext.Provider>
    );
  }

  return (
    <ECJYThemeContext.Provider value={themeContextValue}>
      <DensityContext.Provider value={densityContextValue}>
        <FeatureFlagContext.Provider value={featureFlagHelpers}>
          <MuiThemeProvider theme={muiTheme}>
            <CssBaseline />
            {children}
          </MuiThemeProvider>
        </FeatureFlagContext.Provider>
      </DensityContext.Provider>
    </ECJYThemeContext.Provider>
  );
}

// Helper to flatten tokens for CSS vars
function flattenTokensForCSS(obj: Record<string, unknown>, prefix: string = ''): Record<string, string | number> {
  const result: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}` : key.replace(/([A-Z])/g, '-$1').toLowerCase();
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenTokensForCSS(value as Record<string, unknown>, newKey));
    } else {
      result[newKey] = value as string | number;
    }
  }
  return result;
}

function deepMerge<T extends object>(target: T, source: Partial<T>): T {
  const result = { ...target } as Record<string, unknown>;
  const targetRecord = target as Record<string, unknown>;
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object' && !Array.isArray(value) && targetRecord[key] && typeof targetRecord[key] === 'object') {
      result[key] = deepMerge(
        targetRecord[key] as Record<string, unknown>,
        value as Record<string, unknown>
      );
    } else {
      result[key] = value;
    }
  }
  return result as T;
}