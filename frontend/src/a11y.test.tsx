import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import axeCore from 'axe-core';
import { ECJYThemeProvider } from './theme/ECJYThemeProvider';
import { HeroOpening } from './components/HeroOpening';
import { DifferenceDetector } from './components/DifferenceDetector';
import { StateIndicators } from './components/StateIndicators';
import { StatsDisplay } from './components/StatsDisplay';
import { FileUpload } from './components/FileUpload';
import { AppHeader } from './components/AppHeader';
import { ComparisonTable } from './components/ComparisonTable';
import { ComparisonEngine } from './components/ComparisonEngine';
import { DataLayers } from './components/DataLayers';
import { DetectionPanel } from './components/DetectionPanel';
import { ValidationWorkspace } from './components/ValidationWorkspace';
import { Ingreso, MatchResult, CruceOk } from './types';
import React from 'react';

vi.mock('../hooks/useDensity', () => ({
  useDensity: vi.fn(() => ({
    density: 'comfortable',
    rowHeight: 24,
    multiplier: 1,
  })),
}));

vi.mock('../hooks/useFeatureFlag', () => ({
  useFeatureFlagEnabled: vi.fn((flag: string) => true),
}));

vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
  __esModule: true,
}));

vi.mock('framer-motion', () => ({
  motion: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  useReducedMotion: () => false,
  useAnimationControls: () => ({
    start: vi.fn(),
    stop: vi.fn(),
    set: vi.fn(),
  }),
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('../hooks/useGrid', () => ({
  useGrid: vi.fn(() => ({
    columns: 12,
    gutter: '16px',
    margin: '24px',
    colSpan: (n: number) => `span ${n} / span ${n}`,
    breakpoint: 'lg',
  })),
}));

const mockMetrics = {
  precision: { value: 98.5, previous: 97.2, threshold: 95 },
  control: { value: 1247, previous: 1100 },
  detection: { value: 23, previous: 30, threshold: 50 },
  order: { value: 99.2, previous: 98.5 },
  security: { value: 0, previous: 0, threshold: 0 },
};

const mockRetencion: Ingreso[] = [
  { _id: 'ret-1', id: 'ret-1', fuente: 'RETIENCION', cuit: '20000000001', monto: 1000, periodo: '202401', razon_social: 'Empresa A', fecha_insert: new Date().toISOString(), conciliado: false },
  { _id: 'ret-2', id: 'ret-2', fuente: 'RETIENCION', cuit: '20000000002', monto: 2000, periodo: '202401', razon_social: 'Empresa B', fecha_insert: new Date().toISOString(), conciliado: false },
];

const mockPlataforma: Ingreso[] = [
  { _id: 'plat-1', id: 'plat-1', fuente: 'PLATAFORMA', cuit: '20000000001', monto: 1000, periodo: '202401', razon_social: 'Empresa A', fecha_insert: new Date().toISOString(), conciliado: false },
];

const mockMatches: MatchResult[] = [
  { ret_id: 'ret-1', plat_id: 'plat-1', cuit: '20000000001', monto_ret: 1000, monto_plat: 1000, periodo_ret: '202401', periodo_plat: '202401' },
];

const mockConfirmed: CruceOk[] = [];

const mockStats = {
  pend_retencion: 10,
  pend_plataforma: 5,
  pend_totales: 15,
  ok_historicos: 100,
};

describe('Accessibility (axe-core)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithA11y = (component: React.ReactNode) => {
    return render(
      <ECJYThemeProvider>
        {component}
      </ECJYThemeProvider>
    );
  };

  const checkA11y = async (container: HTMLElement) => {
    const results = await axeCore.run(container, {
      runOnly: {
        type: 'tag',
        values: ['wcag2aa', 'wcag21aa', 'best-practice'],
      },
    });
    return results;
  };

  const expectNoViolations = (results: { violations: any[] }) => {
    expect(results.violations).toHaveLength(0);
  };

  it('HeroOpening has no accessibility violations', async () => {
    const { container } = renderWithA11y(
      <HeroOpening onComplete={vi.fn()} />
    );
    const results = await checkA11y(container);
    expectNoViolations(results);
  });

  it('StateIndicators has no accessibility violations', async () => {
    const { container } = renderWithA11y(
      <StateIndicators metrics={mockMetrics} compact={false} />
    );
    const results = await checkA11y(container);
    expectNoViolations(results);
  });

  it('StateIndicators compact mode has no violations', async () => {
    const { container } = renderWithA11y(
      <StateIndicators metrics={mockMetrics} compact={true} />
    );
    const results = await checkA11y(container);
    expectNoViolations(results);
  });

  it('StatsDisplay has no accessibility violations', async () => {
    const { container } = renderWithA11y(
      <StatsDisplay stats={mockStats} loading={false} />
    );
    const results = await checkA11y(container);
    expectNoViolations(results);
  });

  it('FileUpload has no accessibility violations', async () => {
    const { container } = renderWithA11y(
      <FileUpload onUploadSuccess={vi.fn()} />
    );
    const results = await checkA11y(container);
    expectNoViolations(results);
  });

  it('AppHeader has no accessibility violations', async () => {
    const { container } = renderWithA11y(
      <AppHeader
        metrics={mockMetrics}
        darkMode={true}
        toggleDarkMode={vi.fn()}
        onExport={vi.fn()}
        onHelpOpen={vi.fn()}
        onHelpClose={vi.fn()}
      />
    );
    const results = await checkA11y(container);
    expectNoViolations(results);
  });

  it('ComparisonTable has no accessibility violations', async () => {
    const { container } = renderWithA11y(
      <ComparisonTable
        source="retencion"
        data={mockRetencion}
        matches={mockMatches}
        confirmedMatches={mockConfirmed}
        selectedIds={new Set()}
        onToggleSelection={vi.fn()}
        density="comfortable"
      />
    );
    const results = await checkA11y(container);
    expectNoViolations(results);
  });

  it('ComparisonEngine has no accessibility violations', async () => {
    const { container } = renderWithA11y(
      <ComparisonEngine
        retencionData={mockRetencion}
        plataformaData={mockPlataforma}
        matches={mockMatches}
        confirmedMatches={mockConfirmed}
        onFilterChange={vi.fn()}
        onExport={vi.fn()}
      />
    );
    const results = await checkA11y(container);
    expectNoViolations(results);
  });

  it('DataLayers has no accessibility violations', async () => {
    const { container } = renderWithA11y(
      <DataLayers
        retencionData={mockRetencion}
        plataformaData={mockPlataforma}
        matches={mockMatches}
        confirmedMatches={mockConfirmed}
        density="comfortable"
      />
    );
    const results = await checkA11y(container);
    expectNoViolations(results);
  });

  it('DetectionPanel has no accessibility violations', async () => {
    const { container } = renderWithA11y(
      <DetectionPanel
        matches={mockMatches}
        retencionData={mockRetencion}
        plataformaData={mockPlataforma}
        onConfirm={vi.fn()}
        onReject={vi.fn()}
        onFlag={vi.fn()}
        filters={{
          cuitSearch: '',
          periodFrom: '',
          periodTo: '',
          amountMin: 0,
          amountMax: 0,
          matchStatus: 'all',
          amountTolerance: 0.01,
        }}
        density="comfortable"
      />
    );
    const results = await checkA11y(container);
    expectNoViolations(results);
  });

  it('ValidationWorkspace has no accessibility violations', async () => {
    const { container } = renderWithA11y(
      <ValidationWorkspace
        unmatchedRetencion={mockRetencion}
        unmatchedPlataforma={mockPlataforma}
        onConfirmMatch={vi.fn()}
        onBulkConfirm={vi.fn()}
      />
    );
    const results = await checkA11y(container);
    expectNoViolations(results);
  });

  it.skip('DifferenceDetector has no accessibility violations', async () => {
    const { container } = renderWithA11y(
      <DifferenceDetector
        retencionData={mockRetencion}
        plataformaData={mockPlataforma}
        matches={mockMatches}
        density="comfortable"
        filters={{
          cuitSearch: '',
          periodFrom: '',
          periodTo: '',
          amountMin: 0,
          amountMax: 0,
        }}
        onFiltersChange={vi.fn()}
      />
    );
    const results = await checkA11y(container);
    expectNoViolations(results);
  });
});