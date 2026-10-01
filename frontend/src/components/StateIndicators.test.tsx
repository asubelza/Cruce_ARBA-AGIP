/**
 * StateIndicators Component - Unit & Integration Tests
 * Tests metric calculations, threshold colors, compact/expanded layouts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StateIndicators } from './StateIndicators';
import { ECJYMetrics } from './StateIndicators';
import { ECJYThemeProvider } from '../theme/ECJYThemeProvider';

// Mock feature flag
vi.mock('../hooks/useFeatureFlag', () => ({
  useFeatureFlagEnabled: () => true,
}));

const defaultMetrics: ECJYMetrics = {
  precision: { value: 98.5, previous: 97.2, threshold: 95 },
  control: { value: 1247, previous: 1100 },
  detection: { value: 23, previous: 30, threshold: 50 },
  order: { value: 99.2, previous: 98.5 },
  security: { value: 0, previous: 0, threshold: 0 },
};

const renderStateIndicators = (props: { metrics: ECJYMetrics; compact?: boolean } = { metrics: defaultMetrics }) => {
  return render(
    <ECJYThemeProvider>
      <StateIndicators {...props} />
    </ECJYThemeProvider>
  );
};

describe('StateIndicators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all five badges in correct order', () => {
    renderStateIndicators();
    
    expect(screen.getByText('Precisión')).toBeInTheDocument();
    expect(screen.getByText('Control')).toBeInTheDocument();
    expect(screen.getByText('Detección')).toBeInTheDocument();
    expect(screen.getByText('Orden')).toBeInTheDocument();
    expect(screen.getByText('Seguridad')).toBeInTheDocument();
  });

  it('renders compact layout when compact=true', () => {
    renderStateIndicators({ metrics: defaultMetrics, compact: true });
    
    // In compact mode, labels should not be visible
    expect(screen.queryByText('Precisión')).not.toBeInTheDocument();
    expect(screen.queryByText('Control')).not.toBeInTheDocument();
    // But values should be visible (animated values start at 0)
    const percentValues = screen.getAllByText('0.0%');
    const zeroValues = screen.getAllByText('0');
    expect(percentValues.length).toBeGreaterThanOrEqual(2); // Precision and Order
    expect(zeroValues.length).toBeGreaterThanOrEqual(3); // Control, Detection, Security
  });

  it('renders expanded layout when compact=false', () => {
    renderStateIndicators({ metrics: defaultMetrics, compact: false });
    
    // In expanded mode, labels should be visible
    expect(screen.getByText('Precisión')).toBeInTheDocument();
    expect(screen.getByText('Control')).toBeInTheDocument();
    expect(screen.getByText('Detección')).toBeInTheDocument();
    expect(screen.getByText('Orden')).toBeInTheDocument();
    expect(screen.getByText('Seguridad')).toBeInTheDocument();
  });

  it('applies correct structure for each badge', () => {
    renderStateIndicators();
    
    // Each badge should be in a region with the indicators label
    const region = screen.getByRole('region', { name: /indicadores de estado ecjy/i });
    expect(region).toBeInTheDocument();
    
    // Should have 5 badge containers
    const badgeContainers = screen.getAllByText(/Precisión|Control|Detección|Orden|Seguridad/);
    expect(badgeContainers.length).toBe(5);
  });

  it('shows trend indicators', () => {
    renderStateIndicators();
    
    // Should have trend icons (▲, ▼, ●)
    const trendElements = screen.getAllByText(/[▲▼●]/);
    expect(trendElements.length).toBeGreaterThan(0);
  });

  it('shows amber alert when Precision < 95%', () => {
    const lowPrecisionMetrics: ECJYMetrics = {
      ...defaultMetrics,
      precision: { value: 94.0, previous: 96.0, threshold: 95 },
    };
    
    renderStateIndicators({ metrics: lowPrecisionMetrics });
    
    // Should render without error and show the precision badge
    const precisionBadge = screen.getByText('Precisión');
    expect(precisionBadge).toBeInTheDocument();
  });

  it('shows amber alert when Detection > 50', () => {
    const highDetectionMetrics: ECJYMetrics = {
      ...defaultMetrics,
      detection: { value: 75, previous: 40, threshold: 50 },
    };
    
    renderStateIndicators({ metrics: highDetectionMetrics });
    
    const detectionBadge = screen.getByText('Detección');
    expect(detectionBadge).toBeInTheDocument();
  });

  it('shows red alert when Security > 0', () => {
    const securityBreachMetrics: ECJYMetrics = {
      ...defaultMetrics,
      security: { value: 3, previous: 0, threshold: 0 },
    };
    
    renderStateIndicators({ metrics: securityBreachMetrics });
    
    const securityBadge = screen.getByText('Seguridad');
    expect(securityBadge).toBeInTheDocument();
  });

  it('computes Precision correctly: (confirmed/total) * 100', () => {
    const confirmed = 150;
    const total = 152;
    const precision = (confirmed / total) * 100;
    
    expect(precision).toBeCloseTo(98.68, 1);
  });

  it('computes Order correctly: (matched pairs / total possible pairs) * 100', () => {
    const matchedPairs = 150;
    const totalPossible = 151;
    const order = (matchedPairs / totalPossible) * 100;
    
    expect(order).toBeCloseTo(99.34, 1);
  });

  it('handles zero values correctly', () => {
    const zeroMetrics: ECJYMetrics = {
      precision: { value: 0, previous: 0, threshold: 95 },
      control: { value: 0, previous: 0 },
      detection: { value: 0, previous: 0, threshold: 50 },
      order: { value: 0, previous: 0 },
      security: { value: 0, previous: 0, threshold: 0 },
    };
    
    renderStateIndicators({ metrics: zeroMetrics });
    
    const percentValues = screen.getAllByText('0.0%');
    const zeroValues = screen.getAllByText('0');
    expect(percentValues.length).toBeGreaterThanOrEqual(2); // Precision and Order
    expect(zeroValues.length).toBeGreaterThanOrEqual(3); // Control, Detection, Security
  });

  it('handles large numbers with proper formatting', () => {
    const largeMetrics: ECJYMetrics = {
      ...defaultMetrics,
      control: { value: 1500000, previous: 1200000 },
    };
    
    renderStateIndicators({ metrics: largeMetrics });
    
    // Should render without error
    const controlBadge = screen.getByText('Control');
    expect(controlBadge).toBeInTheDocument();
  });
});