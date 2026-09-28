/**
 * ECJY Design Tokens - Raw Token Definitions
 * Semantic naming convention for the ECJY Visual System
 */

export interface ColorToken {
  base: string;
  subtle: string;
  on: string;
}

export interface SemanticColors {
  precision: ColorToken;
  control: ColorToken;
  detection: ColorToken;
  order: ColorToken;
  security: ColorToken;
}

export interface SurfaceColors {
  bg: string;
  panel: string;
  panelHover: string;
  border: string;
}

export interface TextColors {
  primary: string;
  secondary: string;
  tertiary: string;
  inverse: string;
  disabled: string;
}

export interface SpacingScale {
  0: string;
  1: string;
  2: string;
  3: string;
  4: string;
  5: string;
  6: string;
  8: string;
  10: string;
  12: string;
  16: string;
  20: string;
  24: string;
  32: string;
  40: string;
  48: string;
  64: string;
}

export interface TypographyScale {
  fontFamilies: {
    display: string;
    body: string;
    mono: string;
  };
  fontSizes: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
  };
  fontWeights: {
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  lineHeights: {
    tight: number;
    normal: number;
    relaxed: number;
  };
  letterSpacings: {
    tight: string;
    normal: string;
    wide: string;
  };
}

export interface RadiusScale {
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  full: string;
}

export interface ShadowScale {
  none: string;
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  inner: string;
}

export interface ZIndexScale {
  hide: number;
  base: number;
  dropdown: number;
  sticky: number;
  modal: number;
  popover: number;
  tooltip: number;
  toast: number;
}

export type DensityMode = 'comfortable' | 'compact' | 'dense';

export interface DensityScale {
  comfortable: number;
  compact: number;
  dense: number;
  rowHeights: {
    comfortable: number;
    compact: number;
    dense: number;
  };
}

export interface MotionScale {
  durations: {
    instant: string;
    fast: string;
    normal: string;
    slow: string;
    hero: string;
  };
  easings: {
    standard: string;
    emphasize: string;
    decelerate: string;
    accelerate: string;
    sharp: string;
  };
}

export interface BreakpointScale {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
}

export interface DesignTokens {
  colors: {
    semantic: SemanticColors;
    surface: SurfaceColors;
    text: TextColors;
  };
  spacing: SpacingScale;
  typography: TypographyScale;
  radii: RadiusScale;
  shadows: ShadowScale;
  zIndex: ZIndexScale;
  density: DensityScale;
  motion: MotionScale;
  breakpoints: BreakpointScale;
}

export const tokens: DesignTokens = {
  colors: {
    semantic: {
      precision: {
        base: '#00D4AA',
        subtle: '#00D4AA1A',
        on: '#001A0D',
      },
      control: {
        base: '#0095F6',
        subtle: '#0095F61A',
        on: '#001428',
      },
      detection: {
        base: '#FF6B35',
        subtle: '#FF6B351A',
        on: '#2D1305',
      },
      order: {
        base: '#FFFFFF',
        subtle: '#FFFFFF0D',
        on: '#0A0A0A',
      },
      security: {
        base: '#00C853',
        subtle: '#00C8531A',
        on: '#001A05',
      },
    },
    surface: {
      bg: '#0A0A0A',
      panel: '#121212',
      panelHover: '#1A1A1A',
      border: '#2A2A2A',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#B3B3B3',
      tertiary: '#808080',
      inverse: '#0A0A0A',
      disabled: '#4A4A4A',
    },
  },
  spacing: {
    0: '0',
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
    10: '40px',
    12: '48px',
    16: '64px',
    20: '80px',
    24: '96px',
    32: '128px',
    40: '160px',
    48: '192px',
    64: '256px',
  },
  typography: {
    fontFamilies: {
      display: '"Space Grotesk", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      body: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      mono: '"JetBrains Mono", "Fira Code", "Consolas", monospace',
    },
    fontSizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '2rem',
      '4xl': '3rem',
    },
    fontWeights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeights: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
    letterSpacings: {
      tight: '-0.02em',
      normal: '0',
      wide: '0.02em',
    },
  },
  radii: {
    none: '0',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '24px',
    full: '9999px',
  },
  shadows: {
    none: 'none',
    xs: '0 1px 2px rgba(0, 0, 0, 0.3)',
    sm: '0 2px 4px rgba(0, 0, 0, 0.4)',
    md: '0 4px 8px rgba(0, 0, 0, 0.5)',
    lg: '0 8px 16px rgba(0, 0, 0, 0.5)',
    xl: '0 16px 32px rgba(0, 0, 0, 0.6)',
    '2xl': '0 32px 64px rgba(0, 0, 0, 0.7)',
    inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.4)',
  },
  zIndex: {
    hide: -1,
    base: 0,
    dropdown: 100,
    sticky: 200,
    modal: 300,
    popover: 400,
    tooltip: 500,
    toast: 600,
  },
  density: {
    comfortable: 1.0,
    compact: 0.75,
    dense: 0.5,
    rowHeights: {
      comfortable: 24,
      compact: 18,
      dense: 14,
    },
  },
  motion: {
    durations: {
      instant: '0ms',
      fast: '150ms',
      normal: '250ms',
      slow: '400ms',
      hero: '800ms',
    },
    easings: {
      standard: 'cubic-bezier(0.2, 0, 0, 1)',
      emphasize: 'cubic-bezier(0.2, 0, 0.38, 1)',
      decelerate: 'cubic-bezier(0, 0, 0.38, 1)',
      accelerate: 'cubic-bezier(0.4, 0, 1, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
    },
  },
  breakpoints: {
    xs: '320px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
};

export type TokenPath =
  | `colors.semantic.${keyof SemanticColors}.${keyof ColorToken}`
  | `colors.surface.${keyof SurfaceColors}`
  | `colors.text.${keyof TextColors}`
  | `spacing.${keyof SpacingScale}`
  | `typography.fontFamilies.${keyof TypographyScale['fontFamilies']}`
  | `typography.fontSizes.${keyof TypographyScale['fontSizes']}`
  | `typography.fontWeights.${keyof TypographyScale['fontWeights']}`
  | `typography.lineHeights.${keyof TypographyScale['lineHeights']}`
  | `typography.letterSpacings.${keyof TypographyScale['letterSpacings']}`
  | `radii.${keyof RadiusScale}`
  | `shadows.${keyof ShadowScale}`
  | `zIndex.${keyof ZIndexScale}`
  | `density.${keyof DensityScale}`
  | `density.rowHeights.${keyof DensityScale['rowHeights']}`
  | `motion.durations.${keyof MotionScale['durations']}`
  | `motion.easings.${keyof MotionScale['easings']}`
  | `breakpoints.${keyof BreakpointScale}`;

export function getTokenValue(tokens: DesignTokens, path: TokenPath): string | number {
  const keys = path.split('.');
  let value: unknown = tokens;
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = (value as Record<string, unknown>)[key];
    } else {
      return '';
    }
  }
  return value as string | number;
}