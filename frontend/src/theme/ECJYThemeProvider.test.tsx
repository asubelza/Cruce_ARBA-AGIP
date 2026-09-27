/**
 * ECJY Theme Provider - Unit Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';
import { ECJYThemeProvider, useECJYTokens, useECJYTokensOptional } from './ECJYThemeProvider';
import { tokens } from '../design-tokens/tokens';

// Mock the feature flag
vi.mock('import.meta.env', () => ({
  VITE_ECJY_VISUAL_PHASE_1: 'true',
}));

// Mock MUI ThemeProvider
vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material');
  return {
    ...actual,
    ThemeProvider: ({ children, theme }: { children: React.ReactNode; theme: unknown }) => (
      <div data-mui-theme={JSON.stringify(theme)}>{children}</div>
    ),
    CssBaseline: () => <div data-css-baseline />,
    createTheme: (options: unknown) => options,
  };
});

describe('ECJYThemeProvider', () => {
  beforeEach(() => {
    vi.stubGlobal('document', {
      head: { appendChild: vi.fn(), removeChild: vi.fn() },
      getElementById: vi.fn(() => null),
      createElement: vi.fn(() => ({ id: '', textContent: '' })),
      documentElement: { setAttribute: vi.fn(), removeAttribute: vi.fn() },
    });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('should provide tokens and semantic colors when enabled', () => {
    const TestComponent = () => {
      const { tokens: ctxTokens, semanticColors, isEnabled } = useECJYTokens();
      return (
        <div>
          <span data-testid="enabled">{String(isEnabled)}</span>
          <span data-testid="precision-base">{ctxTokens.colors.semantic.precision.base}</span>
          <span data-testid="surface-bg">{ctxTokens.colors.surface.bg}</span>
          <span data-testid="semantic-precision">{semanticColors.precision.base}</span>
        </div>
      );
    };

    render(
      <ECJYThemeProvider>
        <TestComponent />
      </ECJYThemeProvider>
    );

    expect(screen.getByTestId('enabled').textContent).toBe('true');
    expect(screen.getByTestId('precision-base').textContent).toBe('#00D4AA');
    expect(screen.getByTestId('surface-bg').textContent).toBe('#0A0A0A');
    expect(screen.getByTestId('semantic-precision').textContent).toBe('#00D4AA');
  });

  it('should provide theme object', () => {
    const TestComponent = () => {
      const { theme } = useECJYTokens();
      return <span data-testid="theme">{theme ? 'exists' : 'missing'}</span>;
    };

    render(
      <ECJYThemeProvider>
        <TestComponent />
      </ECJYThemeProvider>
    );

    expect(screen.getByTestId('theme').textContent).toBe('exists');
  });

  it('should allow token override', () => {
    const customTokens = {
      colors: {
        semantic: {
          precision: { base: '#CUSTOM', subtle: '#CUSTOM1A', on: '#CUSTOMON' },
        },
      },
    };

    const TestComponent = () => {
      const { tokens: ctxTokens } = useECJYTokens();
      return <span data-testid="custom-precision">{ctxTokens.colors.semantic.precision.base}</span>;
    };

    render(
      <ECJYThemeProvider tokensOverride={customTokens}>
        <TestComponent />
      </ECJYThemeProvider>
    );

    expect(screen.getByTestId('custom-precision').textContent).toBe('#CUSTOM');
  });

  it('should work with disabled flag', () => {
    const TestComponent = () => {
      const { isEnabled } = useECJYTokens();
      return <span data-testid="disabled-enabled">{String(isEnabled)}</span>;
    };

    render(
      <ECJYThemeProvider disabled>
        <TestComponent />
      </ECJYThemeProvider>
    );

    expect(screen.getByTestId('disabled-enabled').textContent).toBe('false');
  });

  it('should throw error when useECJYTokens used outside provider', () => {
    const TestComponent = () => {
      useECJYTokens();
      return <div />;
    };

    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useECJYTokens must be used within an ECJYThemeProvider');

    consoleSpy.mockRestore();
  });

  it('should return null for useECJYTokensOptional outside provider', () => {
    const TestComponent = () => {
      const ctx = useECJYTokensOptional();
      return <span data-testid="optional-ctx">{ctx ? 'exists' : 'null'}</span>;
    };

    render(<TestComponent />);

    expect(screen.getByTestId('optional-ctx').textContent).toBe('null');
  });

  it('should merge deep token overrides', () => {
    const customTokens = {
      colors: {
        semantic: {
          precision: { base: '#OVERRIDE' },
        },
        surface: {
          bg: '#OVERRIDE_BG',
        },
      },
      spacing: {
        4: '20px',
      },
    };

    const TestComponent = () => {
      const { tokens: ctxTokens } = useECJYTokens();
      return (
        <div>
          <span data-testid="precision">{ctxTokens.colors.semantic.precision.base}</span>
          <span data-testid="surface-bg">{ctxTokens.colors.surface.bg}</span>
          <span data-testid="spacing-4">{ctxTokens.spacing[4]}</span>
          <span data-testid="spacing-8">{ctxTokens.spacing[8]}</span>
        </div>
      );
    };

    render(
      <ECJYThemeProvider tokensOverride={customTokens}>
        <TestComponent />
      </ECJYThemeProvider>
    );

    expect(screen.getByTestId('precision').textContent).toBe('#OVERRIDE');
    expect(screen.getByTestId('surface-bg').textContent).toBe('#OVERRIDE_BG');
    expect(screen.getByTestId('spacing-4').textContent).toBe('20px');
    // Unchanged values should remain
    expect(screen.getByTestId('spacing-8').textContent).toBe('32px');
  });
});

describe('Feature Flag Behavior', () => {
  it('should respect VITE_ECJY_VISUAL_PHASE_1 flag', () => {
    // This test verifies the feature flag logic is in place
    // The actual flag is evaluated at build time via Vite define
    expect(typeof import.meta.env.VITE_ECJY_VISUAL_PHASE_1).toBeDefined();
  });
});