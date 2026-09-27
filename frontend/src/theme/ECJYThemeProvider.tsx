/**
 * ECJY Theme Provider - React Context Provider wrapping MUI ThemeProvider
 * Consumes CSS vars; exposes useECJYTokens() hook; feature-flag gated
 */

import React, { createContext, useContext, useMemo, useEffect, ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme, CssBaseline, Theme } from '@mui/material';
import { tokens, DesignTokens } from '../design-tokens/tokens';
import { generateAllCSSVars, injectCSSVars, removeCSSVars } from '../design-tokens/css-vars';
import { semanticColors, muiPaletteColors } from './semantic-colors';

// Feature flag - can be set via Vite define or environment variable
const FEATURE_FLAG = import.meta.env.VITE_ECJY_VISUAL_PHASE_1 === 'true' || 
                     import.meta.env.VITE_ECJY_VISUAL_PHASE_1 === '1';

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

interface ECJYThemeProviderProps {
  children: ReactNode;
  /** Override tokens for theming customization */
  tokensOverride?: Partial<DesignTokens>;
  /** Disable the provider entirely (useful for testing) */
  disabled?: boolean;
}

export function ECJYThemeProvider({
  children,
  tokensOverride,
  disabled = false,
}: ECJYThemeProviderProps) {
  const isEnabled = FEATURE_FLAG && !disabled;

  const mergedTokens = useMemo<DesignTokens>(() => {
    if (!tokensOverride) return tokens;
    return deepMerge(tokens, tokensOverride);
  }, [tokensOverride]);

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
      shadows: [
        mergedTokens.shadows.none,
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
      ] as Theme['shadows'],
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
          sharp: mergedTokens.motion.easings.emphasize,
        },
      },
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            ':root': {
              ...Object.fromEntries(
                Object.entries(flattenTokensForCSS(mergedTokens)).map(([k, v]) => [`--ecjy-${k}`, v])
              ),
            },
            '[data-theme="dark"]': {
              ...Object.fromEntries(
                Object.entries(flattenTokensForCSS(mergedTokens)).map(([k, v]) => [`--ecjy-${k}`, v])
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
            '@font-face': [
              {
                fontFamily: 'Space Grotesk',
                fontStyle: 'normal',
                fontWeight: '300 700',
                fontDisplay: 'swap',
                src: 'local("Space Grotesk"), url("https://fonts.gstatic.com/s/spacegrotesk/v22/VdGSAYsXIlj5Pjyf0VnV1eE.woff2") format("woff2")',
              },
              {
                fontFamily: 'JetBrains Mono',
                fontStyle: 'normal',
                fontWeight: '400 700',
                fontDisplay: 'swap',
                src: 'local("JetBrains Mono"), url("https://fonts.gstatic.com/s/jetbrainsmono/v23/tDbD2o-flEEny0FZhsf21-TZTZTZ.woff2") format("woff2")',
              },
              {
                fontFamily: 'Inter',
                fontStyle: 'normal',
                fontWeight: '400 700',
                fontDisplay: 'swap',
                src: 'local("Inter"), url("https://fonts.gstatic.com/s/inter/v19/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff2") format("woff2")',
              },
            ],
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

  const contextValue = useMemo<ECJYThemeContextValue>(() => ({
    tokens: mergedTokens,
    semanticColors,
    isEnabled,
    theme: muiTheme,
  }), [mergedTokens, isEnabled, muiTheme]);

  if (!isEnabled) {
    // When disabled, render children without ECJY theming but still provide context
    return (
      <ECJYThemeContext.Provider value={contextValue}>
        {children}
      </ECJYThemeContext.Provider>
    );
  }

  return (
    <ECJYThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
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

function deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
  const result = { ...target };
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object' && !Array.isArray(value) && target[key] && typeof target[key] === 'object') {
      (result as Record<string, unknown>)[key] = deepMerge(
        target[key] as Record<string, unknown>,
        value as Record<string, unknown>
      );
    } else {
      (result as Record<string, unknown>)[key] = value;
    }
  }
  return result;
}