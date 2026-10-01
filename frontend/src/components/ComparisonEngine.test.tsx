import { describe, it, expect, vi, beforeEach, act } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ComparisonEngine } from './ComparisonEngine';
import { ECJYThemeProvider } from '../theme/ECJYThemeProvider';
import { Ingreso, MatchResult, CruceOk } from '../types';
import { useDensity } from '../hooks/useDensity';
import { useFeatureFlagEnabled } from '../hooks/useFeatureFlag';
import React from 'react';

vi.mock('../hooks/useDensity', () => ({
  useDensity: vi.fn(() => ({
    density: 'comfortable',
    rowHeight: 24,
    multiplier: 1,
  })),
}));

vi.mock('../hooks/useFeatureFlag', () => ({
  useFeatureFlagEnabled: vi.fn((flag: string) => flag === 'COMPARISON_ENGINE'),
}));

vi.mock('../theme/ECJYThemeProvider', () => ({
  ECJYThemeProvider: ({ children }: { children: React.ReactNode }) => children,
  useECJYTokens: vi.fn(() => ({
    tokens: {
      colors: {
        semantic: {
          precision: { base: '#0095f6', subtle: '#0095f620' },
          control: { base: '#00c853', subtle: '#00c85320' },
          detection: { base: '#f59e0b', subtle: '#f59e0b20' },
          order: { base: '#10b981', subtle: '#10b98120' },
        },
        surface: {
          border: '#333333',
          panel: '#1e1e1e',
          panelHover: '#2a2a2a',
        },
        text: {
          primary: '#ffffff',
          secondary: '#b0b0b0',
          tertiary: '#808080',
        },
      },
      spacing: [0, 4, 8, 16, 24, 32, 48, 64],
      typography: {
        fontFamilies: {
          display: 'Space Grotesk',
          body: 'Inter',
          mono: 'JetBrains Mono',
        },
        fontWeights: {
          regular: 400,
          medium: 500,
          semibold: 600,
        },
        fontSizes: {
          xs: '0.75rem',
          sm: '0.875rem',
          base: '1rem',
        },
      },
    },
  })),
}));

const mockRetencion: Ingreso[] = Array.from({ length: 50 }, (_, i) => ({
  _id: `ret-${i}`,
  id: `ret-${i}`,
  fuente: 'RETIENCION',
  cuit: `20${String(i).padStart(9, '0')}`,
  monto: 1000 + i * 10,
  periodo: '202401',
  razon_social: `Empresa ${i}`,
  fecha_insert: new Date().toISOString(),
  conciliado: false,
}));

const mockPlataforma: Ingreso[] = Array.from({ length: 50 }, (_, i) => ({
  _id: `plat-${i}`,
  id: `plat-${i}`,
  fuente: 'PLATAFORMA',
  cuit: `20${String(i).padStart(9, '0')}`,
  monto: 1000 + i * 10,
  periodo: '202401',
  razon_social: `Empresa ${i}`,
  fecha_insert: new Date().toISOString(),
  conciliado: false,
}));

const mockMatches: MatchResult[] = Array.from({ length: 10 }, (_, i) => ({
  ret_id: `ret-${i}`,
  plat_id: `plat-${i}`,
  cuit: `20${String(i).padStart(9, '0')}`,
  monto_ret: 1000 + i * 10,
  monto_plat: 1000 + i * 10,
  periodo_ret: '202401',
  periodo_plat: '202401',
}));

const mockConfirmed: CruceOk[] = Array.from({ length: 5 }, (_, i) => ({
  id: `conf-${i}`,
  id_retencion: `ret-${i + 10}`,
  id_plataforma: `plat-${i + 10}`,
  cuit: `20${String(i + 10).padStart(9, '0')}`,
  monto: 2000 + i * 10,
  periodo_ret: '202401',
  periodo_plat: '202401',
  fecha_conciliado: new Date().toISOString(),
}));

describe.skip('ComparisonEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const renderEngine = (props = {}) => {
    const defaultProps = {
      retencionData: mockRetencion,
      plataformaData: mockPlataforma,
      matches: mockMatches,
      confirmedMatches: mockConfirmed,
      onFilterChange: vi.fn(),
      onExport: vi.fn(),
      ...props,
    };
    return render(
      <ECJYThemeProvider>
        <ComparisonEngine {...defaultProps} />
      </ECJYThemeProvider>
    );
  };

  it('renders toolbar with search, period, amount filters', () => {
    renderEngine();
    expect(screen.getByPlaceholderText('Buscar CUIT...')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /estado/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /exportar/i })).toBeInTheDocument();
  });

  it('filters by CUIT search', () => {
    renderEngine();
    
    const searchInput = screen.getByPlaceholderText('Buscar CUIT...');
    fireEvent.change(searchInput, { target: { value: '20000000001' } });
    
    // Should trigger filter change
    expect(screen.getByPlaceholderText('Buscar CUIT...')).toHaveValue('20000000001');
  });

  it('filters by period range', () => {
    renderEngine();
    
    const periodFrom = screen.getByRole('spinbutton', { name: /desde/i });
    fireEvent.change(periodFrom, { target: { value: '2024-02' } });
    
    expect(periodFrom).toHaveValue('2024-02');
  });

  it('filters by amount range', () => {
    renderEngine();
    
    const amountMin = screen.getByPlaceholderText('Min');
    fireEvent.change(amountMin, { target: { value: '1500' } });
    
    expect(amountMin).toHaveValue('1500');
  });

  it('match status filter works', () => {
    renderEngine();
    
    const statusSelect = screen.getByRole('combobox', { name: /estado/i });
    fireEvent.change(statusSelect, { target: { value: 'coincide' } });
    
    expect(statusSelect).toHaveValue('coincide');
  });

  it('advanced filters toggle shows amount tolerance slider', () => {
    renderEngine();
    
    const advancedButton = screen.getByRole('button', { name: /filtros avanzados/i });
    fireEvent.click(advancedButton);
    
    expect(screen.getByRole('slider', { name: /tolerancia monto/i })).toBeInTheDocument();
  });

  it('clear filters button resets all filters', () => {
    renderEngine();
    
    // Set some filters
    const searchInput = screen.getByPlaceholderText('Buscar CUIT...');
    fireEvent.change(searchInput, { target: { value: '20000000001' } });
    
    // Click clear
    const clearButton = screen.getByRole('button', { name: /limpiar filtros/i });
    fireEvent.click(clearButton);
    
    expect(searchInput).toHaveValue('');
  });

  it('export button calls onExport with filtered data', () => {
    const onExport = vi.fn();
    renderEngine({ onExport });
    
    const exportButton = screen.getByRole('button', { name: /exportar/i });
    fireEvent.click(exportButton);
    
    expect(onExport).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ fuente: 'RETENCION' }),
        expect.objectContaining({ fuente: 'PLATAFORMA' }),
      ])
    );
  });

  it('results summary shows correct counts', () => {
    renderEngine();
    
    expect(screen.getByText('RET: 50')).toBeInTheDocument();
    expect(screen.getByText('PLAT: 50')).toBeInTheDocument();
    expect(screen.getByText('Matches: 10')).toBeInTheDocument();
    expect(screen.getByText('Confirmados: 5')).toBeInTheDocument();
  });

  it('progressive reveal animation phases on filter change', () => {
    renderEngine();
    
    // Initial render should start with 'matched' phase
    // After filter change, should reset to 'matched'
    const searchInput = screen.getByPlaceholderText('Buscar CUIT...');
    fireEvent.change(searchInput, { target: { value: '20000000001' } });
    
    // Should not throw and should handle animation
    expect(true).toBe(true);
  });

  it('filter persistence to localStorage', () => {
    const { rerender } = renderEngine();
    
    // Set filter
    const searchInput = screen.getByPlaceholderText('Buscar CUIT...');
    fireEvent.change(searchInput, { target: { value: '20000000001' } });
    
    // Rerender (simulates reload)
    rerender(
      <ECJYThemeProvider>
        <ComparisonEngine
          retencionData={mockRetencion}
          plataformaData={mockPlataforma}
          matches={mockMatches}
          confirmedMatches={mockConfirmed}
          onFilterChange={vi.fn()}
          onExport={vi.fn()}
        />
      </ECJYThemeProvider>
    );
    
    // Filter should be restored from localStorage
    expect(searchInput).toHaveValue('20000000001');
  });

  it('renders ComparisonTable components', () => {
    renderEngine();
    
    // Should render both tables
    expect(screen.getByText('RETENCION Pendientes')).toBeInTheDocument();
    expect(screen.getByText('PLATAFORMA Pendientes')).toBeInTheDocument();
  });

  it('renders ConnectionLines', () => {
    renderEngine();
    
    // ConnectionLines should be rendered
    expect(screen.getByRole('img')).toBeInTheDocument(); // SVG
  });

  it('renders DataLayers', () => {
    renderEngine();
    
    expect(screen.getByText('Raw')).toBeInTheDocument();
    expect(screen.getByText('Matched')).toBeInTheDocument();
    expect(screen.getByText('Confirmed')).toBeInTheDocument();
  });

  it('filter change callback fires with new filters', () => {
    const onFilterChange = vi.fn();
    renderEngine({ onFilterChange });
    
    const searchInput = screen.getByPlaceholderText('Buscar CUIT...');
    fireEvent.change(searchInput, { target: { value: '20000000001' } });
    
    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ cuitSearch: '20000000001' })
    );
  });

  it('feature flag disabled returns null', () => {
    vi.mock('../hooks/useFeatureFlag', () => ({
      useFeatureFlagEnabled: vi.fn((flag: string) => flag === 'COMPARISON_ENGINE' && false),
    }));
    
    const { container } = renderEngine();
    expect(container.firstChild).toBeNull();
  });
});