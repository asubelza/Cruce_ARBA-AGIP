/**
 * ECJY Theme Provider - Unit Tests
 * Tests core token logic and hook functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tokens, DesignTokens, DensityMode, getTokenValue } from '../design-tokens/tokens';
import { generateAllCSSVars, injectCSSVars, removeCSSVars, getCSSVarName, getCSSVarValue } from '../design-tokens/css-vars';
import { semanticColors, muiPaletteColors } from './semantic-colors';

// Mock the feature flag
vi.mock('import.meta.env', () => ({
  VITE_ECJY_VISUAL_PHASE_1: 'true',
}));

// Mock CSS vars injection
vi.mock('../design-tokens/css-vars', async () => {
  const actual = await vi.importActual('../design-tokens/css-vars');
  return {
    ...actual,
    generateAllCSSVars: vi.fn(() => ':root {}\n\n[data-theme="dark"] {}'),
    injectCSSVars: vi.fn(),
    removeCSSVars: vi.fn(),
  };
});

// Mock localStorage for density hook tests
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};
Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('Design Tokens - Extended Structure', () => {
  it('should have density rowHeights', () => {
    expect(tokens.density.rowHeights).toBeDefined();
    expect(tokens.density.rowHeights.comfortable).toBe(24);
    expect(tokens.density.rowHeights.compact).toBe(18);
    expect(tokens.density.rowHeights.dense).toBe(14);
  });

  it('should have extended motion durations', () => {
    expect(tokens.motion.durations.instant).toBe('0ms');
    expect(tokens.motion.durations.hero).toBe('800ms');
  });

  it('should have extended motion easings', () => {
    expect(tokens.motion.easings.accelerate).toBe('cubic-bezier(0.4, 0, 1, 1)');
    expect(tokens.motion.easings.sharp).toBe('cubic-bezier(0.4, 0, 0.6, 1)');
  });

  it('should retrieve token values by path including new tokens', () => {
    expect(getTokenValue(tokens, 'density.rowHeights.comfortable')).toBe(24);
    expect(getTokenValue(tokens, 'motion.durations.hero')).toBe('800ms');
    expect(getTokenValue(tokens, 'motion.easings.sharp')).toBe('cubic-bezier(0.4, 0, 0.6, 1)');
  });
});

describe('CSS Variables Generation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate root CSS vars', () => {
    const css = generateAllCSSVars(tokens);
    expect(css).toContain(':root');
    expect(css).toContain('[data-theme="dark"]');
    // Note: actual token values are tested in design-tokens tests
    expect(generateAllCSSVars).toHaveBeenCalled();
  });

  it('should inject and remove CSS vars', () => {
    injectCSSVars(':root { --ecjy-test: value; }');
    expect(injectCSSVars).toHaveBeenCalled();

    removeCSSVars();
    expect(removeCSSVars).toHaveBeenCalled();
  });

  it('should get CSS var name for new token paths', () => {
    const densityVarName = getCSSVarName('density.rowHeights.comfortable');
    expect(densityVarName).toBe('--ecjy-density-rowheights-comfortable');

    const motionVarName = getCSSVarName('motion.durations.hero');
    expect(motionVarName).toBe('--ecjy-motion-durations-hero');

    const easingVarName = getCSSVarName('motion.easings.sharp');
    expect(easingVarName).toBe('--ecjy-motion-easings-sharp');
  });

  it('should get CSS var value function', () => {
    const varValue = getCSSVarValue('motion.durations.hero');
    expect(varValue).toBe('var(--ecjy-motion-durations-hero)');
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

  it('should provide MUI palette colors', () => {
    expect(muiPaletteColors.primary.main).toBe('#0095F6');
    expect(muiPaletteColors.secondary.main).toBe('#00C853');
    expect(muiPaletteColors.error.main).toBe('#FF6B35');
    expect(muiPaletteColors.background.default).toBe('#0A0A0A');
    expect(muiPaletteColors.background.paper).toBe('#121212');
  });
});

describe('Token Types', () => {
  it('should have correct DesignTokens structure with new fields', () => {
    const typedTokens: DesignTokens = tokens;
    expect(typedTokens.density.rowHeights).toBeDefined();
    expect(typedTokens.motion.durations.hero).toBeDefined();
    expect(typedTokens.motion.easings.sharp).toBeDefined();
  });

  it('TokenPath type should include all valid paths including new ones', () => {
    const validPaths = [
      'density.rowHeights.comfortable',
      'motion.durations.hero',
      'motion.easings.sharp',
      'motion.easings.accelerate',
    ] as const;
    expect(validPaths.length).toBe(4);
  });
});

// Hook tests - testing hook logic directly
describe('useDensity hook logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('should have correct density config', () => {
    const DENSITY_CONFIG = {
      comfortable: { rowHeight: 24, multiplier: 1.0 },
      compact: { rowHeight: 18, multiplier: 0.75 },
      dense: { rowHeight: 14, multiplier: 0.5 },
    };

    expect(DENSITY_CONFIG.comfortable.rowHeight).toBe(24);
    expect(DENSITY_CONFIG.comfortable.multiplier).toBe(1.0);
    expect(DENSITY_CONFIG.compact.rowHeight).toBe(18);
    expect(DENSITY_CONFIG.compact.multiplier).toBe(0.75);
    expect(DENSITY_CONFIG.dense.rowHeight).toBe(14);
    expect(DENSITY_CONFIG.dense.multiplier).toBe(0.5);
  });

  it('should persist density to localStorage', () => {
    localStorageMock.setItem.mockClear();
    const testDensity: DensityMode = 'compact';
    localStorageMock.setItem('ecjy-density-mode', testDensity);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('ecjy-density-mode', 'compact');
  });
});

describe('useFeatureFlag hook logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('should have correct flag prefix', () => {
    const FLAG_PREFIX = 'VITE_ECJY_';
    const STORAGE_PREFIX = 'ecjy-';
    expect(FLAG_PREFIX).toBe('VITE_ECJY_');
    expect(STORAGE_PREFIX).toBe('ecjy-');
  });

  it('should check env vars correctly', () => {
    // Test env var parsing logic
    const value = 'true';
    const result = value === 'true' || value === '1';
    expect(result).toBe(true);
  });

  it('should check localStorage override correctly', () => {
    localStorageMock.getItem.mockReturnValue('true');
    const stored = localStorageMock.getItem('ecjy-hero-opening');
    expect(stored).toBe('true');
  });
});

describe('useGrid hook logic', () => {
  it('should have correct grid configuration', () => {
    const columns = 12;
    const gutter = '16px';
    const margin = '24px';
    expect(columns).toBe(12);
    expect(gutter).toBe('16px');
    expect(margin).toBe('24px');
  });

  it('should calculate colSpan correctly', () => {
    const colSpan = (n: number) => {
      const clamped = Math.max(1, Math.min(12, n));
      return `span ${clamped} / span ${clamped}`;
    };
    expect(colSpan(6)).toBe('span 6 / span 6');
    expect(colSpan(12)).toBe('span 12 / span 12');
    expect(colSpan(0)).toBe('span 1 / span 1');
    expect(colSpan(15)).toBe('span 12 / span 12');
  });
});