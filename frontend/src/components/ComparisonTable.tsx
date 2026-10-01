/**
 * ComparisonTable Component
 * Replaces DataTable (both usages: RETENCION + PLATAFORMA)
 * Virtualized via @tanstack/react-virtual, 3 density modes, match status column,
 * inline amount comparison, Selection API compatible
 */

import { useRef, useMemo, useCallback } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Checkbox,
  Chip,
  Tooltip,
  Typography,
  Box,
} from '@mui/material';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useDensity } from '../hooks/useDensity';
import { useECJYTokens } from '../theme/ECJYThemeProvider';
import { Ingreso, MatchResult, CruceOk } from '../types';
import { useFeatureFlagEnabled } from '../hooks/useFeatureFlag';

export type TableSource = 'retencion' | 'plataforma';

interface ComparisonTableProps {
  source: TableSource;
  data: Ingreso[];
  matches: MatchResult[];
  confirmedMatches: CruceOk[];
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
  density: 'comfortable' | 'compact' | 'dense';
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(value);
};

type MatchStatus = 'sin-cruce' | 'coincide' | 'diferencia' | 'confirmado';

interface MatchInfo {
  status: MatchStatus;
  matchedAmount?: number;
  diff?: number;
  matchId?: string;
}

function getMatchInfo(
  item: Ingreso,
  matches: MatchResult[],
  confirmedMatches: CruceOk[],
  source: TableSource
): MatchInfo {
  const itemId = item._id || item.id || '';

  // Check confirmed matches first
  const confirmed = confirmedMatches.find(
    (cm) => (source === 'retencion' ? cm.id_retencion : cm.id_plataforma) === itemId
  );
  if (confirmed) {
    return {
      status: 'confirmado',
      matchedAmount: confirmed.monto,
      diff: 0, // CruceOk only has single monto field
      matchId: confirmed.id,
    };
  }

  // Check auto matches
  const match = matches.find(
    (m) => (source === 'retencion' ? m.ret_id : m.plat_id) === itemId
  );
  if (match) {
    const diff = Math.abs(match.monto_ret - match.monto_plat);
    return {
      status: diff <= 0.01 ? 'coincide' : 'diferencia',
      matchedAmount: source === 'retencion' ? match.monto_plat : match.monto_ret,
      diff,
      matchId: `${match.ret_id}-${match.plat_id}`,
    };
  }

  return { status: 'sin-cruce' };
}

function getStatusChip(status: MatchStatus) {
  const config: Record<MatchStatus, { label: string; color: 'default' | 'primary' | 'success' | 'warning' | 'info' | 'error'; variant: 'outlined' | 'filled' }> = {
    'sin-cruce': { label: 'Sin cruce', color: 'default', variant: 'outlined' },
    coincide: { label: 'Coincide', color: 'success', variant: 'outlined' },
    diferencia: { label: 'Diferencia', color: 'warning', variant: 'outlined' },
    confirmado: { label: 'Confirmado', color: 'info', variant: 'filled' },
  };

  const c = config[status];
  return { ...c, label: c.label };
}

export function ComparisonTable({
  source,
  data,
  matches,
  confirmedMatches,
  selectedIds,
  onToggleSelection,
  // density: kept for API compatibility with parent
}: ComparisonTableProps) {
  const { tokens } = useECJYTokens();
  const { rowHeight } = useDensity();
  const tableEnabled = useFeatureFlagEnabled('COMPARISON_TABLE');
  const parentRef = useRef<HTMLDivElement>(null);

  if (!tableEnabled) {
    return null; // Fallback to original DataTable handled by parent
  }

  // Determine columns based on source
  const columns = useMemo(() => {
    if (source === 'retencion') {
      return [
        { key: 'select', header: 'Sel', width: 48, align: 'center' as const },
        { key: 'cuit', header: 'CUIT', width: 180, align: 'left' as const },
        { key: 'monto', header: 'Monto', width: 160, align: 'right' as const },
        { key: 'periodo', header: 'Período', width: 120, align: 'left' as const },
        { key: 'estado', header: 'Estado', width: 140, align: 'center' as const },
      ];
    }
    return [
      { key: 'select', header: 'Sel', width: 48, align: 'center' as const },
      { key: 'cuit', header: 'CUIT', width: 180, align: 'left' as const },
      { key: 'monto', header: 'Monto', width: 160, align: 'right' as const },
      { key: 'periodo', header: 'Período', width: 120, align: 'left' as const },
      { key: 'estado', header: 'Estado', width: 140, align: 'center' as const },
    ];
  }, [source]);

  // Virtualizer setup
  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 5,
  });

  const virtualRows = virtualizer.getVirtualItems();

  // Row click handler
  const handleRowClick = useCallback(
    (item: Ingreso, e: React.MouseEvent) => {
      // Don't toggle if clicking on checkbox
      if ((e.target as HTMLElement).closest('input[type="checkbox"]')) {
        return;
      }
      const itemId = item._id || item.id || '';
      onToggleSelection(itemId);
    },
    [onToggleSelection]
  );

  const colorMap = {
    retencion: {
      headerBg: tokens.colors.semantic.precision.subtle,
      headerColor: tokens.colors.semantic.precision.on,
      chipColor: 'primary' as const,
      title: 'RETENCION Pendientes',
    },
    plataforma: {
      headerBg: tokens.colors.semantic.control.subtle,
      headerColor: tokens.colors.semantic.control.on,
      chipColor: 'success' as const,
      title: 'PLATAFORMA Pendientes',
    },
  };

  const colors = colorMap[source];

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        border: `1px solid ${tokens.colors.surface.border}`,
      }}
      elevation={2}
    >
      <CardHeader
        title={colors.title}
        titleTypographyProps={{
          fontWeight: 600,
          fontFamily: tokens.typography.fontFamilies.display,
          color: colors.headerColor,
        }}
        avatar={
          <Chip
            label={`${data.length} registros`}
            size="small"
            color={colors.chipColor}
            variant="outlined"
          />
        }
        sx={{
          bgcolor: colors.headerBg,
          borderBottom: `1px solid ${tokens.colors.surface.border}`,
        }}
      />
      <CardContent sx={{ flex: 1, p: 0, '&:last-child': { pb: 0 } }}>
        <Box
          ref={parentRef}
          style={{
            height: '100%',
            maxHeight: 500,
            overflow: 'auto',
            position: 'relative',
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
                {columns.map((col) => (
                  <TableCell
                    key={col.key}
                    padding="checkbox"
                    align={col.align}
                    style={{
                      width: col.width,
                      minWidth: col.width,
                      height: rowHeight,
                      padding: `${tokens.spacing[1]} ${tokens.spacing[2]}`,
                      fontFamily: tokens.typography.fontFamilies.display,
                      fontWeight: tokens.typography.fontWeights.semibold,
                      fontSize: tokens.typography.fontSizes.sm,
                      color: tokens.colors.text.primary,
                      borderBottom: `2px solid ${tokens.colors.semantic.precision.base}`,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {col.header}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody style={{ minHeight: data.length * rowHeight }}>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    align="center"
                    style={{
                      height: 200,
                      color: tokens.colors.text.tertiary,
                    }}
                  >
                    <Typography color="text.secondary">
                      No hay registros pendientes
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {virtualRows.map((virtualRow) => {
                    const item = data[virtualRow.index];
                    const itemId = item._id || item.id || '';
                    const isSelected = selectedIds.has(itemId);
                    const matchInfo = getMatchInfo(item, matches, confirmedMatches, source);

                    return (
                      <TableRow
                        key={itemId}
                        style={{
                          height: rowHeight,
                          position: 'absolute',
                          top: virtualRow.start,
                          left: 0,
                          right: 0,
                          backgroundColor: matchInfo.status === 'confirmado'
                            ? tokens.colors.semantic.order.subtle
                            : matchInfo.status === 'coincide'
                            ? tokens.colors.semantic.precision.subtle
                            : matchInfo.status === 'diferencia'
                            ? tokens.colors.semantic.detection.subtle
                            : tokens.colors.surface.panel,
                          borderLeft:
                            matchInfo.status === 'confirmado'
                              ? `3px solid ${tokens.colors.semantic.order.base}`
                              : matchInfo.status === 'coincide'
                              ? `3px solid ${tokens.colors.semantic.precision.base}`
                              : matchInfo.status === 'diferencia'
                              ? `3px solid ${tokens.colors.semantic.detection.base}`
                              : 'none',
                        }}
                        hover
                        selected={isSelected}
                        onClick={(e) => handleRowClick(item, e)}
                      >
                        <TableCell
                          padding="checkbox"
                          align="center"
                          style={{
                            height: rowHeight,
                            padding: `${tokens.spacing[1]} ${tokens.spacing[2]}`,
                            borderBottom: `1px solid ${tokens.colors.surface.border}`,
                          }}
                        >
                          <Checkbox
                            checked={isSelected}
                            color={colors.chipColor}
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleSelection(itemId);
                            }}
                          />
                        </TableCell>
                        <TableCell
                          align="left"
                          style={{
                            height: rowHeight,
                            padding: `${tokens.spacing[1]} ${tokens.spacing[2]}`,
                            borderBottom: `1px solid ${tokens.colors.surface.border}`,
                            fontFamily: tokens.typography.fontFamilies.mono,
                            fontSize: tokens.typography.fontSizes.sm,
                            color: tokens.colors.text.primary,
                          }}
                        >
                          {item.cuit}
                        </TableCell>
                        <TableCell
                          align="right"
                          style={{
                            height: rowHeight,
                            padding: `${tokens.spacing[1]} ${tokens.spacing[2]}`,
                            borderBottom: `1px solid ${tokens.colors.surface.border}`,
                            fontFamily: tokens.typography.fontFamilies.mono,
                            fontSize: tokens.typography.fontSizes.sm,
                            fontWeight: 500,
                          }}
                        >
                          {matchInfo.matchedAmount !== undefined && matchInfo.status !== 'sin-cruce' ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                              <Typography
                                variant="body2"
                                color={source === 'retencion' ? 'precision.main' : 'control.main'}
                              >
                                {formatCurrency(item.monto)}
                              </Typography>
                              <Typography
                                variant="caption"
                                color={matchInfo.status === 'coincide' ? 'success.main' : 'warning.main'}
                                sx={{ fontFamily: tokens.typography.fontFamilies.mono, fontSize: '0.65rem' }}
                              >
                                ≡ {formatCurrency(matchInfo.matchedAmount)}
                                {matchInfo.diff !== undefined && matchInfo.diff > 0.01 && (
                                  <Chip
                                    label={`Δ ${formatCurrency(matchInfo.diff)}`}
                                    size="small"
                                    variant="outlined"
                                    color="warning"
                                    sx={{ ml: 1, height: 16, fontSize: '0.6rem' }}
                                  />
                                )}
                              </Typography>
                            </Box>
                          ) : (
                            <Typography
                              variant="body2"
                              color={source === 'retencion' ? 'precision.main' : 'control.main'}
                              sx={{ fontFamily: tokens.typography.fontFamilies.mono }}
                            >
                              {formatCurrency(item.monto)}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell
                          align="left"
                          style={{
                            height: rowHeight,
                            padding: `${tokens.spacing[1]} ${tokens.spacing[2]}`,
                            borderBottom: `1px solid ${tokens.colors.surface.border}`,
                            fontFamily: tokens.typography.fontFamilies.mono,
                            fontSize: tokens.typography.fontSizes.sm,
                            color: tokens.colors.text.secondary,
                          }}
                        >
                          {item.periodo.length === 6
                            ? `${item.periodo.slice(0, 4)}-${item.periodo.slice(4)}`
                            : item.periodo}
                        </TableCell>
                        <TableCell
                          align="center"
                          style={{
                            height: rowHeight,
                            padding: `${tokens.spacing[1]} ${tokens.spacing[2]}`,
                            borderBottom: `1px solid ${tokens.colors.surface.border}`,
                          }}
                        >
                          {(() => {
                            const { label, color, variant } = getStatusChip(matchInfo.status);
                            return (
                              <Tooltip
                                title={
                                  matchInfo.status === 'confirmado'
                                    ? `Confirmado: ${matchInfo.matchId}`
                                    : matchInfo.status === 'coincide'
                                    ? `Coincide (diff: ${matchInfo.diff ? formatCurrency(matchInfo.diff) : '0.00'})`
                                    : matchInfo.status === 'diferencia'
                                    ? `Diferencia: ${formatCurrency(matchInfo.diff || 0)}`
                                    : 'Sin cruce encontrado'
                                }
                                arrow
                              >
                                <Chip
                                  label={label}
                                  size="small"
                                  color={color}
                                  variant={variant}
                                  sx={{
                                    fontFamily: tokens.typography.fontFamilies.body,
                                    fontWeight: tokens.typography.fontWeights.medium,
                                  }}
                                />
                              </Tooltip>
                            );
                          })()}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </>
              )}
            </TableBody>
          </Table>
        </Box>
      </CardContent>
    </Card>
  );
}

export default ComparisonTable;