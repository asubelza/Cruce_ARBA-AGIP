/**
 * ValidationWorkspace Component
 * Replaces StagingTable: cartesian grid (unmatched RET × unmatched PLAT)
 * Keyboard-first navigation, match scoring, dynamic filters
 */

import { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Stack,
  Box,
  Typography,
  TextField,
  InputAdornment,
  Slider,
  Divider,
  Alert,
  AlertTitle,
  Checkbox,
} from '@mui/material';
import {
  CheckCircle,
  Search,
  Download,
  PlayArrow,
  Gavel,
  Analytics,
} from '@mui/icons-material';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useECJYTokens } from '../theme/ECJYThemeProvider';
import { Ingreso } from '../types';
import { useFeatureFlagEnabled } from '../hooks/useFeatureFlag';
import { useDensity } from '../hooks/useDensity';

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(value);
};

interface MatchScore {
  retId: string;
  platId: string;
  score: number;
  breakdown: {
    cuit: number;
    amount: number;
    period: number;
    razonSocial: number;
  };
}

interface ValidationWorkspaceProps {
  unmatchedRetencion: Ingreso[];
  unmatchedPlataforma: Ingreso[];
  onConfirmMatch: (retId: string, platId: string, score: number) => void;
  onBulkConfirm: (pairs: { retId: string; platId: string; score: number }[]) => void;
}

function calculateMatchScore(ret: Ingreso, plat: Ingreso): MatchScore {
  // CUIT match: 40%
  const cuitScore = ret.cuit === plat.cuit ? 40 : 0;
  
  // Amount match: 35% (exact = 35, within 1% = 25, within 5% = 15, within 10% = 5)
  const amountDiff = Math.abs(ret.monto - plat.monto);
  const amountPct = ret.monto > 0 ? (amountDiff / ret.monto) * 100 : 100;
  let amountScore = 0;
  if (amountDiff <= 0.01) amountScore = 35;
  else if (amountPct <= 1) amountScore = 25;
  else if (amountPct <= 5) amountScore = 15;
  else if (amountPct <= 10) amountScore = 5;
  
  // Period match: 15%
  const periodScore = ret.periodo === plat.periodo ? 15 : 0;
  
  // Razon Social match: 10% (simple contains check)
  const rsScore = (ret.razon_social && plat.razon_social && 
    (ret.razon_social.toLowerCase().includes(plat.razon_social.toLowerCase()) ||
     plat.razon_social.toLowerCase().includes(ret.razon_social.toLowerCase()))) ? 10 : 0;
  
  const totalScore = cuitScore + amountScore + periodScore + rsScore;
  
  return {
    retId: ret._id || ret.id || '',
    platId: plat._id || plat.id || '',
    score: totalScore,
    breakdown: { cuit: cuitScore, amount: amountScore, period: periodScore, razonSocial: rsScore },
  };
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? 'success' : score >= 50 ? 'warning' : 'error';
  return (
    <Chip
      label={`${score}`}
      size="small"
      color={color as any}
      variant="filled"
      sx={{ fontWeight: 700, fontSize: '0.7rem', minWidth: 36 }}
    />
  );
}

export function ValidationWorkspace({
  unmatchedRetencion,
  unmatchedPlataforma,
  onConfirmMatch,
  onBulkConfirm,
}: ValidationWorkspaceProps) {
  const { tokens } = useECJYTokens();
  const { rowHeight } = useDensity();
  const workspaceEnabled = useFeatureFlagEnabled('VALIDATION_WORKSPACE');
  
  const [scoredPairs, setScoredPairs] = useState<MatchScore[]>([]);
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [focusedCell, setFocusedCell] = useState<{ row: number; col: number } | null>(null);
  const [filters, setFilters] = useState({
    cuitSearch: '',
    amountMin: 0,
    amountMax: 0,
    periodFrom: '',
    periodTo: '',
    scoreThreshold: 0,
  });
  const [showScoreDetails, setShowScoreDetails] = useState<string | null>(null);
  const parentRef = useRef<HTMLDivElement>(null);
  const [stagedPairs, setStagedPairs] = useState<{ retId: string; platId: string; score: number }[]>([]);

  // Compute scored pairs with filters
  useEffect(() => {
    const pairs: MatchScore[] = [];
    for (const ret of unmatchedRetencion) {
      if (filters.cuitSearch && !ret.cuit.includes(filters.cuitSearch)) continue;
      if (filters.amountMin > 0 && ret.monto < filters.amountMin) continue;
      if (filters.amountMax > 0 && ret.monto > filters.amountMax) continue;
      if (filters.periodFrom && ret.periodo < filters.periodFrom) continue;
      if (filters.periodTo && ret.periodo > filters.periodTo) continue;
      
      for (const plat of unmatchedPlataforma) {
        if (filters.cuitSearch && !plat.cuit.includes(filters.cuitSearch)) continue;
        if (filters.amountMin > 0 && plat.monto < filters.amountMin) continue;
        if (filters.amountMax > 0 && plat.monto > filters.amountMax) continue;
        if (filters.periodFrom && plat.periodo < filters.periodFrom) continue;
        if (filters.periodTo && plat.periodo > filters.periodTo) continue;
        
        const scored = calculateMatchScore(ret, plat);
        if (scored.score >= filters.scoreThreshold) {
          pairs.push(scored);
        }
      }
    }
    setScoredPairs(pairs);
  }, [unmatchedRetencion, unmatchedPlataforma, filters]);

  // Virtualizer for cartesian grid
  const virtualizer = useVirtualizer({
    count: scoredPairs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 5,
  });

  const virtualRows = virtualizer.getVirtualItems();

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!focusedCell) return;
      
      const { row, col } = focusedCell;
      const totalRows = scoredPairs.length;
      const totalCols = 6; // CUIT, RS, Monto, Período, Score, Actions
      
      let newRow = row;
      let newCol = col;
      
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          newRow = Math.max(0, row - 1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          newRow = Math.min(totalRows - 1, row + 1);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          newCol = Math.max(0, col - 1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          newCol = Math.min(totalCols - 1, col + 1);
          break;
        case 'Enter':
          e.preventDefault();
          if (scoredPairs[row]) {
            const pair = scoredPairs[row];
            onConfirmMatch(pair.retId, pair.platId, pair.score);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setFocusedCell(null);
          break;
        case ' ':
          e.preventDefault();
          if (scoredPairs[row]) {
            const pair = scoredPairs[row];
            const cellId = `${pair.retId}-${pair.platId}`;
            setSelectedCells(prev => {
              const next = new Set(prev);
              if (next.has(cellId)) next.delete(cellId);
              else next.add(cellId);
              return next;
            });
          }
          break;
        case 'Control':
          // Ctrl+Enter handled separately
          break;
        default:
          return;
      }
      
      if (newRow !== row || newCol !== col) {
        setFocusedCell({ row: newRow, col: newCol });
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && focusedCell) {
        e.preventDefault();
        // Ctrl+Enter = bulk confirm all selected
        if (selectedCells.size > 0) {
          const pairs = Array.from(selectedCells).map(id => {
            const [retId, platId] = id.split('-');
            const scored = scoredPairs.find(p => `${p.retId}-${p.platId}` === id);
            return { retId, platId, score: scored?.score || 0 };
          });
          onBulkConfirm(pairs);
          setStagedPairs(pairs);
          setSelectedCells(new Set());
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [focusedCell, scoredPairs, selectedCells, onConfirmMatch]);

  const handleConfirmPair = (pair: MatchScore) => {
    onConfirmMatch(pair.retId, pair.platId, pair.score);
    setStagedPairs(prev => [...prev, { retId: pair.retId, platId: pair.platId, score: pair.score }]);
  };

  const cellId = (retId: string, platId: string) => `${retId}-${platId}`;

  if (!workspaceEnabled) {
    return null; // Fallback handled by parent
  }

  return (
    <Card
      sx={{ 
        mt: 2, 
        border: `1px solid ${tokens.colors.surface.border}`,
        overflow: 'hidden',
      }}
    >
      <CardHeader
        title="Validación Manual (Producto Cartesiano)"
        titleTypographyProps={{
          fontWeight: 600,
          fontFamily: tokens.typography.fontFamilies.display,
          color: tokens.colors.text.primary,
        }}
        avatar={
          <Chip
            label={`${scoredPairs.length} pares candidatos`}
            size="small"
            color="primary"
            variant="outlined"
          />
        }
        action={
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Tooltip title="Atajos: ↑↓←→ navegar | Enter confirmar | Espacio seleccionar | Ctrl+Enter confirmar seleccionados">
              <IconButton size="small"><Analytics fontSize="small" /></IconButton>
            </Tooltip>
            {stagedPairs.length > 0 && (
              <Tooltip title="Enviar al backend">
                <Button
                  startIcon={<PlayArrow />}
                  color="success"
                  variant="contained"
                  size="small"
                  onClick={() => { /* TODO: call backend */ }}
                >
                  Commit ({stagedPairs.length})
                </Button>
              </Tooltip>
            )}
          </Box>
        }
        sx={{
          bgcolor: tokens.colors.surface.panel,
          borderBottom: `1px solid ${tokens.colors.surface.border}`,
        }}
      />
      
      {/* Filters */}
      <CardContent sx={{ p: 2, borderBottom: `1px solid ${tokens.colors.surface.border}` }}>
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap alignItems="center">
          <TextField
            size="small"
            placeholder="Buscar CUIT..."
            value={filters.cuitSearch}
            onChange={(e) => setFilters(prev => ({ ...prev, cuitSearch: e.target.value }))}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
            sx={{ minWidth: 200 }}
          />
          
          <TextField
            size="small"
            type="number"
            placeholder="Monto min"
            value={filters.amountMin}
            onChange={(e) => setFilters(prev => ({ ...prev, amountMin: parseFloat(e.target.value) || 0 }))}
            sx={{ width: 120 }}
          />
          <TextField
            size="small"
            type="number"
            placeholder="Monto max"
            value={filters.amountMax}
            onChange={(e) => setFilters(prev => ({ ...prev, amountMax: parseFloat(e.target.value) || 0 }))}
            sx={{ width: 120 }}
          />
          
          <TextField
            size="small"
            type="month"
            value={filters.periodFrom}
            onChange={(e) => setFilters(prev => ({ ...prev, periodFrom: e.target.value }))}
            InputProps={{ startAdornment: <InputAdornment position="start">Per. desde</InputAdornment> }}
            sx={{ width: 160 }}
          />
          <TextField
            size="small"
            type="month"
            value={filters.periodTo}
            onChange={(e) => setFilters(prev => ({ ...prev, periodTo: e.target.value }))}
            InputProps={{ startAdornment: <InputAdornment position="start">hasta</InputAdornment> }}
            sx={{ width: 160 }}
          />
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 250 }}>
            <Typography variant="body2" color="text.secondary">Score mínimo:</Typography>
            <Slider
              value={filters.scoreThreshold}
              min={0}
              max={100}
              step={5}
              valueLabelDisplay="auto"
              onChange={(_, v) => setFilters(prev => ({ ...prev, scoreThreshold: Array.isArray(v) ? v[0] : v }))}
              sx={{ flex: 1 }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 40 }}>
              {filters.scoreThreshold}%
            </Typography>
          </Box>
          
          <Box sx={{ flexGrow: 1 }} />
          
          <Tooltip title="Exportar CSV">
            <Button startIcon={<Download />} variant="outlined" size="small" onClick={() => { /* TODO */ }}>
              Exportar
            </Button>
          </Tooltip>
        </Stack>
      </CardContent>
      
      {/* Cartesian grid */}
      <CardContent sx={{ p: 0 }}>
        <TableContainer
          ref={parentRef}
          sx={{ 
            maxHeight: 500,
            overflow: 'auto',
          }}
        >
          <Table stickyHeader size="small" style={{ width: '100%' }}>
            <TableHead>
              <TableRow
                style={{
                  position: 'sticky',
                  top: 0,
                  zIndex: 10,
                  backgroundColor: tokens.colors.surface.panelHover,
                }}
              >
                <TableCell width={48} align="center">
                  <Checkbox
                    indeterminate={selectedCells.size > 0 && selectedCells.size < scoredPairs.length}
                    checked={selectedCells.size === scoredPairs.length && scoredPairs.length > 0}
                    onChange={() => {
                      if (selectedCells.size === scoredPairs.length) {
                        setSelectedCells(new Set());
                      } else {
                        setSelectedCells(new Set(scoredPairs.map(p => cellId(p.retId, p.platId))));
                      }
                    }}
                    size="small"
                  />
                </TableCell>
                <TableCell style={{ width: 140, fontWeight: 600 }}>CUIT</TableCell>
                <TableCell style={{ width: 200, fontWeight: 600 }}>Razón Social</TableCell>
                <TableCell style={{ width: 140, fontWeight: 600, textAlign: 'right' }}>Monto</TableCell>
                <TableCell style={{ width: 100, fontWeight: 600 }}>Período</TableCell>
                <TableCell style={{ width: 80, fontWeight: 600, textAlign: 'center' }}>Score</TableCell>
                <TableCell style={{ width: 100, fontWeight: 600, textAlign: 'center' }}>Detalle</TableCell>
                <TableCell style={{ width: 80, fontWeight: 600, textAlign: 'center' }}>Acción</TableCell>
              </TableRow>
            </TableHead>
            <TableBody style={{ minHeight: scoredPairs.length * rowHeight }}>
              {scoredPairs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" style={{ height: 200, color: tokens.colors.text.tertiary }}>
                    <Typography color="text.secondary">No hay pares candidatos con los filtros actuales</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {virtualRows.map((virtualRow) => {
                    const pair = scoredPairs[virtualRow.index];
                    const id = cellId(pair.retId, pair.platId);
                    const isSelected = selectedCells.has(id);
                    const isFocused = focusedCell?.row === virtualRow.index;
                    
                    return (
                      <TableRow
                        key={id}
                        tabIndex={isFocused ? 0 : -1}
                        onClick={() => setFocusedCell({ row: virtualRow.index, col: 0 })}
                        onKeyDown={() => setFocusedCell({ row: virtualRow.index, col: 0 })}
                        style={{
                          height: rowHeight,
                          position: 'absolute',
                          top: virtualRow.start,
                          left: 0,
                          right: 0,
                          backgroundColor: isFocused 
                            ? `${tokens.colors.semantic.precision.base}20`
                            : isSelected
                            ? `${tokens.colors.semantic.precision.base}10`
                            : undefined,
                          outline: isFocused ? `2px solid ${tokens.colors.semantic.precision.base}` : 'none',
                        }}
                      >
                        <TableCell padding="checkbox" align="center" style={{ height: rowHeight }}>
                          <Checkbox
                            checked={isSelected}
                            onChange={(e) => {
                              e.stopPropagation();
                              setSelectedCells(prev => {
                                const next = new Set(prev);
                                if (next.has(id)) next.delete(id);
                                else next.add(id);
                                return next;
                              });
                            }}
                            size="small"
                          />
                        </TableCell>
                        <TableCell style={{ height: rowHeight, fontFamily: tokens.typography.fontFamilies.mono, fontSize: tokens.typography.fontSizes.sm }}>
                          {pair.retId}
                        </TableCell>
                        <TableCell style={{ height: rowHeight, fontSize: tokens.typography.fontSizes.sm }}>
                          {unmatchedRetencion.find(r => (r._id || r.id) === pair.retId)?.razon_social || '-'}
                        </TableCell>
                        <TableCell align="right" style={{ height: rowHeight, fontFamily: tokens.typography.fontFamilies.mono, fontSize: tokens.typography.fontSizes.sm, color: tokens.colors.semantic.precision.base }}>
                          {formatCurrency(unmatchedRetencion.find(r => (r._id || r.id) === pair.retId)?.monto || 0)}
                        </TableCell>
                        <TableCell style={{ height: rowHeight, fontSize: tokens.typography.fontSizes.sm }}>
                          {unmatchedRetencion.find(r => (r._id || r.id) === pair.retId)?.periodo || '-'}
                        </TableCell>
                        <TableCell align="center" style={{ height: rowHeight }}>
                          <ScoreBadge score={pair.score} />
                        </TableCell>
                        <TableCell align="center" style={{ height: rowHeight }}>
                          <Tooltip title={showScoreDetails === id ? 'Ocultar detalle' : 'Ver detalle de score'}>
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); setShowScoreDetails(showScoreDetails === id ? null : id); }}>
                              <Gavel fontSize="small" color={showScoreDetails === id ? 'primary' : 'action'} />
                            </IconButton>
                          </Tooltip>
                          {showScoreDetails === id && (
                            <Box
                              sx={{
                                position: 'absolute',
                                top: virtualRow.start + rowHeight + 4,
                                left: 200,
                                zIndex: 100,
                                bgcolor: 'background.paper',
                                border: `1px solid ${tokens.colors.surface.border}`,
                                borderRadius: 1,
                                p: 2,
                                boxShadow: 3,
                                minWidth: 250,
                              }}
                              role="tooltip"
                            >
                              <Typography variant="subtitle2" gutterBottom>Desglose de Score</Typography>
                              <Stack spacing={0.5}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography variant="body2" color="text.secondary">CUIT (40%)</Typography>
                                  <Typography variant="body2" fontWeight={600} color={pair.breakdown.cuit === 40 ? 'success.main' : 'error.main'}>
                                    {pair.breakdown.cuit}/40
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography variant="body2" color="text.secondary">Monto (35%)</Typography>
                                  <Typography variant="body2" fontWeight={600}>
                                    {pair.breakdown.amount}/35
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography variant="body2" color="text.secondary">Período (15%)</Typography>
                                  <Typography variant="body2" fontWeight={600} color={pair.breakdown.period === 15 ? 'success.main' : 'error.main'}>
                                    {pair.breakdown.period}/15
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography variant="body2" color="text.secondary">Razón Social (10%)</Typography>
                                  <Typography variant="body2" fontWeight={600} color={pair.breakdown.razonSocial === 10 ? 'success.main' : 'error.main'}>
                                    {pair.breakdown.razonSocial}/10
                                  </Typography>
                                </Box>
                                <Divider />
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography variant="subtitle2">Total</Typography>
                                  <Typography variant="subtitle2" fontWeight={700}>{pair.score}/100</Typography>
                                </Box>
                              </Stack>
                            </Box>
                          )}
                        </TableCell>
                        <TableCell align="center" style={{ height: rowHeight }}>
                          <Tooltip title="Confirmar">
                            <IconButton size="small" color="success" onClick={(e) => { e.stopPropagation(); handleConfirmPair(pair); }}>
                              <CheckCircle fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
      
      {/* Staged pairs summary */}
      {stagedPairs.length > 0 && (
        <CardContent sx={{ p: 2, borderTop: `1px solid ${tokens.colors.surface.border}` }}>
          <Alert severity="success" sx={{ mb: 2 }}>
            <AlertTitle>Pares listos para commit</AlertTitle>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {stagedPairs.slice(0, 10).map(p => (
                <Chip key={`${p.retId}-${p.platId}`} label={`${p.retId}-${p.platId} (${p.score})`} size="small" variant="outlined" color="success" />
              ))}
              {stagedPairs.length > 10 && <Chip label={`+${stagedPairs.length - 10} más`} size="small" variant="outlined" />}
            </Stack>
          </Alert>
        </CardContent>
      )}
    </Card>
  );
}

export default ValidationWorkspace;