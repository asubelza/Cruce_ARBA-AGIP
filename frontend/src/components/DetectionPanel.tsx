/**
 * DetectionPanel Component
 * Replaces AutoMatchPreview: animated match reveal with inline Confirm/Reject/Flag
 * Quality badges: EXACT (green), NEAR ±0.01 (amber), MANUAL (purple)
 */

import { useState, useMemo, useEffect, useRef } from 'react';
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
  Checkbox,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Flag,
  Download,
  ChevronRight,
  Check,
  Close,
  Warning,
  Gavel,
} from '@mui/icons-material';
import { motion, useReducedMotion } from 'framer-motion';
import { useECJYTokens } from '../theme/ECJYThemeProvider';
import { MatchResult, Ingreso } from '../types';
import { useFeatureFlagEnabled } from '../hooks/useFeatureFlag';
import { ConnectionLines } from './ConnectionLines';

interface ComparisonFilters {
  cuitSearch: string;
  periodFrom: string;
  periodTo: string;
  amountMin: number;
  amountMax: number;
  matchStatus: 'all' | 'sin-cruce' | 'coincide' | 'diferencia' | 'confirmado';
  amountTolerance: number;
}

type MatchQuality = 'EXACT' | 'NEAR' | 'MANUAL';

interface MatchRowData extends MatchResult {
  quality: MatchQuality;
  diff: number;
  retRazonSocial?: string;
  platRazonSocial?: string;
}

interface DetectionPanelProps {
  matches: MatchResult[];
  retencionData: Ingreso[];
  plataformaData: Ingreso[];
  confirmedMatches: any[];
  onConfirm: (matches: MatchResult[]) => Promise<void>;
  onReject: (matches: MatchResult[]) => Promise<void>;
  onFlag: (matches: MatchResult[]) => Promise<void>;
  filters: ComparisonFilters;
  density: 'comfortable' | 'compact' | 'dense';
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(value);
};

function getMatchQuality(match: MatchResult, retData: Ingreso[], platData: Ingreso[]): MatchRowData {
  const ret = retData.find(r => (r._id || r.id) === match.ret_id);
  const plat = platData.find(p => (p._id || p.id) === match.plat_id);
  const diff = Math.abs(match.monto_ret - match.monto_plat);
  
  let quality: MatchQuality = 'MANUAL';
  if (diff <= 0.01 && ret?.cuit === plat?.cuit) {
    quality = 'EXACT';
  } else if (diff <= 0.01 || ret?.cuit === plat?.cuit) {
    quality = 'NEAR';
  }
  
  return {
    ...match,
    quality,
    diff,
    retRazonSocial: ret?.razon_social,
    platRazonSocial: plat?.razon_social,
  };
}

function QualityBadge({ quality }: { quality: MatchQuality }) {
  const config = {
    EXACT: { label: 'EXACT', color: 'success', icon: <CheckCircle /> },
    NEAR: { label: 'NEAR', color: 'warning', icon: <Warning /> },
    MANUAL: { label: 'MANUAL', color: 'info', icon: <Gavel /> },
  };
  const c = config[quality];
  return (
    <Chip
      label={c.label}
      icon={c.icon}
      size="small"
      color={c.color as any}
      variant="filled"
      sx={{ fontWeight: 600, fontSize: '0.65rem' }}
    />
  );
}

export function DetectionPanel({
  matches,
  retencionData,
  plataformaData,
  onConfirm,
  onReject,
  onFlag,
  filters,
  density,
}: DetectionPanelProps) {
  const { tokens } = useECJYTokens();
  const panelEnabled = useFeatureFlagEnabled('DETECTION_PANEL');
  const prefersReducedMotion = useReducedMotion() ?? false;
  
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [animatingRows, setAnimatingRows] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const leftRowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map());
  const rightRowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map());

  // Enrich matches with quality and razon_social
  const enrichedMatches = useMemo(() => 
    matches.map(m => getMatchQuality(m, retencionData, plataformaData)), 
    [matches, retencionData, plataformaData]
  );

  // Staggered animation on mount/filter change
  useEffect(() => {
    if (prefersReducedMotion || enrichedMatches.length === 0) {
      setAnimatingRows(new Set(enrichedMatches.map(m => `${m.ret_id}-${m.plat_id}`)));
      return;
    }

    const rowIds = enrichedMatches.map(m => `${m.ret_id}-${m.plat_id}`);
    const staggerDelay = 80;
    const maxDelay = 800;

    rowIds.forEach((id, index) => {
      const delay = Math.min(index * staggerDelay, maxDelay);
      setTimeout(() => {
        setAnimatingRows(prev => new Set([...prev, id]));
      }, delay);
    });
  }, [enrichedMatches, prefersReducedMotion]);

  const handleRowSelection = (matchId: string) => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      if (next.has(matchId)) next.delete(matchId);
      else next.add(matchId);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedRows.size === enrichedMatches.length) {
      setSelectedRows(new Set());
    } else {
      setAnimatingRows(new Set(enrichedMatches.map(m => `${m.ret_id}-${m.plat_id}`)));
    }
  };

  const handleConfirmSelected = async () => {
    const selected = enrichedMatches.filter(m => selectedRows.has(`${m.ret_id}-${m.plat_id}`));
    if (selected.length > 0) {
      await onConfirm(selected);
      setSelectedRows(new Set());
    }
  };

  const handleRejectSelected = async () => {
    const selected = enrichedMatches.filter(m => selectedRows.has(`${m.ret_id}-${m.plat_id}`));
    if (selected.length > 0) {
      await onReject(selected);
      setSelectedRows(new Set());
    }
  };

  const handleFlagSelected = async () => {
    const selected = enrichedMatches.filter(m => selectedRows.has(`${m.ret_id}-${m.plat_id}`));
    if (selected.length > 0) {
      await onFlag(selected);
      setSelectedRows(new Set());
    }
  };

  const handleConfirmAll = async () => {
    if (enrichedMatches.length > 0) {
      await onConfirm(enrichedMatches);
      setSelectedRows(new Set());
    }
  };

  const handleRejectAll = async () => {
    if (enrichedMatches.length > 0) {
      await onReject(enrichedMatches);
      setSelectedRows(new Set());
    }
  };

  if (!panelEnabled || enrichedMatches.length === 0) {
    return null; // Fallback handled by parent
  }

  // Filter matches based on ComparisonEngine filters
  const filteredMatches = useMemo(() => {
    return enrichedMatches.filter(m => {
      if (filters.cuitSearch && !m.cuit.includes(filters.cuitSearch)) return false;
      if (filters.periodFrom && m.periodo_ret < filters.periodFrom) return false;
      if (filters.periodTo && m.periodo_ret > filters.periodTo) return false;
      if (filters.amountMin > 0 && m.monto_ret < filters.amountMin) return false;
      if (filters.amountMax > 0 && m.monto_ret > filters.amountMax) return false;
      return true;
    });
  }, [enrichedMatches, filters]);

  const exactCount = filteredMatches.filter(m => m.quality === 'EXACT').length;
  const nearCount = filteredMatches.filter(m => m.quality === 'NEAR').length;
  const manualCount = filteredMatches.filter(m => m.quality === 'MANUAL').length;

  return (
    <Card
      sx={{ 
        mt: 2, 
        border: `1px solid ${tokens.colors.surface.border}`,
        overflow: 'hidden',
      }}
    >
      <CardHeader
        title="Detección de Coincidencias"
        titleTypographyProps={{
          fontWeight: 600,
          fontFamily: tokens.typography.fontFamilies.display,
          color: tokens.colors.text.primary,
        }}
        avatar={
          <Chip
            label={`${filteredMatches.length} coincidencias`}
            size="small"
            color="info"
            variant="outlined"
          />
        }
        action={
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Tooltip title="Exactas">
              <Chip label={`${exactCount}`} icon={<CheckCircle fontSize="small" />} size="small" color="success" variant="outlined" />
            </Tooltip>
            <Tooltip title="Cercanas">
              <Chip label={`${nearCount}`} icon={<Warning fontSize="small" />} size="small" color="warning" variant="outlined" />
            </Tooltip>
            <Tooltip title="Manuales">
              <Chip label={`${manualCount}`} icon={<Gavel fontSize="small" />} size="small" color="info" variant="outlined" />
            </Tooltip>
          </Box>
        }
        sx={{
          bgcolor: tokens.colors.surface.panel,
          borderBottom: `1px solid ${tokens.colors.surface.border}`,
        }}
      />
      
      {/* Toolbar */}
      <CardContent sx={{ p: 2, borderBottom: `1px solid ${tokens.colors.surface.border}` }}>
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap alignItems="center">
          {selectedRows.size > 0 && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Confirmar seleccionados">
                <Button
                  startIcon={<Check />}
                  color="success"
                  variant="contained"
                  onClick={handleConfirmSelected}
                  size="small"
                >
                  Confirmar ({selectedRows.size})
                </Button>
              </Tooltip>
              <Tooltip title="Rechazar seleccionados">
                <Button
                  startIcon={<Close />}
                  color="error"
                  variant="outlined"
                  onClick={handleRejectSelected}
                  size="small"
                >
                  Rechazar
                </Button>
              </Tooltip>
              <Tooltip title="Marcar para revisión">
                <Button
                  startIcon={<Flag />}
                  color="warning"
                  variant="outlined"
                  onClick={handleFlagSelected}
                  size="small"
                >
                  Marcar
                </Button>
              </Tooltip>
            </Box>
          )}
          
          <Box sx={{ flexGrow: 1 }} />
          
          <Tooltip title="Confirmar todos">
            <Button startIcon={<CheckCircle />} onClick={handleConfirmAll} variant="outlined" size="small" color="success">
              Confirmar Todos
            </Button>
          </Tooltip>
          <Tooltip title="Rechazar todos">
            <Button startIcon={<Cancel />} onClick={handleRejectAll} variant="outlined" size="small" color="error">
              Rechazar Todos
            </Button>
          </Tooltip>
          <Tooltip title="Exportar CSV">
            <Button startIcon={<Download />} variant="outlined" size="small" onClick={() => { /* TODO */ }}>
              Exportar
            </Button>
          </Tooltip>
        </Stack>
      </CardContent>
      
      {/* Match list */}
      <CardContent sx={{ p: 0 }}>
        <TableContainer
          ref={containerRef}
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
                <TableCell padding="checkbox" width={48} align="center">
                  <Checkbox
                    indeterminate={selectedRows.size > 0 && selectedRows.size < filteredMatches.length}
                    checked={selectedRows.size === filteredMatches.length && filteredMatches.length > 0}
                    onChange={handleSelectAll}
                    size="small"
                  />
                </TableCell>
                <TableCell style={{ width: 100, fontWeight: 600 }}>Calidad</TableCell>
                <TableCell style={{ width: 140, fontWeight: 600 }}>CUIT</TableCell>
                <TableCell style={{ width: 160, fontWeight: 600, textAlign: 'right' }}>Monto RET</TableCell>
                <TableCell style={{ width: 160, fontWeight: 600, textAlign: 'right' }}>Monto PLAT</TableCell>
                <TableCell style={{ width: 100, fontWeight: 600 }}>Diff</TableCell>
                <TableCell style={{ width: 120, fontWeight: 600 }}>Período RET</TableCell>
                <TableCell style={{ width: 120, fontWeight: 600 }}>Período PLAT</TableCell>
                <TableCell style={{ width: 120, fontWeight: 600, textAlign: 'right' }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredMatches.map((match, index) => {
                const matchId = `${match.ret_id}-${match.plat_id}`;
                const isSelected = selectedRows.has(matchId);
                const isAnimated = animatingRows.has(matchId);
                const isExpanded = expandedRow === matchId;
                
                const rowAnimation = prefersReducedMotion ? {} : {
                  initial: { opacity: 0, y: 20 },
                  animate: isAnimated ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 },
                  transition: { duration: 0.3, delay: index * 0.08 },
                };

                return (
                  <motion.tr
                    key={matchId}
                    {...rowAnimation}
                    style={{
                      backgroundColor: isSelected 
                        ? `${tokens.colors.semantic.precision.base}15`
                        : isExpanded
                        ? tokens.colors.surface.panelHover
                        : undefined,
                    }}
                  >
                    <TableCell padding="checkbox" align="center">
                      <Checkbox
                        checked={isSelected}
                        onChange={() => handleRowSelection(matchId)}
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <QualityBadge quality={match.quality} />
                    </TableCell>
                    <TableCell
                      style={{ fontFamily: tokens.typography.fontFamilies.mono, fontSize: tokens.typography.fontSizes.sm }}
                    >
                      {match.cuit}
                    </TableCell>
                    <TableCell
                      align="right"
                      style={{ 
                        fontFamily: tokens.typography.fontFamilies.mono, 
                        fontSize: tokens.typography.fontSizes.sm,
                        color: tokens.colors.semantic.precision.base,
                      }}
                    >
                      {formatCurrency(match.monto_ret)}
                    </TableCell>
                    <TableCell
                      align="right"
                      style={{ 
                        fontFamily: tokens.typography.fontFamilies.mono, 
                        fontSize: tokens.typography.fontSizes.sm,
                        color: tokens.colors.semantic.control.base,
                      }}
                    >
                      {formatCurrency(match.monto_plat)}
                    </TableCell>
                    <TableCell
                      align="center"
                      style={{ fontFamily: tokens.typography.fontFamilies.mono, fontSize: tokens.typography.fontSizes.sm }}
                    >
                      {match.diff > 0.01 ? (
                        <Chip
                          label={`Δ ${formatCurrency(match.diff)}`}
                          size="small"
                          color="warning"
                          variant="outlined"
                          sx={{ height: 20, fontSize: '0.6rem' }}
                        />
                      ) : (
                        <Chip label="≡" size="small" color="success" variant="outlined" sx={{ height: 20, fontSize: '0.6rem' }} />
                      )}
                    </TableCell>
                    <TableCell style={{ fontSize: tokens.typography.fontSizes.sm }}>
                      {match.periodo_ret.length === 6 ? `${match.periodo_ret.slice(0,4)}-${match.periodo_ret.slice(4)}` : match.periodo_ret}
                    </TableCell>
                    <TableCell style={{ fontSize: tokens.typography.fontSizes.sm }}>
                      {match.periodo_plat.length === 6 ? `${match.periodo_plat.slice(0,4)}-${match.periodo_plat.slice(4)}` : match.periodo_plat}
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} useFlexGap>
                        <Tooltip title="Confirmar">
                          <IconButton size="small" color="success" onClick={e => { e.stopPropagation(); onConfirm([match]); }}>
                            <CheckCircle fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Rechazar">
                          <IconButton size="small" color="error" onClick={e => { e.stopPropagation(); onReject([match]); }}>
                            <Cancel fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Marcar para revisión manual">
                          <IconButton size="small" color="info" onClick={e => { e.stopPropagation(); onFlag([match]); }}>
                            <Flag fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Abrir en Validación Manual">
                          <IconButton size="small" color="primary" onClick={e => { e.stopPropagation(); setExpandedRow(isExpanded ? null : matchId); }}>
                            <ChevronRight fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </motion.tr>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* Connection Lines overlay */}
        <ConnectionLines
          matches={filteredMatches}
          leftRowRefs={leftRowRefs.current}
          rightRowRefs={rightRowRefs.current}
          density={density}
          containerRef={containerRef}
          hoveredPairId={undefined}
          onPairHover={() => {}}
        />
      </CardContent>
    </Card>
  );
}

export default DetectionPanel;