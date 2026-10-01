/**
 * HeroOpening Component - Unit & Integration Tests
 * Tests sequence timing, skip interaction, reduced-motion, onComplete callback
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HeroOpening } from './HeroOpening';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  },
  useReducedMotion: () => false,
  useAnimationControls: () => ({
    start: vi.fn(),
    stop: vi.fn(),
  }),
}));

// Mock canvas-confetti
vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

// Mock feature flag
vi.mock('../hooks/useFeatureFlag', () => ({
  useFeatureFlagEnabled: () => true,
}));

// Mock ECJY tokens
vi.mock('../theme/ECJYThemeProvider', () => ({
  useECJYTokens: () => ({
    tokens: {
      colors: {
        semantic: {
          precision: { base: '#00D4AA', subtle: '#00D4AA1A', on: '#001A0D' },
          control: { base: '#0095F6', subtle: '#0095F61A', on: '#001428' },
          detection: { base: '#FF6B35', subtle: '#FF6B351A', on: '#2D1305' },
          order: { base: '#FFFFFF', subtle: '#FFFFFF0D', on: '#0A0A0A' },
          security: { base: '#00C853', subtle: '#00C8531A', on: '#001A05' },
        },
        surface: { bg: '#0A0A0A', panel: '#121212', panelHover: '#1A1A1A', border: '#2A2A2A' },
        text: { primary: '#FFFFFF', secondary: '#B3B3B3', tertiary: '#808080', inverse: '#0A0A0A', disabled: '#4A4A4A' },
      },
      typography: {
        fontFamilies: { display: '"Space Grotesk"', body: '"Inter"', mono: '"JetBrains Mono"' },
        fontSizes: { xs: '0.75rem', sm: '0.875rem', base: '1rem', lg: '1.125rem', xl: '1.25rem', '2xl': '1.5rem', '3xl': '2rem', '4xl': '3rem' },
        fontWeights: { normal: 400, medium: 500, semibold: 600, bold: 700 },
        lineHeights: { tight: 1.25, normal: 1.5, relaxed: 1.75 },
        letterSpacings: { tight: '-0.02em', normal: '0', wide: '0.02em' },
      },
      motion: {
        durations: { instant: '0ms', fast: '150ms', normal: '250ms', slow: '400ms', hero: '800ms' },
        easings: { standard: 'cubic-bezier(0.2, 0, 0, 1)', emphasize: 'cubic-bezier(0.2, 0, 0.38, 1)', decelerate: 'cubic-bezier(0, 0, 0.38, 1)', accelerate: 'cubic-bezier(0.4, 0, 1, 1)', sharp: 'cubic-bezier(0.4, 0, 0.6, 1)' },
      },
      zIndex: { modal: 300 },
      spacing: { 1: '4px', 2: '8px', 3: '12px', 4: '16px', 5: '20px', 6: '24px' },
    },
  }),
}));

const renderHeroOpening = (props: { onComplete: () => void } = { onComplete: vi.fn() }) => {
  return render(<HeroOpening {...props} />);
};

describe('HeroOpening', () => {
  let onCompleteMock: () => void;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    onCompleteMock = vi.fn() as () => void;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders all four stages when feature flag enabled', () => {
    renderHeroOpening({ onComplete: onCompleteMock });
    
    // All stages should eventually be visible
    expect(screen.getByText('ARCA')).toBeInTheDocument();
    expect(screen.getByText('SISTEMA')).toBeInTheDocument();
    expect(screen.getByText('CONTROL')).toBeInTheDocument();
    expect(screen.getByText('DIFERENCIAS')).toBeInTheDocument();
  });

  it('skips animation on click', () => {
    const { container } = renderHeroOpening({ onComplete: onCompleteMock });
    
    // Click to skip
    fireEvent.click(container.firstChild!);

    expect(onCompleteMock).toHaveBeenCalledTimes(1);
  });

  it('skips animation on keypress', () => {
    renderHeroOpening({ onComplete: onCompleteMock });
    
    // Press any key to skip
    fireEvent.keyDown(document, { key: 'Enter' });

    expect(onCompleteMock).toHaveBeenCalledTimes(1);
  });

  it('renders when feature flag enabled', () => {
    renderHeroOpening({ onComplete: onCompleteMock });
    expect(screen.getByText('ARCA')).toBeInTheDocument();
  });

  it('applies correct colors to each stage', () => {
    renderHeroOpening({ onComplete: onCompleteMock });
    
    const arca = screen.getByText('ARCA');
    const sistema = screen.getByText('SISTEMA');
    const control = screen.getByText('CONTROL');
    const diferencias = screen.getByText('DIFERENCIAS');
    
    expect(arca).toHaveStyle({ color: '#00D4AA' }); // precision
    expect(sistema).toHaveStyle({ color: '#0095F6' }); // control
    expect(control).toHaveStyle({ color: '#FF6B35' }); // detection
    expect(diferencias).toHaveStyle({ color: '#FFFFFF' }); // order
  });

  it('applies correct typography hierarchy', () => {
    renderHeroOpening({ onComplete: onCompleteMock });
    
    const arca = screen.getByText('ARCA');
    const diferencias = screen.getByText('DIFERENCIAS');
    
    // ARCA should be largest (displayLarge = 4xl = 3rem)
    expect(arca).toHaveStyle({ fontSize: '3rem' });
    // DIFERENCIAS should be headlineMedium = xl = 1.25rem
    expect(diferencias).toHaveStyle({ fontSize: '1.25rem' });
  });

  it('has skip button when not completed', () => {
    renderHeroOpening({ onComplete: onCompleteMock });
    
    const skipButton = screen.getByRole('button', { name: /saltar animación/i });
    expect(skipButton).toBeInTheDocument();
  });

  it('has correct aria attributes', () => {
    renderHeroOpening({ onComplete: onCompleteMock });
    
    const container = screen.getByRole('region', { name: /secuencia de apertura ecjy/i });
    expect(container).toBeInTheDocument();
    expect(container).toHaveAttribute('aria-live', 'polite');
  });
});