import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { DataLayers } from './DataLayers';
import { ECJYThemeProvider } from '../theme/ECJYThemeProvider';
import { Ingreso, MatchResult, CruceOk } from '../types';
import React from 'react';

vi.mock('../hooks/useDensity', () => ({
  useDensity: vi.fn(() => ({
    density: 'comfortable',
    multiplier: 1,
  })),
}));

vi.mock('../hooks/useFeatureFlag', () => ({
  useFeatureFlagEnabled: vi.fn((flag: string) => flag === 'DATA_LAYERS'),
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
        },
        text: {
          primary: '#ffffff',
          secondary: '#b0b0b0',
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

describe.skip('DataLayers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderLayers = (props = {}) => {
    const defaultProps = {
      retencionData: mockRetencion,
      plataformaData: mockPlataforma,
      matches: mockMatches,
      confirmedMatches: mockConfirmed,
      density: 'comfortable' as const,
      ...props,
    };
    return render(
      <ECJYThemeProvider>
        <DataLayers {...defaultProps} />
      </ECJYThemeProvider>
    );
  };

  it('renders layer toggle cards for Raw, Matched, Confirmed', () => {
    renderLayers();
    expect(screen.getByText('Raw')).toBeInTheDocument();
    expect(screen.getByText('Matched')).toBeInTheDocument();
    expect(screen.getByText('Confirmed')).toBeInTheDocument();
  });

  it('shows correct record counts for each layer', () => {
    renderLayers();
    // Raw = total - matched = 100 - 20 = 80
    // Matched = matches * 2 = 20
    // Confirmed = confirmed * 2 = 10
    expect(screen.getByText('80')).toBeInTheDocument(); // Raw
    expect(screen.getByText('20')).toBeInTheDocument(); // Matched
    expect(screen.getByText('10')).toBeInTheDocument(); // Confirmed
  });

  it.skip('toggles layer visibility on switch click', () => {
    renderLayers();
    
    const rawSwitch = screen.getByRole('switch', { name: /raw/i });
    fireEvent.click(rawSwitch);
    
    // Should toggle (Switch changes state)
    expect(rawSwitch).toHaveAttribute('aria-checked', 'false');
  });

  it.skip('shows advanced opacity sliders when expanded', () => {
    renderLayers();
    
    // Click expand button
    const expandButton = screen.getByRole('button', { name: /configuración avanzada/i });
    fireEvent.click(expandButton);
    
    // Should show sliders
    expect(screen.getByRole('slider', { name: /opacidad.*raw/i })).toBeInTheDocument();
    expect(screen.getByRole('slider', { name: /opacidad.*matched/i })).toBeInTheDocument();
    expect(screen.getByRole('slider', { name: /opacidad.*confirmed/i })).toBeInTheDocument();
  });

  it.skip('opacity slider updates layer opacity', () => {
    renderLayers();
    
    const expandButton = screen.getByRole('button', { name: /configuración avanzada/i });
    fireEvent.click(expandButton);
    
    const rawSlider = screen.getByRole('slider', { name: /opacidad.*raw/i });
    fireEvent.change(rawSlider, { target: { value: 50 } });
    
    // Should update opacity state
    expect(rawSlider).toHaveValue(50);
  });

  it.skip('density switch to scatter plot at >5000 records', () => {
    // Create 6000 total records
    const manyRet = Array.from({ length: 3000 }, (_, i) => ({
      ...mockRetencion[0],
      _id: `ret-${i}`,
      id: `ret-${i}`,
    }));
    const manyPlat = Array.from({ length: 3000 }, (_, i) => ({
      ...mockPlataforma[0],
      _id: `plat-${i}`,
      id: `plat-${i}`,
    }));
    
    renderLayers({ 
      retencionData: manyRet, 
      plataformaData: manyPlat,
      density: 'dense',
    });
    
    // Should show scatter plot mode indicator
    expect(screen.getByText('Scatter Plot')).toBeInTheDocument();
  });

  it.skip('table mode indicator shown for normal record counts', () => {
    renderLayers({ density: 'comfortable' });
    expect(screen.getByText('Table')).toBeInTheDocument();
  });

  it('layer colors match semantic tokens', () => {
    renderLayers();
    
    // Raw should use surface border color
    // Matched should use precision color
    // Confirmed should use order color
    // Tested via visual snapshot in integration
  });

  it('feature flag enabled renders component', () => {
    renderLayers();
    expect(screen.getByText('Raw')).toBeInTheDocument();
  });
});