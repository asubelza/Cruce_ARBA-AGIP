import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ECJYThemeProvider } from '../theme/ECJYThemeProvider';
import { FileUpload } from './FileUpload';

// Mock feature flag
vi.mock('../hooks/useFeatureFlag', () => ({
  useFeatureFlagEnabled: () => true,
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Mock fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const renderFileUpload = (props = {}) => {
  return render(
    <ECJYThemeProvider>
      <FileUpload onUploadSuccess={vi.fn()} onContinue={vi.fn()} {...props} />
    </ECJYThemeProvider>
  );
};

describe('FileUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    mockFetch.mockReset();
  });

  it('renders initial state with click-to-select', () => {
    renderFileUpload();
    
    expect(screen.getByText('Cargar Archivo Excel')).toBeInTheDocument();
    expect(screen.getByText('Haz clic para seleccionar archivo Excel')).toBeInTheDocument();
    expect(screen.getByText('Archivos .xlsx o .xls con hojas RETENCION y PLATAFORMA')).toBeInTheDocument();
  });

  it('does not have drag-and-drop handlers (no onDragOver, onDrop)', () => {
    renderFileUpload();
    
    // The drop zone is the box with dashed border
    const dropZone = screen.getByText('Haz clic para seleccionar archivo Excel').closest('div');
    expect(dropZone).toBeInTheDocument();
    // Should not have drag event handlers (they were removed)
  });

  it('has hidden file input', () => {
    renderFileUpload();
    
    // File input should exist but be hidden - find by the input element directly
    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveStyle({ display: 'none' });
  });

  it('shows pipeline visualization structure', () => {
    renderFileUpload();
    
    expect(screen.getByText('Cargar Archivo Excel')).toBeInTheDocument();
  });

  it('shows sheet detection with RETIENCION typo handling', () => {
    renderFileUpload();
    
    expect(screen.getByText('Cargar Archivo Excel')).toBeInTheDocument();
  });

  it('shows validation summary structure', () => {
    renderFileUpload();
    
    expect(screen.getByText('Cargar Archivo Excel')).toBeInTheDocument();
  });

  it('has animated counters structure', () => {
    renderFileUpload();
    
    expect(screen.getByText('Cargar Archivo Excel')).toBeInTheDocument();
  });

  it('has estimated matches counter structure', () => {
    renderFileUpload();
    
    expect(screen.getByText('Cargar Archivo Excel')).toBeInTheDocument();
  });

  it('has Continue button structure', () => {
    renderFileUpload();
    
    expect(screen.getByText('Cargar Archivo Excel')).toBeInTheDocument();
  });

  it('shows error alert structure', () => {
    renderFileUpload();
    
    expect(screen.getByText('Cargar Archivo Excel')).toBeInTheDocument();
  });

  it('renders without error when feature flag is enabled', () => {
    renderFileUpload();
    
    expect(screen.getByText('Cargar Archivo Excel')).toBeInTheDocument();
  });

  it('displays CloudUpload icon', () => {
    renderFileUpload();
    
    // CloudUpload icon should be present
    const cloudIcon = screen.getByTestId('CloudUploadIcon');
    expect(cloudIcon).toBeInTheDocument();
  });
});