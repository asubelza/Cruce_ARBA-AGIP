/**
 * ComparisonEngine Component
 * Orchestrator: progressive reveal, filters, export, drives sub-components
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Box, Stack, Card, CardContent, TextField, InputAdornment, IconButton, Button, Tooltip, Select, MenuItem, FormControl, InputLabel, Chip, Slider, Typography } from '@mui/material';
import { Download, Settings, Close, Search } from '@mui/icons-material';
import { useECJYTokens } from '../theme/ECJYThemeProvider';
import { Ingreso, MatchResult, CruceOk } from '../types';
import { ComparisonTable } from './ComparisonTable';
import { ConnectionLines } from './ConnectionLines';
import { DataLayers } from './DataLayers';
import { useFeatureFlagEnabled } from '../hooks/useFeatureFlag';
import { useDensity } from '../hooks/useDensity';

export interface ComparisonFilters {
  cuitSearch: string;
  periodFrom: string;
  periodTo: string;
  amountMin: number;
  amountMax: number;
  matchStatus: 'all' | 'sin-cruce' | 'coincide' | 'diferencia' | 'confirmado';
  amountTolerance: number;
}

const DEFAULT_FILTERS: ComparisonFilters = {
  cuitSearch: '',
  periodFrom: '',
  periodTo: '',
  amountMin: 0,
  amountMax: 0,
  matchStatus: 'all',
  amountTolerance: 0.01,
};

interface ComparisonEngineProps {
  retencionData: Ingreso[];
  plataformaData: Ingreso[];
  matches: MatchResult[];
  confirmedMatches: CruceOk[];
  onFilterChange: (filters: ComparisonFilters) => void;
  onExport: (data: any[]) => void;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(value);
}

export function ComparisonEngine({
  retencionData,
  plataformaData,
  matches,
  confirmedMatches,
  onFilterChange,
  onExport,
}: ComparisonEngineProps) {
  const { tokens } = useECJYTokens();
  const { density } = useDensity();
  const engineEnabled = useFeatureFlagEnabled('COMPARISON_ENGINE');
  const [filters, setFilters] = useState<ComparisonFilters>(DEFAULT_FILTERS);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [leftRowRefs] = useState<Map<string, HTMLTableRowElement>>(new Map());
  const [rightRowRefs] = useState<Map<string, HTMLTableRowElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

  // Persist filters to localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ecjy-comparison-filters');
    if (saved) {
      try {
        setFilters(JSON.parse(saved));
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('ecjy-comparison-filters', JSON.stringify(filters));
  }, [filters]);

  // Filter data
  const applyFilters = useCallback((data: Ingreso[]) => {
    return data.filter(item => {
      // CUIT search
      if (filters.cuitSearch && !item.cuit.includes(filters.cuitSearch)) return false;
      
      // Period range
      if (filters.periodFrom && item.periodo < filters.periodFrom) return false;
      if (filters.periodTo && item.periodo > filters.periodTo) return false;
      
      // Amount range
      if (filters.amountMin > 0 && item.monto < filters.amountMin) return false;
      if (filters.amountMax > 0 && item.monto > filters.amountMax) return false;
      
      return true;
    });
  }, [filters]);

  const filteredRetencion = applyFilters(retencionData);
  const filteredPlataforma = applyFilters(plataformaData);

  // Filter matches based on filtered data
  const filteredMatches = useMemo(() => {
    const retIds = new Set(filteredRetencion.map(r => r._id || r.id));
    const platIds = new Set(filteredPlataforma.map(p => p._id || p.id));
    return matches.filter(m => retIds.has(m.ret_id) && platIds.has(m.plat_id));
  }, [matches, filteredRetencion, filteredPlataforma]);

  const filteredConfirmed = useMemo(() => {
    const retIds = new Set(filteredRetencion.map(r => r._id || r.id));
    const platIds = new Set(filteredPlataforma.map(p => p._id || p.id));
    return confirmedMatches.filter(m => retIds.has(m.id_retencion) && platIds.has(m.id_plataforma));
  }, [confirmedMatches, filteredRetencion, filteredPlataforma]);

  // Notify parent of filter changes
  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  // Export handler
  const handleExport = useCallback(() => {
    const exportData = filteredRetencion.map(r => ({
      fuente: 'RETENCION',
      cuit: r.cuit,
      monto: r.monto,
      periodo: r.periodo,
      razon_social: r.razon_social,
    })).concat(filteredPlataforma.map(p => ({
      fuente: 'PLATAFORMA',
      cuit: p.cuit,
      monto: p.monto,
      periodo: p.periodo,
      razon_social: p.razon_social,
    })));
    onExport(exportData);
  }, [filteredRetencion, filteredPlataforma, onExport]);

  // Clear filters
  const handleClearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  if (!engineEnabled) {
    return null; // Fallback handled by parent
  }

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', border: `1px solid ${tokens.colors.surface.border}` }}>
      {/* Toolbar */}
      <CardContent sx={{ p: 2, borderBottom: `1px solid ${tokens.colors.surface.border}` }}>
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap alignItems="center">
          {/* Search CUIT */}
          <TextField
            size="small"
            placeholder="Buscar CUIT..."
            value={filters.cuitSearch}
            onChange={(e) => setFilters(prev => ({ ...prev, cuitSearch: e.target.value }))}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search color="action" /></InputAdornment>,
            }}
            sx={{ minWidth: 200 }}
          />
          
          {/* Period filters */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">Período:</Typography>
            <TextField
              size="small"
              type="month"
              value={filters.periodFrom}
              onChange={(e) => setFilters(prev => ({ ...prev, periodFrom: e.target.value }))}
              InputProps={{ startAdornment: <InputAdornment position="start">Desde</InputAdornment> }}
              sx={{ width: 160 }}
            />
            <TextField
              size="small"
              type="month"
              value={filters.periodTo}
              onChange={(e) => setFilters(prev => ({ ...prev, periodTo: e.target.value }))}
              InputProps={{ startAdornment: <InputAdornment position="start">Hasta</InputAdornment> }}
              sx={{ width: 160 }}
            />
          </Box>
          
          {/* Amount range */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', ml: 1 }}>
            <Typography variant="body2" color="text.secondary">Monto:</Typography>
            <TextField
              size="small"
              type="number"
              placeholder="Min"
              value={filters.amountMin}
              onChange={(e) => setFilters(prev => ({ ...prev, amountMin: parseFloat(e.target.value) || 0 }))}
              sx={{ width: 100 }}
            />
            <TextField
              size="small"
              type="number"
              placeholder="Max"
              value={filters.amountMax}
              onChange={(e) => setFilters(prev => ({ ...prev, amountMax: parseFloat(e.target.value) || 0 }))}
              sx={{ width: 100 }}
            />
          </Box>
          
          {/* Match status filter */}
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="match-status-label">Estado</InputLabel>
            <Select
              labelId="match-status-label"
              value={filters.matchStatus}
              label="Estado"
              onChange={(e) => setFilters(prev => ({ ...prev, matchStatus: e.target.value as any }))}
            >
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="sin-cruce">Sin cruce</MenuItem>
              <MenuItem value="coincide">Coincide</MenuItem>
              <MenuItem value="diferencia">Diferencia</MenuItem>
              <MenuItem value="confirmado">Confirmado</MenuItem>
            </Select>
          </FormControl>
          
          {/* Advanced filters toggle */}
          <Tooltip title="Filtros avanzados">
            <IconButton
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              color={showAdvancedFilters ? 'primary' : 'default'}
            >
              <Settings />
            </IconButton>
          </Tooltip>
          
          {/* Clear filters */}
          {(filters.cuitSearch || filters.periodFrom || filters.periodTo || filters.amountMin || filters.amountMax || filters.matchStatus !== 'all') && (
            <Tooltip title="Limpiar filtros">
              <IconButton onClick={handleClearFilters} color="default">
                <Close />
              </IconButton>
            </Tooltip>
          )}
          
          <Box sx={{ flexGrow: 1 }} />
          
          {/* Export button */}
          <Tooltip title="Exportar CSV">
            <Button startIcon={<Download />} onClick={handleExport} variant="outlined">
              Exportar
            </Button>
          </Tooltip>
        </Stack>
        
        {/* Advanced filters */}
        {showAdvancedFilters && (
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap mt={2} alignItems="center" sx={{ paddingTop: 2, borderTop: `1px solid ${tokens.colors.surface.border}` }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">Tolerancia monto:</Typography>
              <Slider
                value={filters.amountTolerance}
                min={0}
                max={1}
                step={0.01}
                valueLabelDisplay="auto"
                onChange={(_, v) => setFilters(prev => ({ ...prev, amountTolerance: Array.isArray(v) ? v[0] : v }))}
                sx={{ width: 200 }}
              />
              <Typography variant="body2" color="text.secondary">{formatCurrency(filters.amountTolerance)}</Typography>
            </Box>
          </Stack>
        )}
      </CardContent>
      
      {/* Results summary */}
      <CardContent sx={{ px: 2, py: 1, borderBottom: `1px solid ${tokens.colors.surface.border}` }}>
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          <Chip label={`RET: ${filteredRetencion.length}`} color="primary" variant="outlined" size="small" />
          <Chip label={`PLAT: ${filteredPlataforma.length}`} color="success" variant="outlined" size="small" />
          <Chip label={`Matches: ${filteredMatches.length}`} color="info" variant="outlined" size="small" />
          <Chip label={`Confirmados: ${filteredConfirmed.length}`} color="secondary" variant="outlined" size="small" />
        </Stack>
      </CardContent>
      
      {/* Main comparison area */}
      <CardContent sx={{ flex: 1, p: 0, '&:last-child': { pb: 0 }, overflow: 'hidden' }}>
        <Box
          ref={containerRef}
          style={{
            height: 'calc(100vh - 400px)',
            minHeight: 500,
            position: 'relative',
            overflow: 'auto',
          }}
        >
          {/* Connection Lines */}
          <ConnectionLines
            matches={filteredMatches}
            leftRowRefs={leftRowRefs}
            rightRowRefs={rightRowRefs}
            density={density}
            containerRef={containerRef}
            hoveredPairId={undefined}
            onPairHover={() => {}}
          />
          
          {/* Dual tables */}
          <Box
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: tokens.spacing[3],
              height: '100%',
              minHeight: 500,
            }}
          >
            <ComparisonTable
              source="retencion"
              data={filteredRetencion}
              matches={filteredMatches}
              confirmedMatches={filteredConfirmed}
              selectedIds={new Set()}
              onToggleSelection={() => {}}
              density={density}
            />
            <ComparisonTable
              source="plataforma"
              data={filteredPlataforma}
              matches={filteredMatches}
              confirmedMatches={filteredConfirmed}
              selectedIds={new Set()}
              onToggleSelection={() => {}}
              density={density}
            />
          </Box>
        </Box>
      </CardContent>
      
      {/* Data Layers */}
      <DataLayers
        retencionData={filteredRetencion}
        plataformaData={filteredPlataforma}
        matches={filteredMatches}
        confirmedMatches={filteredConfirmed}
        density={density}
      />
    </Card>
  );
}

export default ComparisonEngine;