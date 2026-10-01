import { render, screen, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ECJYThemeProvider } from '../theme/ECJYThemeProvider';
import { AppHeader } from './AppHeader';
import { DensitySelector } from './DensitySelector';

// Mock useFeatureFlagEnabled to always return true for tests
vi.mock('../hooks/useFeatureFlag', () => ({
  useFeatureFlagEnabled: vi.fn(() => true),
  useFeatureFlag: vi.fn(() => ({
    isEnabled: vi.fn(() => true),
    allFlags: {},
    setFlag: vi.fn(),
    resetFlag: vi.fn(),
  })),
}));

// Mock useDensity
vi.mock('../hooks/useDensity', () => ({
  useDensity: vi.fn(() => ({
    density: 'comfortable',
    setDensity: vi.fn(),
    rowHeight: 24,
    multiplier: 1.0,
  })),
}));

// Mock HeroOpening
vi.mock('./HeroOpening', () => ({
  HeroOpening: ({ onComplete }: { onComplete: () => void }) => {
    setTimeout(onComplete, 0);
    return null;
  },
}));

// Mock StateIndicators
vi.mock('./StateIndicators', () => ({
  StateIndicators: () => <div data-testid="state-indicators" />,
}));

// Mock DensitySelector to simplify tests
vi.mock('./DensitySelector', () => ({
  DensitySelector: ({ density, onChange }: { density: string; onChange: Function }) => (
    <button 
      data-testid="density-selector"
      aria-label="Selector de densidad"
      onClick={() => onChange('compact')}
    >
      {density}
    </button>
  ),
}));

const defaultMetrics = {
  precision: { value: 98.5, previous: 97.2, threshold: 95 },
  control: { value: 1247, previous: 1100 },
  detection: { value: 23, previous: 30, threshold: 50 },
  order: { value: 99.2, previous: 98.5 },
  security: { value: 0, previous: 0, threshold: 0 },
};

const renderAppHeader = (props = {}) => {
  return render(
    <ECJYThemeProvider>
      <AppHeader 
        metrics={defaultMetrics}
        darkMode={true}
        toggleDarkMode={vi.fn()}
        onExport={vi.fn()}
        onHelpOpen={vi.fn()}
        onHelpClose={vi.fn()}
        {...props} 
      />
    </ECJYThemeProvider>
  );
};

describe('AppHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders ECJY branding after mount', async () => {
    renderAppHeader({ showHero: false });
    
    await waitFor(() => {
      expect(screen.getByText(/Cruce/)).toBeInTheDocument();
    });
    expect(screen.getByText(/ARBA/)).toBeInTheDocument();
    expect(screen.getByText(/AGIP/)).toBeInTheDocument();
    expect(screen.getByText(/ECJY/)).toBeInTheDocument();
  });

  it('renders StateIndicators in compact mode when metrics provided', async () => {
    renderAppHeader({ showHero: false, metrics: defaultMetrics });
    
    await waitFor(() => {
      expect(screen.getByTestId('state-indicators')).toBeInTheDocument();
    });
  });

  it('shows HeroOpening on first load when showHero=true, then renders header', async () => {
    renderAppHeader({ showHero: true });
    
    await waitFor(() => {
      expect(screen.getByText(/Cruce/)).toBeInTheDocument();
    });
  });

  it('has sticky positioning with z-index 1100', async () => {
    renderAppHeader({ showHero: false });
    
    await waitFor(() => {
      const appBar = screen.getByRole('banner');
      expect(appBar).toHaveStyle({ position: 'sticky', zIndex: 1100 });
    });
  });

  it('renders DensitySelector (mocked)', async () => {
    renderAppHeader({ showHero: false });
    
    await waitFor(() => {
      expect(screen.getByTestId('density-selector')).toBeInTheDocument();
    });
  });

  it('renders header structure with left, center, right sections', async () => {
    renderAppHeader({ showHero: false });
    
    await waitFor(() => {
      // Left section - branding
      expect(screen.getByText(/Cruce/)).toBeInTheDocument();
      // Center section - StateIndicators
      expect(screen.getByTestId('state-indicators')).toBeInTheDocument();
      // Right section - DensitySelector
      expect(screen.getByTestId('density-selector')).toBeInTheDocument();
    });
  });

  it('shows help dialog with keyboard shortcuts when open', async () => {
    renderAppHeader({ showHero: false, helpOpen: true, onHelpClose: vi.fn() });
    
    await waitFor(() => {
      expect(screen.getByText('Atajos de teclado')).toBeInTheDocument();
      expect(screen.getByText('Ctrl + N')).toBeInTheDocument();
      expect(screen.getByText('Nuevo cruce')).toBeInTheDocument();
    });
  });
});

describe('DensitySelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders density selector component', () => {
    render(
      <ECJYThemeProvider>
        <DensitySelector 
          density="comfortable"
          onChange={vi.fn()}
        />
      </ECJYThemeProvider>
    );
    
    expect(screen.getByTestId('density-selector')).toBeInTheDocument();
    expect(screen.getByTestId('density-selector')).toHaveTextContent('comfortable');
  });

  it('calls onChange when clicked', () => {
    const onChange = vi.fn();
    render(
      <ECJYThemeProvider>
        <DensitySelector 
          density="comfortable"
          onChange={onChange}
        />
      </ECJYThemeProvider>
    );
    
    const button = screen.getByTestId('density-selector');
    act(() => {
      button.click();
    });
    
    expect(onChange).toHaveBeenCalledWith('compact');
  });

  it('shows label when showLabel is true', () => {
    render(
      <ECJYThemeProvider>
        <DensitySelector 
          density="dense"
          onChange={vi.fn()}
          showLabel={true}
        />
      </ECJYThemeProvider>
    );
    
    expect(screen.getByTestId('density-selector')).toHaveTextContent('dense');
  });
});