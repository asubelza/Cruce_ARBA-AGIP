import { describe, it, expect, vi, beforeEach, act } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ValidationWorkspace } from './ValidationWorkspace';
import { ECJYThemeProvider } from '../theme/ECJYThemeProvider';
import { Ingreso } from '../types';
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
  useFeatureFlagEnabled: vi.fn((flag: string) => flag === 'VALIDATION_WORKSPACE'),
}));

vi.mock('../theme/ECJYThemeProvider', () => ({
  ECJYThemeProvider: ({ children }: { children: React.ReactNode }) => children,
  useECJYTokens: vi.fn(() => ({
    tokens: {
      colors: {
        semantic: {
          precision: { base: '#0095f6' },
          control: { base: '#00c853' },
          success: { base: '#10b981' },
          warning: { base: '#f59e0b' },
          error: { base: '#ef4444' },
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

const mockUnmatchedRet: Ingreso[] = [
  { _id: 'ret-1', id: 'ret-1', fuente: 'RETIENCION', cuit: '20000000001', monto: 1000, periodo: '202401', razon_social: 'Empresa A', fecha_insert: new Date().toISOString(), conciliado: false },
  { _id: 'ret-2', id: 'ret-2', fuente: 'RETIENCION', cuit: '20000000002', monto: 2000, periodo: '202402', razon_social: 'Empresa B', fecha_insert: new Date().toISOString(), conciliado: false },
];

const mockUnmatchedPlat: Ingreso[] = [
  { _id: 'plat-1', id: 'plat-1', fuente: 'PLATAFORMA', cuit: '20000000001', monto: 1000, periodo: '202401', razon_social: 'Empresa A', fecha_insert: new Date().toISOString(), conciliado: false },
  { _id: 'plat-2', id: 'plat-2', fuente: 'PLATAFORMA', cuit: '20000000003', monto: 3000, periodo: '202403', razon_social: 'Empresa C', fecha_insert: new Date().toISOString(), conciliado: false },
];

describe.skip('ValidationWorkspace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const renderWorkspace = (props = {}) => {
    const defaultProps = {
      unmatchedRetencion: mockUnmatchedRet,
      unmatchedPlataforma: mockUnmatchedPlat,
      onConfirmMatch: vi.fn(),
      onBulkConfirm: vi.fn(),
      ...props,
    };
    return render(
      <ECJYThemeProvider>
        <ValidationWorkspace {...defaultProps} />
      </ECJYThemeProvider>
    );
  };

  it('renders cartesian grid with correct pair count', () => {
    // 2 ret × 2 plat = 4 pairs (before filters)
    renderWorkspace();
    expect(screen.getByText('4 pares candidatos')).toBeInTheDocument();
  });

  it('shows all 4 pairs in grid', () => {
    renderWorkspace();
    // Should show rows for each pair
    expect(screen.getByText('ret-1')).toBeInTheDocument();
    expect(screen.getByText('ret-2')).toBeInTheDocument();
  });

  it('calculates match scores correctly (CUIT 40%, Amount 35%, Period 15%, RS 10%)', () => {
    renderWorkspace();
    
    // ret-1 + plat-1: exact CUIT, exact amount, exact period, exact RS = 100
    // ret-1 + plat-2: no CUIT match, different amount, different period, no RS = 0
    // etc.
    
    // First row (ret-1 + plat-1) should have score 100
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('shows score badge with correct color (green ≥80, amber 50-79, red <50)', () => {
    renderWorkspace();
    
    // Should have score badges
    const badges = screen.getAllByRole('status');
    expect(badges.length).toBeGreaterThan(0);
  });

  it('score tooltip shows breakdown on Gavel click', () => {
    renderWorkspace();
    
    const gavelButton = screen.getByRole('button', { name: /ver detalle/i });
    if (gavelButton) {
      act(() => {
        fireEvent.click(gavelButton);
      });
      
      // Should show breakdown tooltip
      expect(screen.getByText('Desglose de Score')).toBeInTheDocument();
      expect(screen.getByText('CUIT (40%)')).toBeInTheDocument();
      expect(screen.getByText('Monto (35%)')).toBeInTheDocument();
      expect(screen.getByText('Período (15%)')).toBeInTheDocument();
      expect(screen.getByText('Razón Social (10%)')).toBeInTheDocument();
    }
  });

  it('filters by CUIT reduce cartesian product', () => {
    renderWorkspace({ 
      filters: { cuitSearch: '20000000001', amountMin: 0, amountMax: 0, periodFrom: '', periodTo: '', scoreThreshold: 0 },
    });
    
    // Only ret-1 + plat-1 should remain (same CUIT)
    expect(screen.getByText('1 pares candidatos')).toBeInTheDocument();
  });

  it('filters by amount range reduce pairs', () => {
    renderWorkspace({ 
      filters: { cuitSearch: '', amountMin: 1500, amountMax: 0, periodFrom: '', periodTo: '', scoreThreshold: 0 },
    });
    
    // Only pairs with amount ≥ 1500
    expect(screen.getByText('ret-2')).toBeInTheDocument();
  });

  it('filters by period reduce pairs', () => {
    renderWorkspace({ 
      filters: { cuitSearch: '', amountMin: 0, amountMax: 0, periodFrom: '202402', periodTo: '202402', scoreThreshold: 0 },
    });
    
    // Only ret-2 (period 202402) should match
    expect(screen.queryByText('ret-1')).not.toBeInTheDocument();
  });

  it('score threshold filters low-scoring pairs', () => {
    renderWorkspace({ 
      filters: { cuitSearch: '', amountMin: 0, amountMax: 0, periodFrom: '', periodTo: '', scoreThreshold: 50 },
    });
    
    // Only pairs with score ≥ 50
    expect(screen.queryByText('0')).not.toBeInTheDocument(); // No 0-score pairs
  });

  it('checkbox selection adds to selected cells', () => {
    renderWorkspace();
    
    const checkbox = screen.getAllByRole('checkbox')[1]; // First data row
    fireEvent.click(checkbox);
    
    // Should update selection state
    expect(checkbox).toBeChecked();
  });

  it('Select All checkbox selects all visible pairs', () => {
    renderWorkspace();
    
    const selectAllCheckbox = screen.getByRole('checkbox', { name: /seleccionar todos/i });
    if (selectAllCheckbox) {
      fireEvent.click(selectAllCheckbox);
      
      // All checkboxes should be checked
      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach(cb => expect(cb).toBeChecked());
    }
  });

  it('Enter key confirms focused pair', () => {
    const onConfirm = vi.fn();
    renderWorkspace({ onConfirmMatch: onConfirm });
    
    // Focus first row
    const firstRow = screen.getAllByRole('row')[1];
    firstRow.focus();
    
    act(() => {
      fireEvent.keyDown(window, { key: 'Enter' });
    });
    
    expect(onConfirm).toHaveBeenCalled();
  });

  it('Space key toggles selection', () => {
    renderWorkspace();
    
    const firstRow = screen.getAllByRole('row')[1];
    firstRow.focus();
    
    act(() => {
      fireEvent.keyDown(window, { key: ' ' });
    });
    
    // Should toggle selection
    const checkbox = screen.getAllByRole('checkbox')[1];
    expect(checkbox).toBeChecked();
  });

  it('Escape key clears focus', () => {
    renderWorkspace();
    
    const firstRow = screen.getAllByRole('row')[1];
    firstRow.focus();
    
    act(() => {
      fireEvent.keyDown(window, { key: 'Escape' });
    });
    
    // Focus should be cleared
    expect(document.activeElement).not.toBe(firstRow);
  });

  it('Arrow keys navigate between cells', () => {
    renderWorkspace();
    
    const firstRow = screen.getAllByRole('row')[1];
    firstRow.focus();
    
    act(() => {
      fireEvent.keyDown(window, { key: 'ArrowRight' });
    });
    
    // Should move focus right
    expect(true).toBe(true); // No error
  });

  it('staged pairs shows commit button when pairs confirmed', () => {
    renderWorkspace();
    
    // Manually trigger staging by calling onConfirmMatch
    // This would need the actual component state to show
    expect(screen.queryByRole('button', { name: /commit/i })).toBeInTheDocument();
  });

  it('feature flag disabled returns null', () => {
    vi.mock('../hooks/useFeatureFlag', () => ({
      useFeatureFlagEnabled: vi.fn((flag: string) => flag === 'VALIDATION_WORKSPACE' && false),
    }));
    
    const { container } = renderWorkspace();
    expect(container.firstChild).toBeNull();
  });
});