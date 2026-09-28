/**
 * ECJY Theme - Semantic Color Aliases
 * Maps semantic color names to token values for easier consumption
 */

import { tokens, SurfaceColors, TextColors, ColorToken } from '../design-tokens/tokens';

export interface SemanticColorAliases {
  // Domain-specific semantic colors
  precision: ColorToken;
  control: ColorToken;
  detection: ColorToken;
  order: ColorToken;
  security: ColorToken;

  // Surface colors
  surface: SurfaceColors;

  // Text colors
  text: TextColors;

  // State colors (derived from semantic)
  success: ColorToken;
  warning: ColorToken;
  error: ColorToken;
  info: ColorToken;

  // Interactive states
  focus: ColorToken;
  hover: ColorToken;
  active: ColorToken;
  disabled: ColorToken;
}

export const semanticColors: SemanticColorAliases = {
  // Direct mapping from tokens
  precision: tokens.colors.semantic.precision,
  control: tokens.colors.semantic.control,
  detection: tokens.colors.semantic.detection,
  order: tokens.colors.semantic.order,
  security: tokens.colors.semantic.security,

  // Surface colors
  surface: tokens.colors.surface,

  // Text colors
  text: tokens.colors.text,

  // State colors mapped to semantic domains
  success: tokens.colors.semantic.security,    // Green - security/success
  warning: tokens.colors.semantic.detection,   // Orange - detection/warning
  error: tokens.colors.semantic.detection,     // Orange/Red - detection/error
  info: tokens.colors.semantic.control,        // Blue - control/info

  // Interactive states (using control as primary interactive color)
  focus: tokens.colors.semantic.control,
  hover: {
    base: tokens.colors.semantic.control.base,
    subtle: tokens.colors.semantic.control.subtle,
    on: tokens.colors.semantic.control.on,
  },
  active: {
    base: tokens.colors.semantic.control.base,
    subtle: tokens.colors.semantic.control.subtle,
    on: tokens.colors.semantic.control.on,
  },
  disabled: {
    base: tokens.colors.text.disabled,
    subtle: `${tokens.colors.text.disabled}33`,
    on: tokens.colors.text.tertiary,
  },
};

export type SemanticColorKey = keyof SemanticColorAliases;

export function getSemanticColor(key: SemanticColorKey): ColorToken | SurfaceColors | TextColors {
  return semanticColors[key];
}

export function getSemanticColorCSSVar(key: SemanticColorKey, variant: keyof ColorToken = 'base'): string {
  const color = semanticColors[key];
  if ('base' in color) {
    return `var(--ecjy-colors-semantic-${key.toLowerCase()}-${variant})`;
  }
  // For surface and text, return the first available property
  const firstKey = Object.keys(color)[0] as keyof typeof color;
  return `var(--ecjy-colors-${key.toLowerCase()}-${firstKey})`;
}

// Helper for MUI theme integration
export const muiPaletteColors = {
  primary: {
    main: semanticColors.control.base,
    light: semanticColors.control.subtle,
    dark: semanticColors.control.on,
    contrastText: semanticColors.control.on,
  },
  secondary: {
    main: semanticColors.security.base,
    light: semanticColors.security.subtle,
    dark: semanticColors.security.on,
    contrastText: semanticColors.security.on,
  },
  error: {
    main: semanticColors.error.base,
    light: semanticColors.error.subtle,
    dark: semanticColors.error.on,
    contrastText: semanticColors.error.on,
  },
  warning: {
    main: semanticColors.warning.base,
    light: semanticColors.warning.subtle,
    dark: semanticColors.warning.on,
    contrastText: semanticColors.warning.on,
  },
  info: {
    main: semanticColors.info.base,
    light: semanticColors.info.subtle,
    dark: semanticColors.info.on,
    contrastText: semanticColors.info.on,
  },
  success: {
    main: semanticColors.success.base,
    light: semanticColors.success.subtle,
    dark: semanticColors.success.on,
    contrastText: semanticColors.success.on,
  },
  background: {
    default: semanticColors.surface.bg,
    paper: semanticColors.surface.panel,
  },
  text: {
    primary: semanticColors.text.primary,
    secondary: semanticColors.text.secondary,
    disabled: semanticColors.text.disabled,
  },
  divider: semanticColors.surface.border,
};