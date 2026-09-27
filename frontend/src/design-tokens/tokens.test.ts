/**
 * ECJY Design Tokens - Unit Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  tokens,
  DesignTokens,
  getTokenValue,
  TokenPath,
} from './tokens';
import {
  generateRootCSSVars,
  generateDarkModeCSSVars,
  generateAllCSSVars,
  injectCSSVars,
  removeCSSVars,
  getCSSVarName,
  getCSSVarValue,
} from './css-vars';
import { semanticColors, muiPaletteColors } from '../theme/semantic-colors';

// Mock document for CSS var injection tests
const mockDocument = {
  head: {
    appendChild: vi.fn(),
    removeChild: vi.fn(),
  },
  getElementById: vi.fn(),
  createElement: vi.fn(() => ({
    id: '',
    textContent: '',
  })),
  documentElement: {
    setAttribute: vi.fn(),
    removeAttribute: vi.fn(),
  },
};

describe('Design Tokens - Structure', () => {
  it('should have all required top-level token categories', () => {
    expect(tokens).toHaveProperty('colors');
    expect(tokens).toHaveProperty('spacing');
    expect(tokens).toHaveProperty('typography');
    expect(tokens).toHaveProperty('radii');
    expect(tokens).toHaveProperty('shadows');
    expect(tokens).toHaveProperty('zIndex');
    expect(tokens).toHaveProperty('density');
    expect(tokens).toHaveProperty('motion');
    expect(tokens).toHaveProperty('breakpoints');
  });

  it('should have semantic colors with correct structure', () => {
    const semantic = tokens.colors.semantic;
    expect(semantic).toHaveProperty('precision');
    expect(semantic).toHaveProperty('control');
    expect(semantic).toHaveProperty('detection');
    expect(semantic).toHaveProperty('order');
    expect(semantic).toHaveProperty('security');

    // Each semantic color should have base, subtle, on
    Object.values(semantic).forEach((color) => {
      expect(color).toHaveProperty('base');
      expect(color).toHaveProperty('subtle');
      expect(color).toHaveProperty('on');
      expect(typeof color.base).toBe('string');
      expect(typeof color.subtle).toBe('string');
      expect(typeof color.on).toBe('string');
    });
  });

  it('should have correct semantic color values from design spec', () => {
    expect(tokens.colors.semantic.precision.base).toBe('#00D4AA');
    expect(tokens.colors.semantic.precision.subtle).toBe('#00D4AA1A');
    expect(tokens.colors.semantic.precision.on).toBe('#001A0D');

    expect(tokens.colors.semantic.control.base).toBe('#0095F6');
    expect(tokens.colors.semantic.control.subtle).toBe('#0095F61A');
    expect(tokens.colors.semantic.control.on).toBe('#001428');

    expect(tokens.colors.semantic.detection.base).toBe('#FF6B35');
    expect(tokens.colors.semantic.detection.subtle).toBe('#FF6B351A');
    expect(tokens.colors.semantic.detection.on).toBe('#2D1305');

    expect(tokens.colors.semantic.order.base).toBe('#FFFFFF');
    expect(tokens.colors.semantic.order.subtle).toBe('#FFFFFF0D');
    expect(tokens.colors.semantic.order.on).toBe('#0A0A0A');

    expect(tokens.colors.semantic.security.base).toBe('#00C853');
    expect(tokens.colors.semantic.security.subtle).toBe('#00C8531A');
    expect(tokens.colors.semantic.security.on).toBe('#001A05');
  });

  it('should have correct surface colors', () => {
    expect(tokens.colors.surface.bg).toBe('#0A0A0A');
    expect(tokens.colors.surface.panel).toBe('#121212');
    expect(tokens.colors.surface.panelHover).toBe('#1A1A1A');
    expect(tokens.colors.surface.border).toBe('#2A2A2A');
  });

  it('should have correct text colors', () => {
    expect(tokens.colors.text.primary).toBe('#FFFFFF');
    expect(tokens.colors.text.secondary).toBe('#B3B3B3');
    expect(tokens.colors.text.tertiary).toBe('#808080');
    expect(tokens.colors.text.inverse).toBe('#0A0A0A');
    expect(tokens.colors.text.disabled).toBe('#4A4A4A');
  });

  it('should have density scale with correct values', () => {
    expect(tokens.density.comfortable).toBe(1.0);
    expect(tokens.density.compact).toBe(0.75);
    expect(tokens.density.dense).toBe(0.5);
  });

  it('should have motion scale with correct values', () => {
    expect(tokens.motion.durations.fast).toBe('150ms');
    expect(tokens.motion.durations.normal).toBe('250ms');
    expect(tokens.motion.durations.slow).toBe('400ms');
    expect(tokens.motion.easings.standard).toBe('cubic-bezier(0.2, 0, 0, 1)');
  });

  it('should have spacing scale with correct base values', () => {
    expect(tokens.spacing[0]).toBe('0');
    expect(tokens.spacing[1]).toBe('4px');
    expect(tokens.spacing[2]).toBe('8px');
    expect(tokens.spacing[4]).toBe('16px');
    expect(tokens.spacing[8]).toBe('32px');
  });

  it('should have typography with required font families', () => {
    expect(tokens.typography.fontFamilies.display).toContain('Space Grotesk');
    expect(tokens.typography.fontFamilies.body).toContain('Inter');
    expect(tokens.typography.fontFamilies.mono).toContain('JetBrains Mono');
  });

  it('should have radii scale', () => {
    expect(tokens.radii.none).toBe('0');
    expect(tokens.radii.sm).toBe('4px');
    expect(tokens.radii.md).toBe('8px');
    expect(tokens.radii.lg).toBe('12px');
    expect(tokens.radii.xl).toBe('16px');
    expect(tokens.radii.full).toBe('9999px');
  });

  it('should have shadows scale', () => {
    expect(tokens.shadows.none).toBe('none');
    expect(tokens.shadows.xs).toContain('rgba(0, 0, 0');
    expect(tokens.shadows.md).toContain('rgba(0, 0, 0');
  });

  it('should have zIndex scale', () => {
    expect(tokens.zIndex.hide).toBe(-1);
    expect(tokens.zIndex.base).toBe(0);
    expect(tokens.zIndex.modal).toBe(300);
    expect(tokens.zIndex.toast).toBe(600);
  });

  it('should have breakpoints', () => {
    expect(tokens.breakpoints.xs).toBe('320px');
    expect(tokens.breakpoints.md).toBe('768px');
    expect(tokens.breakpoints.lg).toBe('1024px');
  });
});

describe('Token Value Retrieval', () => {
  it('should retrieve token values by path', () => {
    expect(getTokenValue(tokens, 'colors.semantic.precision.base')).toBe('#00D4AA');
    expect(getTokenValue(tokens, 'colors.surface.bg')).toBe('#0A0A0A');
    expect(getTokenValue(tokens, 'spacing.4')).toBe('16px');
    expect(getTokenValue(tokens, 'typography.fontSizes.base')).toBe('1rem');
    expect(getTokenValue(tokens, 'radii.md')).toBe('8px');
  });

  it('should return empty string for invalid paths', () => {
    expect(getTokenValue(tokens, 'colors.invalid.path')).toBe('');
    expect(getTokenValue(tokens, 'nonexistent.path')).toBe('');
  });
});

describe('CSS Variables Generation', () => {
  beforeEach(() => {
    vi.stubGlobal('document', mockDocument);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should generate root CSS vars', () => {
    const css = generateRootCSSVars(tokens);
    expect(css).toContain(':root {');
    expect(css).toContain('--ecjy-colors-semantic-precision-base: #00D4AA;');
    expect(css).toContain('--ecjy-colors-surface-bg: #0A0A0A;');
    expect(css).toContain('--ecjy-spacing-4: 16px;');
  });

  it('should generate dark mode CSS vars', () => {
    const css = generateDarkModeCSSVars(tokens);
    expect(css).toContain('[data-theme="dark"] {');
    expect(css).toContain('--ecjy-colors-semantic-precision-base: #00D4AA;');
  });

  it('should generate all CSS vars', () => {
    const css = generateAllCSSVars(tokens);
    expect(css).toContain(':root {');
    expect(css).toContain('[data-theme="dark"] {');
  });

  it('should inject CSS vars into document', () => {
    const mockStyleEl = { id: 'ecjy-design-tokens', textContent: '' };
    mockDocument.getElementById.mockReturnValue(null);
    mockDocument.createElement.mockReturnValue(mockStyleEl);

    injectCSSVars(':root { --ecjy-test: value; }');

    expect(mockDocument.createElement).toHaveBeenCalledWith('style');
    expect(mockDocument.head.appendChild).toHaveBeenCalled();
    expect(mockStyleEl.id).toBe('ecjy-design-tokens');
  });

  it('should remove CSS vars from document', () => {
    const mockStyleEl = { remove: vi.fn() };
    mockDocument.getElementById.mockReturnValue(mockStyleEl);

    removeCSSVars();

    expect(mockDocument.getElementById).toHaveBeenCalledWith('ecjy-design-tokens');
    expect(mockStyleEl.remove).toHaveBeenCalled();
  });

  it('should get CSS var name for token path', () => {
    const varName = getCSSVarName('colors.semantic.precision.base');
    expect(varName).toBe('--ecjy-colors-semantic-precision-base');
  });

  it('should get CSS var value function', () => {
    const varValue = getCSSVarValue('colors.semantic.precision.base');
    expect(varValue).toBe('var(--ecjy-colors-semantic-precision-base)');
  });
});

describe('Semantic Colors', () => {
  it('should map semantic colors correctly', () => {
    expect(semanticColors.precision).toEqual(tokens.colors.semantic.precision);
    expect(semanticColors.control).toEqual(tokens.colors.semantic.control);
    expect(semanticColors.detection).toEqual(tokens.colors.semantic.detection);
    expect(semanticColors.order).toEqual(tokens.colors.semantic.order);
    expect(semanticColors.security).toEqual(tokens.colors.semantic.security);
  });

  it('should map state colors to semantic domains', () => {
    expect(semanticColors.success).toEqual(tokens.colors.semantic.security);
    expect(semanticColors.warning).toEqual(tokens.colors.semantic.detection);
    expect(semanticColors.error).toEqual(tokens.colors.semantic.detection);
    expect(semanticColors.info).toEqual(tokens.colors.semantic.control);
  });

  it('should map surface and text colors', () => {
    expect(semanticColors.surface).toEqual(tokens.colors.surface);
    expect(semanticColors.text).toEqual(tokens.colors.text);
  });

  it('should provide MUI palette colors', () => {
    expect(muiPaletteColors.primary.main).toBe('#0095F6');
    expect(muiPaletteColors.secondary.main).toBe('#00C853');
    expect(muiPaletteColors.error.main).toBe('#FF6B35');
    expect(muiPaletteColors.background.default).toBe('#0A0A0A');
    expect(muiPaletteColors.background.paper).toBe('#121212');
  });
});

describe('Token Types', () => {
  it('should have correct DesignTokens structure', () => {
    const typedTokens: DesignTokens = tokens;
    expect(typedTokens).toBeDefined();
  });

  it('TokenPath type should include all valid paths', () => {
    // These should compile without type errors
    const validPaths: TokenPath[] = [
      'colors.semantic.precision.base',
      'colors.surface.bg',
      'colors.text.primary',
      'spacing.4',
      'typography.fontFamilies.display',
      'typography.fontSizes.base',
      'typography.fontWeights.bold',
      'typography.lineHeights.normal',
      'typography.letterSpacings.tight',
      'radii.md',
      'shadows.md',
      'zIndex.modal',
      'density.comfortable',
      'motion.durations.normal',
      'motion.easings.standard',
      'breakpoints.md',
    ];
    expect(validPaths.length).toBeGreaterThan(0);
  });
});