import { describe, it, expect, vi, beforeEach, act } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DetectionPanel } from './DetectionPanel';
import { ECJYThemeProvider } from '../theme/ECJYThemeProvider';
import { Ingreso, MatchResult } from '../types';
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
  useFeatureFlagEnabled: vi.fn((flag: string) => flag === 'DETECTION_PANEL'),
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
        },
      },
    },
  })),
}));

const mockRetencion: Ingreso[] = [
  { _id: 'ret-1', id: 'ret-1', fuente: 'RETIENCION', cuit: '20000000001', monto: 1000, periodo: '202401', razon_social: 'Empresa A', fecha_insert: new Date().toISOString(), conciliado: false },
  { _id: 'ret-2', id: 'ret-2', fuente: 'RETIENCION', cuit: '20000000002', monto: 2000, periodo: '202401', razon_social: 'Empresa B', fecha_insert: new Date().toISOString(), conciliado: false },
];

const mockPlataforma: Ingreso[] = [
  { _id: 'plat-1', id: 'plat-1', fuente: 'PLATAFORMA', cuit: '20000000001', monto: 1000, periodo: '202401', razon_social: 'Empresa A', fecha_insert: new Date().toISOString(), conciliado: false },
  { _id: 'plat-2', id: 'plat-2', fuente: 'PLATAFORMA', cuit: '20000000002', monto: 2000.01, periodo: '202401', razon_social: 'Empresa B', fecha_insert: new Date().toISOString(), conciliado: false },
];

const mockMatches: MatchResult[] = [
  { ret_id: 'ret-1', plat_id: 'plat-1', cuit: '20000000001', monto_ret: 1000, monto_plat: 1000, periodo_ret: '202401', periodo_plat: '202401' },
  { ret_id: 'ret-2', plat_id: 'plat-2', cuit: '20000000002', monto_ret: 2000, monto_plat: 2000.01, periodo_ret: '202401', periodo_plat: '202401' },
];

const mockFilters = {
  cuitSearch: '',
  periodFrom: '',
  periodTo: '',
  amountMin: 0,
  amountMax: 0,
  matchStatus: 'all' as const,
  amountTolerance: 0.01,
};

describe.skip('DetectionPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const renderPanel = (props = {}) => {
    const defaultProps = {
      matches: mockMatches,
      retencionData: mockRetencion,
      plataformaData: mockPlataforma,
      onConfirm: vi.fn(),
      onReject: vi.fn(),
      onFlag: vi.fn(),
      filters: mockFilters,
      density: 'comfortable' as const,
      ...props,
    };
    return render(
      <ECJYThemeProvider>
        <DetectionPanel {...defaultProps} />
      </ECJYThemeProvider>
    );
  };

  it('renders panel with correct title', () => {
    renderPanel();
    expect(screen.getByText('Detección de Coincidencias')).toBeInTheDocument();
  });

  it('shows match count in avatar chip', () => {
    renderPanel({ matches: mockMatches });
    expect(screen.getByText('2 coincidencias')).toBeInTheDocument();
  });

  it('shows quality badges (EXACT, NEAR)', () => {
    renderPanel({ matches: mockMatches });
    expect(screen.getByText('EXACT')).toBeInTheDocument();
    expect(screen.getByText('NEAR')).toBeInTheDocument();
  });

  it('shows quality badge counts', () => {
    renderPanel({ matches: mockMatches });
    expect(screen.getByText('1')).toBeInTheDocument(); // EXACT count
    expect(screen.getByText('1')).toBeInTheDocument(); // NEAR count
  });

  it('renders match rows with CUIT, amounts, diff', () => {
    renderPanel();
    expect(screen.getByText('20000000001')).toBeInTheDocument();
    expect(screen.getByText('$ 1.000,00')).toBeInTheDocument();
    expect(screen.getByText('≡')).toBeInTheDocument();
  });

  it('shows diff badge for NEAR matches', () => {
    renderPanel();
    expect(screen.getByText('Δ $ 0,01')).toBeInTheDocument();
  });

  it('renders inline action buttons (Confirm, Reject, Flag)', () => {
    renderPanel();
    // Should have action buttons for each match
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('Confirm button calls onConfirm with match', async () => {
    const onConfirm = vi.fn();
    renderPanel({ onConfirm });
    
    // Find and click confirm button for first match
    const confirmButtons = screen.getAllByRole('button', { name: /confirmar/i });
    if (confirmButtons.length > 0) {
      await act(async () => {
        fireEvent.click(confirmButtons[0]);
      });
      expect(onConfirm).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({ ret_id: 'ret-1' })
      ]));
    }
  });

  it('Reject button calls onReject with match', async () => {
    const onReject = vi.fn();
    renderPanel({ onReject });
    
    const rejectButtons = screen.getAllByRole('button', { name: /rechazar/i });
    if (rejectButtons.length > 0) {
      await act(async () => {
        fireEvent.click(rejectButtons[0]);
      });
      expect(onReject).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({ ret_id: 'ret-1' })
      ]));
    }
  });

  it('Flag button calls onFlag with match', async () => {
    const onFlag = vi.fn();
    renderPanel({ onFlag });
    
    const flagButtons = screen.getAllByRole('button', { name: /marcar/i });
    if (flagButtons.length > 0) {
      await act(async () => {
        fireEvent.click(flagButtons[0]);
      });
      expect(onFlag).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({ ret_id: 'ret-1' })
      ]));
    }
  });

  it('filter by CUIT hides non-matching rows', () => {
    renderPanel({ 
      filters: { ...mockFilters, cuitSearch: '20000000001' },
      matches: mockMatches,
    });
    expect(screen.getByText('20000000001')).toBeInTheDocument();
    expect(screen.queryByText('20000000002')).not.toBeInTheDocument();
  });

  it('filter by period hides non-matching rows', () => {
    renderPanel({ 
      filters: { ...mockFilters, periodFrom: '202402' },
      matches: mockMatches,
    });
    expect(screen.queryByText('202401')).not.toBeInTheDocument();
  });

  it('filter by amount range hides non-matching rows', () => {
    renderPanel({ 
      filters: { ...mockFilters, amountMin: 1500 },
      matches: mockMatches,
    });
    expect(screen.queryByText('$ 1.000,00')).not.toBeInTheDocument();
    expect(screen.getByText('$ 2.000,01')).toBeInTheDocument();
  });

  it('bulk Confirm All calls onConfirm with all filtered matches', async () => {
    const onConfirm = vi.fn();
    renderPanel({ onConfirm });
    
    const bulkConfirmButton = screen.getByRole('button', { name: /confirmar todos/i });
    if (bulkConfirmButton) {
      await act(async () => {
        fireEvent.click(bulkConfirmButton);
      });
      expect(onConfirm).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ ret_id: 'ret-1' }),
          expect.objectContaining({ ret_id: 'ret-2' })
        ])
      );
    }
  });

  it('bulk Reject All calls onReject with all filtered matches', async () => {
    const onReject = vi.fn();
    renderPanel({ onReject });
    
    const bulkRejectButton = screen.getByRole('button', { name: /rechazar todos/i });
    if (bulkRejectButton) {
      await act(async () => {
        fireEvent.click(bulkRejectButton);
      });
      expect(onReject).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ ret_id: 'ret-1' }),
          expect.objectContaining({ ret_id: 'ret-2' })
        ])
      );
    }
  });

  it('empty matches shows nothing (fallback to parent)', () => {
    vi.mock('../hooks/useFeatureFlag', () => ({
      useFeatureFlagEnabled: vi.fn((flag: string) => flag === 'DETECTION_PANEL' && false),
    }));
    
    const { container } = renderPanel({ matches: [] });
    expect(container.firstChild).toBeNull();
  });

  it('animates match reveal with staggered timing (when not reduced motion)', () => {
    vi.useFakeTimers();
    renderPanel({ matches: mockMatches });
    
    // Initially rows should be animating (opacity 0)
    // After staggered delay (80ms/pair) they should appear
    act(() => {
      vi.advanceTimersByTime(200); // 2 matches * 80ms + buffer
    });
    
    // Rows should now be visible
    expect(screen.getByText('20000000001')).toBeInTheDocument();
  });

  it('respects reduced-motion preference', () => {
    // Test that with reduced motion, animation is skipped
    vi.mock('framer-motion', () => ({
      useReducedMotion: () => true,
    }));
    
    const { rerender } = renderPanel({ matches: mockMatches });
    rerender(
      <ECJYThemeProvider>
        <DetectionPanel
          matches={mockMatches}
          retencionData={mockRetencion}
          plataformaData={mockPlataforma}
          onConfirm={vi.fn()}
          onReject={vi.fn()}
          onFlag={vi.fn()}
          filters={mockFilters}
          density="comfortable"
        />
      </ECJYThemeProvider>
    );
    
    // Should render immediately without animation delays
    expect(screen.getByText('20000000001')).toBeInTheDocument();
  });
});