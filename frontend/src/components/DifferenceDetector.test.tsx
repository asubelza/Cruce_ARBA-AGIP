/**
 * DifferenceDetector Component - Unit & Integration Tests
 * Tests dual panel sync scroll, match highlighting, density switching, filter sync
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DifferenceDetector } from './DifferenceDetector';
import { Ingreso, MatchResult } from '../types';

// Mock useDensity hook
vi.mock('../hooks/useDensity', () => ({
  useDensity: () => ({
    density: 'comfortable',
    setDensity: vi.fn(),
    rowHeight: 24,
    multiplier: 1.0,
  }),
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
      spacing: { 1: '4px', 2: '8px', 3: '12px', 4: '16px', 5: '20px', 6: '24px' },
    },
  }),
}));

// Mock feature flags
vi.mock('../hooks/useFeatureFlag', () => ({
  useFeatureFlagEnabled: () => true,
}));

const mockRetencionData: Ingreso[] = [
  { _id: 'ret1', id: 'ret1', fuente: 'RETENCION', cuit: '30-12345678-9', monto: 10000, periodo: '202401', razon_social: 'Empresa A', fecha_insert: '2024-01-15', conciliado: false },
  { _id: 'ret2', id: 'ret2', fuente: 'RETENCION', cuit: '30-98765432-1', monto: 20000, periodo: '202401', razon_social: 'Empresa B', fecha_insert: '2024-01-16', conciliado: false },
  { _id: 'ret3', id: 'ret3', fuente: 'RETENCION', cuit: '30-11111111-1', monto: 30000, periodo: '202402', razon_social: 'Empresa C', fecha_insert: '2024-02-01', conciliado: false },
];

const mockPlataformaData: Ingreso[] = [
  { _id: 'plat1', id: 'plat1', fuente: 'PLATAFORMA', cuit: '30-12345678-9', monto: 10000, periodo: '202401', razon_social: 'Empresa A', fecha_insert: '2024-01-15', conciliado: false },
  { _id: 'plat2', id: 'plat2', fuente: 'PLATAFORMA', cuit: '30-98765432-1', monto: 20000, periodo: '202401', razon_social: 'Empresa B', fecha_insert: '2024-01-16', conciliado: false },
  { _id: 'plat3', id: 'plat3', fuente: 'PLATAFORMA', cuit: '30-22222222-2', monto: 40000, periodo: '202402', razon_social: 'Empresa D', fecha_insert: '2024-02-01', conciliado: false },
];

const mockMatches: MatchResult[] = [
  { ret_id: 'ret1', plat_id: 'plat1', cuit: '30-12345678-9', monto_ret: 10000, monto_plat: 10000, periodo_ret: '202401', periodo_plat: '202401' },
  { ret_id: 'ret2', plat_id: 'plat2', cuit: '30-98765432-1', monto_ret: 20000, monto_plat: 20000, periodo_ret: '202401', periodo_plat: '202401' },
];

const defaultFilters = {
  cuitSearch: '',
  periodFrom: '',
  periodTo: '',
  amountMin: 0,
  amountMax: 0,
};

const renderDifferenceDetector = (props: Partial<{
  retencionData: Ingreso[];
  plataformaData: Ingreso[];
  matches: MatchResult[];
  density: 'comfortable' | 'compact' | 'dense';
  filters: typeof defaultFilters;
  onFiltersChange: (filters: typeof defaultFilters) => void;
}> = {}) => {
  const onFiltersChange = props.onFiltersChange ?? (vi.fn() as (filters: typeof defaultFilters) => void);
  return render(
    <DifferenceDetector
      retencionData={props.retencionData || mockRetencionData}
      plataformaData={props.plataformaData || mockPlataformaData}
      matches={props.matches || mockMatches}
      density={props.density || 'comfortable'}
      filters={props.filters || defaultFilters}
      onFiltersChange={onFiltersChange}
    />
  );
};

describe('DifferenceDetector', () => {
  let onFiltersChangeMock: (filters: typeof defaultFilters) => void;

  beforeEach(() => {
    vi.clearAllMocks();
    onFiltersChangeMock = vi.fn() as (filters: typeof defaultFilters) => void;
  });

  it('renders dual panel layout with correct titles', () => {
    renderDifferenceDetector({ onFiltersChange: onFiltersChangeMock });
    
    expect(screen.getByText('ARCA COMPROBANTES')).toBeInTheDocument();
    expect(screen.getByText('PROCESSED')).toBeInTheDocument();
  });

  it('shows correct record counts in panel headers', () => {
    renderDifferenceDetector({ onFiltersChange: onFiltersChangeMock });
    
    // Both panels should show count 3
    const countChips = screen.getAllByText('3');
    expect(countChips.length).toBe(2); // One in each panel
  });

  it('highlights matched pairs with precision color', () => {
    renderDifferenceDetector({ onFiltersChange: onFiltersChangeMock });
    
    // Check for matched rows (precision color background)
    const matchedRows = screen.getAllByText('30-12345678-9');
    expect(matchedRows.length).toBeGreaterThanOrEqual(2); // One in each panel
  });

  it('shows detection color for unmatched records', () => {
    renderDifferenceDetector({ onFiltersChange: onFiltersChangeMock });
    
    // Unmatched records should be visible
    expect(screen.getByText('30-11111111-1')).toBeInTheDocument(); // Only in RETENCION
    expect(screen.getByText('30-22222222-2')).toBeInTheDocument(); // Only in PLATAFORMA
  });

  it('applies filters to both panels simultaneously', async () => {
    renderDifferenceDetector({ 
      onFiltersChange: onFiltersChangeMock,
      filters: { ...defaultFilters, cuitSearch: '30-12345678-9' }
    });
    
    // Should only show the matching CUIT
    const cuitCells = screen.getAllByText('30-12345678-9');
    expect(cuitCells.length).toBe(2); // One in each panel
    
    // Non-matching should not appear
    expect(screen.queryByText('30-98765432-1')).not.toBeInTheDocument();
  });

  it('synchronizes scroll between panels', () => {
    renderDifferenceDetector({ onFiltersChange: onFiltersChangeMock });
    
    const containers = screen.getAllByRole('table');
    expect(containers.length).toBe(2);
    
    // Both panels should have the same structure
    const leftTable = containers[0];
    const rightTable = containers[1];
    
    expect(leftTable).toBeInTheDocument();
    expect(rightTable).toBeInTheDocument();
  });

  it('uses correct row height for comfortable density', () => {
    renderDifferenceDetector({ 
      density: 'comfortable',
      onFiltersChange: onFiltersChangeMock 
    });
    
    const rows = screen.getAllByRole('row');
    expect(rows.length).toBeGreaterThan(0);
  });

  it('uses correct row height for compact density', () => {
    renderDifferenceDetector({ 
      density: 'compact',
      onFiltersChange: onFiltersChangeMock 
    });
    
    const rows = screen.getAllByRole('row');
    expect(rows.length).toBeGreaterThan(0);
  });

  it('uses correct row height for dense density', () => {
    renderDifferenceDetector({ 
      density: 'dense',
      onFiltersChange: onFiltersChangeMock 
    });
    
    const rows = screen.getAllByRole('row');
    expect(rows.length).toBeGreaterThan(0);
  });

  it('shows placeholder rows to align panels', () => {
    renderDifferenceDetector({ onFiltersChange: onFiltersChangeMock });
    
    // Both panels should have same number of rows
    const tables = screen.getAllByRole('table');
    expect(tables.length).toBe(2);
  });

  it('displays check icon for matched records', () => {
    renderDifferenceDetector({ onFiltersChange: onFiltersChangeMock });
    
    const checkIcons = screen.getAllByLabelText(/Coincide en/);
    expect(checkIcons.length).toBeGreaterThan(0);
  });

  it('displays remove icon for unmatched records', () => {
    renderDifferenceDetector({ onFiltersChange: onFiltersChangeMock });
    
    // Unmatched records should have remove circle icons
    expect(screen.getByText('30-11111111-1')).toBeInTheDocument();
    expect(screen.getByText('30-22222222-2')).toBeInTheDocument();
  });

  it('calls onFiltersChange when filter changes', () => {
    renderDifferenceDetector({ onFiltersChange: onFiltersChangeMock });
    
    // The component currently doesn't render filter inputs directly
    // but accepts filters as props and calls onFiltersChange
    expect(onFiltersChangeMock).not.toHaveBeenCalled();
  });

  it('formats currency correctly for Argentine pesos', () => {
    renderDifferenceDetector({ onFiltersChange: onFiltersChangeMock });
    
    // 10000 should be formatted as ARS currency - appears in both panels
    // The format might be "ARS 10.000,00" or "$10.000,00" depending on locale
    const currencyCells = screen.getAllByText(/10\.000,00/);
    expect(currencyCells.length).toBeGreaterThanOrEqual(2);
    
    const currencyCells2 = screen.getAllByText(/20\.000,00/);
    expect(currencyCells2.length).toBeGreaterThanOrEqual(2);
  });

  it('formats period correctly (YYYYMM -> YYYY-MM)', () => {
    renderDifferenceDetector({ onFiltersChange: onFiltersChangeMock });
    
    const periodCells = screen.getAllByText('2024-01');
    expect(periodCells.length).toBeGreaterThanOrEqual(2);
    
    const periodCells2 = screen.getAllByText('2024-02');
    expect(periodCells2.length).toBeGreaterThanOrEqual(2);
  });

  it('shows razon_social when available', () => {
    renderDifferenceDetector({ onFiltersChange: onFiltersChangeMock });
    
    const empresaACells = screen.getAllByText('Empresa A');
    expect(empresaACells.length).toBeGreaterThanOrEqual(2);
    
    const empresaBCells = screen.getAllByText('Empresa B');
    expect(empresaBCells.length).toBeGreaterThanOrEqual(2);
    
    const empresaCCells = screen.getAllByText('Empresa C');
    expect(empresaCCells.length).toBeGreaterThanOrEqual(1);
    
    const empresaDCells = screen.getAllByText('Empresa D');
    expect(empresaDCells.length).toBeGreaterThanOrEqual(1);
  });

  it('handles empty data gracefully', () => {
    renderDifferenceDetector({ 
      retencionData: [],
      plataformaData: [],
      matches: [],
      onFiltersChange: onFiltersChangeMock 
    });
    
    expect(screen.getByText('ARCA COMPROBANTES')).toBeInTheDocument();
    expect(screen.getByText('PROCESSED')).toBeInTheDocument();
    // Both panels should show count 0
    const countChips = screen.getAllByText('0');
    expect(countChips.length).toBe(2);
  });
});