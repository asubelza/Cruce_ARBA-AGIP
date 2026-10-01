/**
 * DataLayers Component
 * Layered visualization: Raw / Matched / Confirmed with opacity toggles
 * Density-adaptive: comfortable=rows, compact=condensed, dense=scatter plot (>5000)
 */

import { useState, useMemo } from 'react';
import { Box, Card, CardContent, Stack, FormControlLabel, Switch, Slider, Tooltip, Typography, Chip, IconButton } from '@mui/material';
import { Layers, Visibility, ScatterPlot } from '@mui/icons-material';
import { useECJYTokens } from '../theme/ECJYThemeProvider';
import { Ingreso, MatchResult, CruceOk } from '../types';
import { useFeatureFlagEnabled } from '../hooks/useFeatureFlag';

interface DataLayersProps {
  retencionData: Ingreso[];
  plataformaData: Ingreso[];
  matches: MatchResult[];
  confirmedMatches: CruceOk[];
  density: 'comfortable' | 'compact' | 'dense';
}

const LAYER_CONFIG = {
  raw: { label: 'Raw', color: 'default', colorToken: 'surface.border', icon: <Layers /> },
  matched: { label: 'Matched', color: 'precision', colorToken: 'precision', icon: <Visibility /> },
  confirmed: { label: 'Confirmed', color: 'order', colorToken: 'order', icon: <Visibility /> },
};

export function DataLayers({
  retencionData,
  plataformaData,
  matches,
  confirmedMatches,
  density,
}: DataLayersProps) {
  const { tokens } = useECJYTokens();
  const layersEnabled = useFeatureFlagEnabled('DATA_LAYERS');
  
  const [layerVisibility, setLayerVisibility] = useState({
    raw: true,
    matched: true,
    confirmed: true,
  });
  const [layerOpacity, setLayerOpacity] = useState({
    raw: 100,
    matched: 100,
    confirmed: 100,
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Counts
  const counts = useMemo(() => {
    const totalRet = retencionData.length;
    const totalPlat = plataformaData.length;
    const total = totalRet + totalPlat;
    const matchedCount = matches.length * 2; // each match has 2 records
    const confirmedCount = confirmedMatches.length * 2;
    const rawOnly = total - matchedCount;
    
    return {
      raw: Math.max(0, rawOnly),
      matched: matchedCount - confirmedCount,
      confirmed: confirmedCount,
      total,
    };
  }, [retencionData.length, plataformaData.length, matches.length, confirmedMatches.length]);

  // Determine render mode based on density and total records
  const totalRecords = retencionData.length + plataformaData.length;
  const isDenseMode = density === 'dense' || totalRecords > 5000;

  const handleToggleLayer = (layer: keyof typeof layerVisibility) => {
    setLayerVisibility(prev => ({ ...prev, [layer]: !prev[layer] }));
  };

  const handleOpacityChange = (layer: keyof typeof layerOpacity, value: number) => {
    setLayerOpacity(prev => ({ ...prev, [layer]: value }));
  };

  if (!layersEnabled) return null;

  const getLayerColor = (layer: keyof typeof LAYER_CONFIG) => {
    const config = LAYER_CONFIG[layer];
    if (config.colorToken === 'surface.border') return tokens.colors.surface.border;
    return tokens.colors.semantic[config.colorToken as keyof typeof tokens.colors.semantic]?.base || tokens.colors.surface.border;
  };

  return (
    <Card
      sx={{
        mt: 2,
        border: `1px solid ${tokens.colors.surface.border}`,
        backgroundColor: tokens.colors.surface.panel,
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap alignItems="center">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle1" fontWeight={600} fontFamily={tokens.typography.fontFamilies.display}>
              Capas de Datos
            </Typography>
            <Tooltip title={isDenseMode ? 'Modo scatter plot (density > 5000)' : 'Modo tabla'}>
              <Chip
                label={isDenseMode ? 'Scatter Plot' : 'Table'}
                size="small"
                icon={<ScatterPlot />}
                color={isDenseMode ? 'warning' : 'info'}
                variant="outlined"
              />
            </Tooltip>
          </Box>
          
          <Box sx={{ flexGrow: 1 }} />
          
          <Tooltip title="Configuración avanzada">
            <IconButton onClick={() => setShowAdvanced(!showAdvanced)} size="small">
              <ExpandMoreIcon expanded={showAdvanced} />
            </IconButton>
          </Tooltip>
        </Stack>
        
        {/* Layer toggles */}
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap mt={1} mb={showAdvanced ? 2 : 0}>
          {(Object.keys(LAYER_CONFIG) as Array<keyof typeof LAYER_CONFIG>).map(layer => {
            const config = LAYER_CONFIG[layer];
            const isVisible = layerVisibility[layer];
            const color = getLayerColor(layer);
            const count = counts[layer];
            
            return (
              <Tooltip key={layer} title={`${config.label}: ${count} registros`}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    padding: 1,
                    borderRadius: 1,
                    border: `1px solid ${isVisible ? color : tokens.colors.surface.border}`,
                    backgroundColor: isVisible ? `${color}15` : 'transparent',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <FormControlLabel
                    control={
                      <Switch
                        checked={isVisible}
                        onChange={() => handleToggleLayer(layer)}
                        color={config.color as any}
                        size="small"
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <span style={{ color, fontSize: 16 }}>{config.icon}</span>
                        <Typography variant="body2" fontWeight={500} sx={{ color: isVisible ? 'text.primary' : 'text.secondary' }}>
                          {config.label}
                        </Typography>
                        <Chip label={count.toString()} size="small" variant="outlined" color={config.color as any} />
                      </Box>
                    }
                    labelPlacement="end"
                  />
                </Box>
              </Tooltip>
            );
          })}
        </Stack>
        
        {/* Advanced: opacity sliders */}
        {showAdvanced && (
          <Box sx={{ mt: 1, pt: 2, borderTop: `1px solid ${tokens.colors.surface.border}` }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Opacidad de capas
            </Typography>
            <Stack spacing={1.5}>
              {(Object.keys(LAYER_CONFIG) as Array<keyof typeof LAYER_CONFIG>).map(layer => {
                const config = LAYER_CONFIG[layer];
                const color = getLayerColor(layer);
                return (
                  <Box key={layer} sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 300 }}>
                    <Box sx={{ width: 30, display: 'flex', alignItems: 'center' }}>
                      <span style={{ color, fontSize: 16 }}>{config.icon}</span>
                    </Box>
                    <Typography variant="body2" sx={{ width: 80, color: 'text.secondary' }}>
                      {config.label}
                    </Typography>
                    <Slider
                      value={layerOpacity[layer]}
                      min={0}
                      max={100}
                      step={10}
                      valueLabelDisplay="auto"
                      onChange={(_, v) => handleOpacityChange(layer, Array.isArray(v) ? v[0] : v)}
                      sx={{ flex: 1, color }}
                    />
                    <Typography variant="body2" sx={{ width: 50, textAlign: 'right', color: 'text.secondary' }}>
                      {layerOpacity[layer]}%
                    </Typography>
                  </Box>
                );
              })}
            </Stack>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

function ExpandMoreIcon({ expanded }: { expanded: boolean }) {
  return (
    <span style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', display: 'inline-block' }}>
      ▼
    </span>
  );
}

export default DataLayers;