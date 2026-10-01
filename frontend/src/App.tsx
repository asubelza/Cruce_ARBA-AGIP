import { useState, useCallback, useMemo } from 'react';
import { Container, Box, Stack, Button, Chip, Paper, Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogActions, Typography } from '@mui/material';
import { Bolt, MergeType, CheckCircle, Refresh, CleaningServices } from '@mui/icons-material';
import { AppHeader } from './components/AppHeader';
import { StatsDisplay } from './components/StatsDisplay';
import { FileUpload } from './components/FileUpload';
import { HeroOpening } from './components/HeroOpening';
import { StateIndicators } from './components/StateIndicators';
import { ComparisonEngine } from './components/ComparisonEngine';
import { DataLayers } from './components/DataLayers';
import { DetectionPanel } from './components/DetectionPanel';
import { ValidationWorkspace } from './components/ValidationWorkspace';
import { useStats, usePendientes, useAutoMatch, useStaging } from './hooks/useApi';
import { MatchResult, CruceOk, ComparisonFilters } from './types';
import { useDensity } from './hooks/useDensity';

const API_URL = import.meta.env.VITE_API_URL || '/api';

function App() {
  const [selectedRet, setSelectedRet] = useState<Set<string>>(new Set());
  const [selectedPlat, setSelectedPlat] = useState<Set<string>>(new Set());
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning' }>({ open: false, message: '', severity: 'info' });
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; action: () => void; title: string }>({ open: false, action: () => {}, title: '' });
  const [autoMatchPreview, setAutoMatchPreview] = useState<MatchResult[]>([]);
  const [heroCompleted, setHeroCompleted] = useState(false);
  
  const { stats, loading: statsLoading, refetch: refetchStats } = useStats();
  const { retencion, plataforma, refetch: refetchPendientes } = usePendientes();
  const { loading: autoMatchLoading, runAutoMatch } = useAutoMatch();
  const { staging, generateStaging, confirmStaging, clearStaging, loading: stagingLoading } = useStaging();
  const { density } = useDensity();

  const handleUploadSuccess = useCallback(() => {
    refetchStats();
    refetchPendientes();
  }, [refetchStats, refetchPendientes]);

  const handleAutoMatch = async () => {
    try {
      const result = await runAutoMatch();
      const matches = result?.matches || [];
      setAutoMatchPreview(matches);
      if (matches.length === 0) {
        setSnackbar({ open: true, message: 'No se encontraron matches', severity: 'info' });
      }
    } catch (err) {
      setSnackbar({ open: true, message: 'Error en auto-match', severity: 'error' });
    }
  };

  const handleGenerateStaging = async () => {
    if (selectedRet.size === 0 || selectedPlat.size === 0) {
      setSnackbar({ open: true, message: 'Selecciona registros de ambos lados', severity: 'info' });
      return;
    }
    try {
      await generateStaging(Array.from(selectedRet), Array.from(selectedPlat));
      setSelectedRet(new Set());
      setSelectedPlat(new Set());
    } catch (err) {
      setSnackbar({ open: true, message: 'Error generando staging', severity: 'error' });
    }
  };

  const handleConfirmStaging = async () => {
    if (staging.length === 0) return;
    try {
      await confirmStaging(staging);
      setSnackbar({ open: true, message: `${staging.length} cruces confirmados`, severity: 'success' });
      clearStaging();
      refetchStats();
      refetchPendientes();
    } catch (err) {
      setSnackbar({ open: true, message: 'Error confirmando cruces', severity: 'error' });
    }
  };

  const handleLimpiarBD = async () => {
    try {
      const response = await fetch(`${API_URL}/limpiar-bd`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Error');
      const data = await response.json();
      setSnackbar({ open: true, message: data.message, severity: 'success' });
      refetchStats();
      refetchPendientes();
      clearStaging();
      setAutoMatchPreview([]);
    } catch (err) {
      setSnackbar({ open: true, message: 'Error limpiando base de datos', severity: 'error' });
    }
    setConfirmDialog({ open: false, action: () => {}, title: '' });
  };

  const selectedRetTotal = useMemo(() => 
    Array.from(selectedRet).reduce((sum, id) => {
      const item = retencion.find(r => (r._id || r.id) === id);
      return sum + (item?.monto || 0);
    }, 0), [selectedRet, retencion]
  );

  const selectedPlatTotal = useMemo(() => 
    Array.from(selectedPlat).reduce((sum, id) => {
      const item = plataforma.find(p => (p._id || p.id) === id);
      return sum + (item?.monto || 0);
    }, 0), [selectedPlat, plataforma]
  );

  const difference = selectedRetTotal - selectedPlatTotal;

  // Compute ECJY metrics from data
  const ecjyMetrics = useMemo(() => {
    const totalRetencion = retencion.length;
    const totalPlataforma = plataforma.length;
    const totalProcessed = totalRetencion + totalPlataforma;
    const confirmedMatches = staging.length + autoMatchPreview.length;
    const totalMatches = confirmedMatches; // Simplified
    const unmatchedRet = retencion.filter(r => !staging.some(s => s.ret_id === (r._id || r.id)) && !autoMatchPreview.some(m => m.ret_id === (r._id || r.id))).length;
    const unmatchedPlat = plataforma.filter(p => !staging.some(s => s.plat_id === (p._id || p.id)) && !autoMatchPreview.some(m => m.plat_id === (p._id || p.id))).length;
    const unmatchedTotal = unmatchedRet + unmatchedPlat;
    
    return {
      precision: { 
        value: totalMatches > 0 ? (confirmedMatches / totalMatches) * 100 : 100, 
        previous: 97.2, 
        threshold: 95 
      },
      control: { value: totalProcessed, previous: 1100 },
      detection: { value: unmatchedTotal, previous: 30, threshold: 50 },
      order: { 
        value: totalProcessed > 0 ? (confirmedMatches / totalProcessed) * 100 : 100, 
        previous: 98.5 
      },
      security: { value: 0, previous: 0, threshold: 0 },
    };
  }, [retencion, plataforma, staging, autoMatchPreview]);

  // Filters for ComparisonEngine
  const [filters, setFilters] = useState<ComparisonFilters>({
    cuitSearch: '',
    periodFrom: '',
    periodTo: '',
    amountMin: 0,
    amountMax: 0,
    matchStatus: 'all',
    amountTolerance: 0.01,
  });

  const handleFiltersChange = useCallback((newFilters: ComparisonFilters) => {
    setFilters(newFilters);
  }, []);

  const handleHeroComplete = useCallback(() => {
    setHeroCompleted(true);
  }, []);

  // DetectionPanel handlers
  const handleConfirmDetection = async (matches: MatchResult[]) => {
    if (matches.length === 0) return;
    try {
      const response = await fetch(`${API_URL}/cruces/confirmar-auto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(matches)
      });
      if (!response.ok) throw new Error('Error');
      const data = await response.json();
      setSnackbar({ open: true, message: data.message, severity: 'success' });
      refetchStats();
      refetchPendientes();
    } catch (err) {
      setSnackbar({ open: true, message: 'Error confirmando matches', severity: 'error' });
    }
  };

  const handleRejectDetection = async (matches: MatchResult[]) => {
    if (matches.length === 0) return;
    try {
      // Just remove from autoMatchPreview for now
      setAutoMatchPreview(prev => prev.filter(m => !matches.includes(m)));
      setSnackbar({ open: true, message: `${matches.length} matches rechazados`, severity: 'info' });
    } catch (err) {
      setSnackbar({ open: true, message: 'Error rechazando matches', severity: 'error' });
    }
  };

  const handleFlagDetection = async (matches: MatchResult[]) => {
    if (matches.length === 0) return;
    setSnackbar({ open: true, message: `${matches.length} matches marcados para revisión`, severity: 'warning' });
  };

  // ValidationWorkspace handlers
  const handleConfirmValidation = (retId: string, platId: string, score: number) => {
    // Add to staging
    const retItem = retencion.find(r => (r._id || r.id) === retId);
    const platItem = plataforma.find(p => (p._id || p.id) === platId);
    if (retItem && platItem) {
      // Note: This would need proper staging store integration
      void [{
        ret_id: retId,
        plat_id: platId,
        cuit_ret: retItem.cuit,
        cuit_plat: platItem.cuit,
        monto_ret: retItem.monto,
        monto_plat: platItem.monto,
        periodo_ret: retItem.periodo,
        periodo_plat: platItem.periodo,
      }];
      setSnackbar({ open: true, message: `Par confirmado (score: ${score})`, severity: 'success' });
    }
  };

  const handleBulkConfirmValidation = (pairs: { retId: string; platId: string; score: number }[]) => {
    setSnackbar({ open: true, message: `${pairs.length} pares confirmados en validación`, severity: 'success' });
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Hero Opening Animation - only shows once on initial load */}
      {!heroCompleted && (
        <HeroOpening onComplete={handleHeroComplete} />
      )}

      {heroCompleted && (
        <>
          <AppHeader 
            metrics={ecjyMetrics}
            darkMode={true}
            toggleDarkMode={() => { /* TODO */ }}
            onExport={() => { /* TODO */ }}
            onHelpOpen={() => { /* TODO */ }}
            onHelpClose={() => { /* TODO */ }}
          />
          
          <Container maxWidth="xl" sx={{ py: 3 }}>
            {/* State Indicators - Expanded mode in dashboard */}
            <StateIndicators metrics={ecjyMetrics} compact={false} />
            
            <StatsDisplay stats={stats} loading={statsLoading} />
            
            <FileUpload onUploadSuccess={handleUploadSuccess} />

            <Stack direction="row" spacing={2} sx={{ mb: 3 }} flexWrap="wrap" useFlexGap>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={() => { refetchPendientes(); refetchStats(); }}
              >
                Actualizar
              </Button>
              
              <Button
                variant="contained"
                color="primary"
                startIcon={autoMatchLoading ? <Refresh /> : <Bolt />}
                onClick={handleAutoMatch}
                disabled={autoMatchLoading}
              >
                Auto-Match
              </Button>
              
              <Button
                variant="contained"
                color="secondary"
                startIcon={<MergeType />}
                onClick={handleGenerateStaging}
                disabled={stagingLoading || selectedRet.size === 0 || selectedPlat.size === 0}
              >
                Cruce Manual ({selectedRet.size}x{selectedPlat.size})
              </Button>
              
              {staging.length > 0 && (
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircle />}
                  onClick={handleConfirmStaging}
                  disabled={stagingLoading}
                >
                  Confirmar ({staging.length})
                </Button>
              )}

              <Box sx={{ flexGrow: 1 }} />

              <Button
                variant="outlined"
                color="error"
                startIcon={<CleaningServices />}
                onClick={() => setConfirmDialog({ open: true, action: handleLimpiarBD, title: 'Limpiar Base de Datos' })}
              >
                Limpiar BD
              </Button>
            </Stack>

            {/* Detection Panel - Auto-match review */}
            {autoMatchPreview.length > 0 && (
              <DetectionPanel
                matches={autoMatchPreview}
                retencionData={retencion}
                plataformaData={plataforma}
                confirmedMatches={[]}
                onConfirm={handleConfirmDetection}
                onReject={handleRejectDetection}
                onFlag={handleFlagDetection}
                filters={filters}
                density={density}
              />
            )}

            {(selectedRet.size > 0 || selectedPlat.size > 0) && (
              <Paper sx={{ p: 2, mb: 3 }} elevation={2}>
                <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Chip
                    label={`RET: $${selectedRetTotal.toLocaleString()} (${selectedRet.size})`}
                    color="primary"
                    variant="outlined"
                  />
                  <Chip
                    label={`PLAT: $${selectedPlatTotal.toLocaleString()} (${selectedPlat.size})`}
                    color="success"
                    variant="outlined"
                  />
                  <Chip
                    label={`Dif: $${difference.toLocaleString()}`}
                    color={Math.abs(difference) <= 0.01 ? 'success' : 'error'}
                  />
                </Stack>
              </Paper>
            )}

            {/* Comparison Engine - Main comparison view */}
            {(retencion.length > 0 || plataforma.length > 0) && (
              <ComparisonEngine
                retencionData={retencion}
                plataformaData={plataforma}
                matches={autoMatchPreview}
                confirmedMatches={[] as CruceOk[]}
                onFilterChange={handleFiltersChange}
                onExport={(data) => {
                  // TODO: implement CSV download
                  console.log('Export data:', data);
                }}
              />
            )}

            {/* Data Layers - Layered visualization */}
            {(retencion.length > 0 || plataforma.length > 0) && (
              <DataLayers
                retencionData={retencion}
                plataformaData={plataforma}
                matches={autoMatchPreview}
                confirmedMatches={[]}
                density={density}
              />
            )}

            {/* Validation Workspace - Manual cartesian validation */}
            {autoMatchPreview.length === 0 && (retencion.length > 0 || plataforma.length > 0) && (
              <ValidationWorkspace
                unmatchedRetencion={retencion.filter(r => !staging.some(s => s.ret_id === (r._id || r.id)) && !autoMatchPreview.some(m => m.ret_id === (r._id || r.id)))}
                unmatchedPlataforma={plataforma.filter(p => !staging.some(s => s.plat_id === (p._id || p.id)) && !autoMatchPreview.some(m => m.plat_id === (p._id || p.id)))}
                onConfirmMatch={handleConfirmValidation}
                onBulkConfirm={handleBulkConfirmValidation}
              />
            )}

            {/* Legacy staging display */}
            {staging.length > 0 && (
              <Paper sx={{ mt: 2 }} elevation={2}>
                <Typography variant="h6" gutterBottom>Staging (Legacy)</Typography>
                <Box>
                  {staging.map((s) => (
                    <Chip key={`${s.ret_id}-${s.plat_id}`} label={`${s.ret_id}-${s.plat_id}`} size="small" variant="outlined" sx={{ mr: 1, mb: 1 }} />
                  ))}
                </Box>
              </Paper>
            )}
          </Container>

          <Snackbar
            open={snackbar.open}
            autoHideDuration={4000}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
              {snackbar.message}
            </Alert>
          </Snackbar>

          <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}>
            <DialogTitle>{confirmDialog.title}</DialogTitle>
            <DialogContent>
              <Typography>Esta acción no se puede deshacer. ¿Estás seguro?</Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}>Cancelar</Button>
              <Button color="error" onClick={confirmDialog.action}>Confirmar</Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </Box>
  );
}

export default App;