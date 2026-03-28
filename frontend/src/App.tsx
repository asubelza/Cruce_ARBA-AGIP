import { useState, useCallback } from 'react';
import { Box, Stack, Button, Paper, Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogActions, Typography, Chip } from '@mui/material';
import { Bolt, MergeType, CheckCircle, Refresh, CleaningServices } from '@mui/icons-material';
import { Header } from './components/Header';
import { StatsCards } from './components/StatsCards';
import { FileUpload } from './components/FileUpload';
import { DataTable } from './components/DataTable';
import { StagingTable } from './components/StagingTable';
import { AutoMatchPreview } from './components/AutoMatchPreview';
import { useStats, usePendientes, useAutoMatch, useStaging } from './hooks/useApi';
import { MatchResult } from './types';

const API_URL = import.meta.env.VITE_API_URL || '/api';

function App() {
  const [selectedRet, setSelectedRet] = useState<Set<string>>(new Set());
  const [selectedPlat, setSelectedPlat] = useState<Set<string>>(new Set());
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({ open: false, message: '', severity: 'info' });
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; action: () => void; title: string }>({ open: false, action: () => {}, title: '' });
  const [autoMatchPreview, setAutoMatchPreview] = useState<MatchResult[]>([]);
  
  const { stats, loading: statsLoading, refetch: refetchStats } = useStats();
  const { retencion, plataforma, refetch: refetchPendientes } = usePendientes();
  const { loading: autoMatchLoading, runAutoMatch } = useAutoMatch();
  const { staging, generateStaging, confirmStaging, clearStaging, loading: stagingLoading } = useStaging();

  const handleUploadSuccess = useCallback(() => {
    refetchStats();
    refetchPendientes();
  }, [refetchStats, refetchPendientes]);

  const toggleRetSelection = (id: string) => {
    const newSet = new Set(selectedRet);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedRet(newSet);
  };

  const togglePlatSelection = (id: string) => {
    const newSet = new Set(selectedPlat);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedPlat(newSet);
  };

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

  const handleConfirmAutoMatch = async (selectedMatches: MatchResult[]) => {
    if (selectedMatches.length === 0) return;
    try {
      const response = await fetch(`${API_URL}/cruces/confirmar-auto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedMatches)
      });
      if (!response.ok) throw new Error('Error');
      const data = await response.json();
      setSnackbar({ open: true, message: data.message, severity: 'success' });
      setAutoMatchPreview([]);
      refetchStats();
      refetchPendientes();
    } catch (err) {
      setSnackbar({ open: true, message: 'Error confirmando matches', severity: 'error' });
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

  const selectedRetTotal = Array.from(selectedRet).reduce((sum, id) => {
    const item = retencion.find(r => (r._id || r.id) === id);
    return sum + (item?.monto || 0);
  }, 0);

  const selectedPlatTotal = Array.from(selectedPlat).reduce((sum, id) => {
    const item = plataforma.find(p => (p._id || p.id) === id);
    return sum + (item?.monto || 0);
  }, 0);

  const difference = selectedRetTotal - selectedPlatTotal;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8f9fa' }}>
      <Header />
      
      <Box sx={{ maxWidth: 'xl', mx: 'auto', py: 3, px: 2 }}>
        <StatsCards stats={stats} loading={statsLoading} />
        
        <FileUpload onUploadSuccess={handleUploadSuccess} />

        <Stack direction="row" spacing={2} sx={{ mb: 3 }} flexWrap="wrap" useFlexGap>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => { refetchPendientes(); refetchStats(); }}
            sx={{ 
              borderColor: '#1e3a5f', 
              color: '#1e3a5f',
              '&:hover': { borderColor: '#1e3a5f', bgcolor: '#e3f2fd' }
            }}
          >
            Actualizar
          </Button>
          
          <Button
            variant="contained"
            startIcon={autoMatchLoading ? <Refresh /> : <Bolt />}
            onClick={handleAutoMatch}
            disabled={autoMatchLoading}
            sx={{ 
              bgcolor: '#1e3a5f',
              '&:hover': { bgcolor: '#152d4a' }
            }}
          >
            Auto-Match
          </Button>
          
          <Button
            variant="contained"
            startIcon={<MergeType />}
            onClick={handleGenerateStaging}
            disabled={stagingLoading || selectedRet.size === 0 || selectedPlat.size === 0}
            sx={{ 
              bgcolor: '#6c757d',
              '&:hover': { bgcolor: '#545b62' }
            }}
          >
            Cruce Manual ({selectedRet.size}x{selectedPlat.size})
          </Button>
          
          {staging.length > 0 && (
            <Button
              variant="contained"
              startIcon={<CheckCircle />}
              onClick={handleConfirmStaging}
              disabled={stagingLoading}
              sx={{ 
                bgcolor: '#2d8659',
                '&:hover': { bgcolor: '#1e6b45' }
              }}
            >
              Confirmar ({staging.length})
            </Button>
          )}

          <Box sx={{ flexGrow: 1 }} />

          <Button
            variant="outlined"
            startIcon={<CleaningServices />}
            onClick={() => setConfirmDialog({ open: true, action: handleLimpiarBD, title: 'Limpiar Base de Datos' })}
            sx={{ 
              borderColor: '#dc3545', 
              color: '#dc3545',
              '&:hover': { borderColor: '#dc3545', bgcolor: '#fff5f5' }
            }}
          >
            Limpiar BD
          </Button>
        </Stack>

        {autoMatchPreview.length > 0 && (
          <AutoMatchPreview 
            matches={autoMatchPreview} 
            onConfirm={handleConfirmAutoMatch}
            onClear={() => setAutoMatchPreview([])}
          />
        )}

        {(selectedRet.size > 0 || selectedPlat.size > 0) && (
          <Paper sx={{ p: 2, mb: 3 }}>
            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
              <Chip
                label={`RET: $${selectedRetTotal.toLocaleString()} (${selectedRet.size})`}
                sx={{ 
                  bgcolor: '#e3f2fd',
                  color: '#1e3a5f',
                  border: '1px solid #1e3a5f',
                  fontWeight: 600
                }}
              />
              <Chip
                label={`PLAT: $${selectedPlatTotal.toLocaleString()} (${selectedPlat.size})`}
                sx={{ 
                  bgcolor: '#e8f5e9',
                  color: '#2d8659',
                  border: '1px solid #2d8659',
                  fontWeight: 600
                }}
              />
              <Chip
                label={`Dif: $${difference.toLocaleString()}`}
                sx={{ 
                  bgcolor: Math.abs(difference) <= 0.01 ? '#e8f5e9' : '#fff3e0',
                  color: Math.abs(difference) <= 0.01 ? '#2d8659' : '#f57c00',
                  fontWeight: 600
                }}
              />
            </Stack>
          </Paper>
        )}

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3, mb: 3 }}>
          <DataTable
            title="RETIENCION"
            data={retencion}
            selectedIds={selectedRet}
            onToggleSelection={toggleRetSelection}
            color="primary"
          />
          <DataTable
            title="PLATAFORMA"
            data={plataforma}
            selectedIds={selectedPlat}
            onToggleSelection={togglePlatSelection}
            color="success"
          />
        </Box>

        {staging.length > 0 && (
          <StagingTable staging={staging} onClear={clearStaging} />
        )}
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity={snackbar.severity} 
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          sx={{ bgcolor: snackbar.severity === 'success' ? '#e8f5e9' : snackbar.severity === 'error' ? '#ffebee' : '#e3f2fd', color: '#1e3a5f' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}>
        <DialogTitle sx={{ color: '#1e3a5f' }}>{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <Typography>Esta acción no se puede deshacer. ¿Estás seguro?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ ...confirmDialog, open: false })} sx={{ color: '#6c757d' }}>Cancelar</Button>
          <Button onClick={confirmDialog.action} sx={{ color: '#dc3545' }}>Confirmar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default App;
