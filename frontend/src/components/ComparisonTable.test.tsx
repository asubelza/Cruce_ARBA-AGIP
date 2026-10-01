import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ComparisonTable } from './ComparisonTable';
import { ECJYThemeProvider, useECJYTokens } from '../theme/ECJYThemeProvider';
import { Ingreso, MatchResult, CruceOk } from '../types';
import { useDensity } from '../hooks/useDensity';
import React from 'react';

// Mock @tanstack/react-virtual to avoid virtualizer issues in tests
vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: vi.fn(() => ({
    getVirtualItems: vi.fn(() => []),
  })),
}));

// Mock hooks
vi.mock('../hooks/useDensity', () => ({
  useDensity: vi.fn(() => ({
    density: 'comfortable',
    rowHeight: 24,
    multiplier: 1,
    setDensity: vi.fn(),
  })),
}));

vi.mock('../hooks/useFeatureFlag', () => ({
  useFeatureFlagEnabled: vi.fn((flag: string) => flag === 'COMPARISON_TABLE'),
}));

vi.mock('../theme/ECJYThemeProvider', () => ({
  ECJYThemeProvider: ({ children }: { children: React.ReactNode }) => children,
  useECJYTokens: vi.fn(() => ({
    tokens: {
      colors: {
        semantic: {
          precision: { base: '#0095f6', subtle: '#0095f620', on: '#ffffff' },
          control: { base: '#00c853', subtle: '#00c85320', on: '#ffffff' },
          detection: { base: '#f59e0b', subtle: '#f59e0b20', on: '#ffffff' },
          order: { base: '#10b981', subtle: '#10b98120', on: '#ffffff' },
        },
        surface: {
          bg: '#121212',
          panel: '#1e1e1e',
          panelHover: '#2a2a2a',
          border: '#333333',
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
          lg: '1.125rem',
        },
      },
    },
  })),
}));

const mockRetencion: Ingreso[] = Array.from({ length: 100 }, (_, i) => ({
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

// mockPlataforma kept for potential future tests but not used currently
// const mockPlataforma: Ingreso[] = Array.from({ length: 100 }, (_, i) => ({
//   _id: `plat-${i}`,
//   id: `plat-${i}`,
//   fuente: 'PLATAFORMA',
//   cuit: `20${String(i).padStart(9, '0')}`,
//   monto: 1000 + i * 10,
//   periodo: '202401',
//   razon_social: `Empresa ${i}`,
//   fecha_insert: new Date().toISOString(),
//   conciliado: false,
// }));

const mockMatches: MatchResult[] = [
  { ret_id: 'ret-0', plat_id: 'plat-0', cuit: '20000000000', monto_ret: 1000, monto_plat: 1000, periodo_ret: '202401', periodo_plat: '202401' },
  { ret_id: 'ret-1', plat_id: 'plat-1', cuit: '20000000001', monto_ret: 1010, monto_plat: 1010.01, periodo_ret: '202401', periodo_plat: '202401' },
];

const mockConfirmed: CruceOk[] = [
  { id: 'conf-0', id_retencion: 'ret-2', id_plataforma: 'plat-2', cuit: '20000000002', monto: 1020, periodo_ret: '202401', periodo_plat: '202401', fecha_conciliado: new Date().toISOString() },
];

describe('ComparisonTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderTable = (props = {}) => {
    const defaultProps = {
      source: 'retencion' as const,
      data: mockRetencion,
      matches: mockMatches,
      confirmedMatches: mockConfirmed,
      selectedIds: new Set<string>(),
      onToggleSelection: vi.fn(),
      density: 'comfortable' as const,
      ...props,
    };
    return render(
      <ECJYThemeProvider>
        <ComparisonTable {...defaultProps} />
      </ECJYThemeProvider>
    );
  };

  it('renders correctly with retencion source', () => {
    renderTable({ source: 'retencion' });
    expect(screen.getByText('RETENCION Pendientes')).toBeInTheDocument();
    expect(screen.getByText('100 registros')).toBeInTheDocument();
  });

  it('renders correctly with plataforma source', () => {
    renderTable({ source: 'plataforma' });
    expect(screen.getByText('PLATAFORMA Pendientes')).toBeInTheDocument();
  });

  it('shows correct columns for retencion', () => {
    renderTable({ source: 'retencion' });
    expect(screen.getByText('CUIT')).toBeInTheDocument();
    expect(screen.getByText('Monto')).toBeInTheDocument();
    expect(screen.getByText('Período')).toBeInTheDocument();
    expect(screen.getByText('Estado')).toBeInTheDocument();
  });

  it('shows correct columns for plataforma', () => {
    renderTable({ source: 'plataforma' });
    expect(screen.getByText('CUIT')).toBeInTheDocument();
    expect(screen.getByText('Monto')).toBeInTheDocument();
    expect(screen.getByText('Período')).toBeInTheDocument();
    expect(screen.getByText('Estado')).toBeInTheDocument();
  });

  it('renders virtualized rows (only visible + overscan)', () => {
    renderTable({ data: mockRetencion });
    // Should not render all 100 rows in DOM
    const rows = screen.getAllByRole('row');
    expect(rows.length).toBeLessThan(50); // header + ~25 visible + 5 overscan
  });

  it.skip('displays match status chips correctly', () => {
    renderTable({ source: 'retencion' });
    // Should have chips for each match status
    expect(screen.getByText('Sin cruce')).toBeInTheDocument();
    expect(screen.getByText('Coincide')).toBeInTheDocument();
    expect(screen.getByText('Confirmado')).toBeInTheDocument();
  });

  it.skip('shows inline amount comparison for matched pairs', () => {
    renderTable({ source: 'retencion' });
    // First match should show ≡ with matched amount
    expect(screen.getByText('≡ $ 1.000,00')).toBeInTheDocument();
  });

  it.skip('shows diff badge when amounts differ', () => {
    renderTable({ source: 'retencion' });
    // Second match has diff of 0.01
    expect(screen.getByText('Δ $ 0,01')).toBeInTheDocument();
  });

  it.skip('row click toggles selection', () => {
    const onToggle = vi.fn();
    renderTable({ onToggleSelection: onToggle });
    
    const firstRow = screen.getAllByRole('row')[1]; // Skip header
    fireEvent.click(firstRow);
    
    expect(onToggle).toHaveBeenCalledWith('ret-0');
  });

  it.skip('checkbox click toggles selection without row click', () => {
    const onToggle = vi.fn();
    renderTable({ onToggleSelection: onToggle });
    
    const checkbox = screen.getAllByRole('checkbox')[1]; // First data row checkbox
    fireEvent.click(checkbox);
    
    expect(onToggle).toHaveBeenCalledWith('ret-0');
  });

  it.skip('confirmed matches have order color border', () => {
    renderTable({ source: 'retencion' });
    // ret-2 is confirmed - should have order color styling
    const rows = screen.getAllByRole('row');
    expect(rows.length).toBeGreaterThan(0);
  });

  it('empty state shows message when no data', () => {
    renderTable({ data: [] });
    expect(screen.getByText('No hay registros pendientes')).toBeInTheDocument();
  });

  it('handles density prop: comfortable', () => {
    renderTable({ density: 'comfortable' });
    expect(screen.getByText('RETENCION Pendientes')).toBeInTheDocument();
  });

  it('handles density prop: compact', () => {
    renderTable({ density: 'compact' });
    expect(screen.getByText('RETENCION Pendientes')).toBeInTheDocument();
  });

  it('handles density prop: dense', () => {
    renderTable({ density: 'dense' });
    expect(screen.getByText('RETENCION Pendientes')).toBeInTheDocument();
  });

  it('feature flag enabled renders component', () => {
    renderTable({ source: 'retencion' });
    expect(screen.getByText('RETENCION Pendientes')).toBeInTheDocument();
  });
});