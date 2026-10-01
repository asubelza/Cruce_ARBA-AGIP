/**
 * DifferenceDetector Component
 * Dual panel layout comparing RETENCION (ARCA COMPROBANTES) vs PLATAFORMA (PROCESSED)
 * Synchronized scroll, matched pair highlighting, density modes, filter synchronization
 */

import { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import { Box, Typography, Table, TableHead, TableBody, TableRow, TableCell, TableContainer, Chip, Tooltip } from '@mui/material';
import { CheckCircle, RemoveCircle } from '@mui/icons-material';
import { useDensity } from '../hooks/useDensity';
import { useECJYTokens } from '../theme/ECJYThemeProvider';
import { Ingreso, MatchResult } from '../types';

interface ComparisonFilters {
  cuitSearch: string;
  periodFrom: string;
  periodTo: string;
  amountMin: number;
  amountMax: number;
}

interface DifferenceDetectorProps {
  retencionData: Ingreso[];
  plataformaData: Ingreso[];
  matches: MatchResult[];
  density: 'comfortable' | 'compact' | 'dense';
  filters: ComparisonFilters;
  onFiltersChange: (filters: ComparisonFilters) => void;
}

const PANEL_WIDTH = '100%';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(value);
}

function formatPeriod(period: string): string {
  // Assuming format YYYYMM
  if (period.length === 6) {
    return `${period.slice(0, 4)}-${period.slice(4)}`;
  }
  return period;
}

export function DifferenceDetector({
  retencionData,
  plataformaData,
  matches,
  density: _density,
  filters,
  onFiltersChange: _onFiltersChange,
}: DifferenceDetectorProps) {
  const { tokens } = useECJYTokens();
  const { rowHeight } = useDensity();
  const leftScrollRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);
  const [matchedPairs, setMatchedPairs] = useState<Map<string, { leftIndex: number; rightIndex: number }>>(new Map());

  // Build matched pair indices for highlighting
  useEffect(() => {
    const pairs = new Map<string, { leftIndex: number; rightIndex: number }>();
    matches.forEach((match, _index) => {
      const leftIndex = retencionData.findIndex(r => (r._id || r.id) === match.ret_id);
      const rightIndex = plataformaData.findIndex(p => (p._id || p.id) === match.plat_id);
      if (leftIndex >= 0 && rightIndex >= 0) {
        pairs.set(match.ret_id, { leftIndex, rightIndex });
      }
    });
    setMatchedPairs(pairs);
  }, [matches, retencionData, plataformaData]);

  // Synchronized scroll handler
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>, targetRef: React.RefObject<HTMLDivElement>) => {
    const source = e.currentTarget;
    const target = targetRef.current;
    if (target && target.scrollTop !== source.scrollTop) {
      target.scrollTop = source.scrollTop;
    }
  }, []);

  // Apply filters to both datasets
  const filteredRetencion = useMemo(() => {
    return retencionData.filter(item => {
      if (filters.cuitSearch && !item.cuit.includes(filters.cuitSearch)) return false;
      if (filters.periodFrom && item.periodo < filters.periodFrom) return false;
      if (filters.periodTo && item.periodo > filters.periodTo) return false;
      if (filters.amountMin && item.monto < filters.amountMin) return false;
      if (filters.amountMax && item.monto > filters.amountMax) return false;
      return true;
    });
  }, [retencionData, filters]);

  const filteredPlataforma = useMemo(() => {
    return plataformaData.filter(item => {
      if (filters.cuitSearch && !item.cuit.includes(filters.cuitSearch)) return false;
      if (filters.periodFrom && item.periodo < filters.periodFrom) return false;
      if (filters.periodTo && item.periodo > filters.periodTo) return false;
      if (filters.amountMin && item.monto < filters.amountMin) return false;
      if (filters.amountMax && item.monto > filters.amountMax) return false;
      return true;
    });
  }, [plataformaData, filters]);

  const maxRows = Math.max(filteredRetencion.length, filteredPlataforma.length);
  const containerHeight = maxRows * rowHeight;

  const panelStyle = {
    width: PANEL_WIDTH,
    height: '100%',
    overflowY: 'auto' as const,
    overflowX: 'hidden' as const,
  };

  const tableStyle = {
    width: '100%',
    minHeight: containerHeight,
    tableLayout: 'fixed' as const,
  };

  const cellStyle = (isMatchedRecord: boolean, isPlaceholder = false) => ({
    height: rowHeight,
    padding: `${tokens.spacing[1]} ${tokens.spacing[2]}`,
    borderBottom: `1px solid ${tokens.colors.surface.border}`,
    backgroundColor: isPlaceholder
      ? 'transparent'
      : isMatchedRecord
        ? tokens.colors.semantic.precision.subtle
        : tokens.colors.surface.panel,
    color: isPlaceholder
      ? tokens.colors.text.disabled
      : isMatchedRecord
        ? tokens.colors.semantic.precision.on
        : tokens.colors.text.primary,
    fontFamily: tokens.typography.fontFamilies.mono,
    fontSize: tokens.typography.fontSizes.sm,
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const,
  });

  const headerCellStyle = {
    height: rowHeight,
    padding: `${tokens.spacing[1]} ${tokens.spacing[2]}`,
    backgroundColor: tokens.colors.surface.panelHover,
    borderBottom: `2px solid ${tokens.colors.semantic.precision.base}`,
    color: tokens.colors.text.primary,
    fontFamily: tokens.typography.fontFamilies.display,
    fontWeight: tokens.typography.fontWeights.semibold,
    fontSize: tokens.typography.fontSizes.sm,
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const,
  };

  const RowComponent = ({ 
    item, 
    index, 
    side,
    matchedPairIndex,
  }: { 
    item: Ingreso | null; 
    index: number; 
    side: 'left' | 'right';
    matchedPairIndex: number | null;
  }) => {
    const matched = matchedPairIndex !== null;
    const isPlaceholder = item === null;

    return (
      <TableRow
        key={`${side}-${index}`}
        style={{
          height: rowHeight,
          opacity: isPlaceholder ? 0.4 : 1,
        }}
      >
        <TableCell style={cellStyle(matched, isPlaceholder)}>
          {isPlaceholder ? '—' : item!.cuit}
        </TableCell>
        <TableCell style={cellStyle(matched, isPlaceholder)} align="right">
          {isPlaceholder ? '—' : formatCurrency(item!.monto)}
        </TableCell>
        <TableCell style={cellStyle(matched, isPlaceholder)}>
          {isPlaceholder ? '—' : formatPeriod(item!.periodo)}
        </TableCell>
        <TableCell style={cellStyle(matched, isPlaceholder)}>
          {isPlaceholder ? '—' : item!.razon_social || '—'}
        </TableCell>
        {!isPlaceholder && matched && (
          <TableCell style={{ ...cellStyle(true), width: 32, textAlign: 'center' }}>
            <CheckCircle
              style={{ 
                color: tokens.colors.semantic.precision.base, 
                fontSize: 16 
              }}
            />
          </TableCell>
        )}
        {!isPlaceholder && !matched && (
          <TableCell style={{ ...cellStyle(false), width: 32, textAlign: 'center' }}>
            <RemoveCircle
              style={{ 
                color: tokens.colors.semantic.detection.base, 
                fontSize: 16 
              }}
            />
          </TableCell>
        )}
      </TableRow>
    );
  };

  // Build row data with matched pair alignment
  const leftRows = useMemo(() => {
    const rows: Array<{ item: Ingreso | null; matchedPairIndex: number | null }> = [];
    
    filteredRetencion.forEach((item) => {
      const pair = matchedPairs.get(item._id || item.id || '');
      rows.push({ item, matchedPairIndex: pair ? pair.leftIndex : null });
    });
    return rows;
  }, [filteredRetencion, matchedPairs]);

  const rightRows = useMemo(() => {
    const rows: Array<{ item: Ingreso | null; matchedPairIndex: number | null }> = [];
    
    filteredPlataforma.forEach((item) => {
      const pair = matchedPairs.get(item._id || item.id || '');
      rows.push({ item, matchedPairIndex: pair ? pair.rightIndex : null });
    });
    return rows;
  }, [filteredPlataforma, matchedPairs]);

  const renderPanel = (
    title: string,
    count: number,
    rows: Array<{ item: Ingreso | null; matchedPairIndex: number | null }>,
    side: 'left' | 'right',
    scrollRef: React.RefObject<HTMLDivElement>,
    otherScrollRef: React.RefObject<HTMLDivElement>
  ) => (
    <Box style={{ display: 'flex', flexDirection: 'column', width: PANEL_WIDTH }}>
      <Box
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: `${tokens.spacing[2]} ${tokens.spacing[3]}`,
          backgroundColor: tokens.colors.surface.panel,
          borderBottom: `2px solid ${side === 'left' ? tokens.colors.semantic.precision.base : tokens.colors.semantic.control.base}`,
        }}
      >
        <Typography
          variant="h6"
          style={{
            fontFamily: tokens.typography.fontFamilies.display,
            fontWeight: tokens.typography.fontWeights.bold,
            color: side === 'left' ? tokens.colors.semantic.precision.base : tokens.colors.semantic.control.base,
          }}
        >
          {title}
        </Typography>
        <Chip
          label={count.toLocaleString()}
          size="small"
          style={{
            backgroundColor: side === 'left' 
              ? tokens.colors.semantic.precision.subtle 
              : tokens.colors.semantic.control.subtle,
            color: side === 'left' 
              ? tokens.colors.semantic.precision.on 
              : tokens.colors.semantic.control.on,
            fontWeight: tokens.typography.fontWeights.medium,
          }}
        />
      </Box>

      <TableContainer
        ref={scrollRef}
        style={{ flex: 1, ...panelStyle }}
        onScroll={(e) => handleScroll(e, otherScrollRef)}
      >
        <Table stickyHeader style={tableStyle}>
          <TableHead>
            <TableRow>
              <TableCell style={headerCellStyle}>CUIT</TableCell>
              <TableCell style={{ ...headerCellStyle, textAlign: 'right' }}>Monto</TableCell>
              <TableCell style={headerCellStyle}>Período</TableCell>
              <TableCell style={headerCellStyle}>Razón Social</TableCell>
              <TableCell style={{ ...headerCellStyle, width: 32, textAlign: 'center' }}>
                <Tooltip title={side === 'left' ? 'Coincide en PLATAFORMA' : 'Coincide en RETENCION'}>
                  <CheckCircle style={{ fontSize: 16, color: tokens.colors.semantic.precision.base }} />
                </Tooltip>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map(({ item, matchedPairIndex }, idx) => (
              <RowComponent
                key={`${side}-${idx}`}
                item={item}
                index={idx}
                side={side}
                matchedPairIndex={matchedPairIndex}
              />
            ))}
            {/* Fill remaining rows to align with other panel */}
            {rows.length < maxRows && (
              <>
                {Array.from({ length: maxRows - rows.length }, (_, i) => (
                  <RowComponent
                    key={`${side}-placeholder-${i}`}
                    item={null}
                    index={rows.length + i}
                    side={side}
                    matchedPairIndex={null}
                  />
                ))}
              </>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  return (
    <Box
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: tokens.spacing[3],
        height: 'calc(100vh - 200px)',
        minHeight: 400,
        backgroundColor: tokens.colors.surface.bg,
      }}
      role="region"
      aria-label="Detector de diferencias"
    >
      {renderPanel(
        'ARCA COMPROBANTES',
        filteredRetencion.length,
        leftRows,
        'left',
        leftScrollRef,
        rightScrollRef
      )}
      {renderPanel(
        'PROCESSED',
        filteredPlataforma.length,
        rightRows,
        'right',
        rightScrollRef,
        leftScrollRef
      )}
    </Box>
  );
}

export default DifferenceDetector;