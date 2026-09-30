import React, { useEffect, useRef, useMemo, useState } from 'react';
import { Box, Card, CardContent, Typography, Tooltip, IconButton, Grid } from '@mui/material';
import { TrendingUp, TrendingDown, Remove, Info } from '@mui/icons-material';
import { useECJYTokens } from '../theme/ECJYThemeProvider';
import { useFeatureFlagEnabled } from '../hooks/useFeatureFlag';
import { useGrid } from '../hooks/useGrid';
import { Stats } from '../types';

interface StatMetric {
  key: string;
  label: string;
  value: number;
  previous: number;
  colorToken: 'precision' | 'control' | 'detection' | 'order' | 'security';
  format: (v: number) => string;
  threshold?: { type: 'above' | 'below'; value: number; label: string };
}

interface ComputedMetric extends StatMetric {
  delta: number;
  isAlert: boolean;
  isImbalance: boolean;
  isThresholdAlert: boolean;
  trendIcon: React.ElementType;
  trendLabel: string;
  trendColor: string;
  color: string;
  bgColor: string;
  thresholdAlert?: string;
  imbalanceAlert?: string;
}

interface StatsDisplayProps {
  stats: Stats | null;
  loading: boolean;
  previousStats?: Stats | null;
}

const STAT_METRICS_CONFIG: Omit<StatMetric, 'value' | 'previous'>[] = [
  {
    key: 'ret_pendientes',
    label: 'RET Pendientes',
    colorToken: 'control',
    format: (v: number) => v.toLocaleString(),
    threshold: { type: 'above', value: 5000, label: 'Total pendientes > 5000' },
  },
  {
    key: 'plat_pendientes',
    label: 'PLAT Pendientes',
    colorToken: 'precision',
    format: (v: number) => v.toLocaleString(),
    threshold: { type: 'above', value: 5000, label: 'Total pendientes > 5000' },
  },
  {
    key: 'total_pendientes',
    label: 'Total Pendientes',
    colorToken: 'detection',
    format: (v: number) => v.toLocaleString(),
    threshold: { type: 'above', value: 5000, label: 'Total pendientes > 5000' },
  },
  {
    key: 'cruces_confirmados',
    label: 'Cruces Confirmados',
    colorToken: 'order',
    format: (v: number) => v.toLocaleString(),
  },
];

function getTrendIcon(delta: number) {
  if (delta > 0) return TrendingUp;
  if (delta < 0) return TrendingDown;
  return Remove;
}

function getTrendLabel(delta: number) {
  if (delta > 0) return `▲ +${delta.toFixed(1)}%`;
  if (delta < 0) return `▼ ${delta.toFixed(1)}%`;
  return '● Estable';
}

// Custom hook for count-up animation - must be called at top level in fixed order
function useCountUpAnimation(endValue: number, duration = 800) {
  const [displayValue, setDisplayValue] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const startTime = performance.now();
    startTimeRef.current = startTime;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing: decelerate (cubic-bezier(0, 0, 0.38, 1))
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      
      setDisplayValue(Math.floor(easedProgress * endValue));

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [endValue, duration]);

  return displayValue;
}

function StatCard({ 
  metric, 
  animatedValue,
  color, 
  bgColor, 
  isAlert, 
  trendIcon, 
  trendLabel, 
  trendColor,
  thresholdAlert,
  tokens,
}: {
  metric: StatMetric;
  animatedValue: number;
  color: string;
  bgColor: string;
  isAlert: boolean;
  trendIcon: React.ElementType;
  trendLabel: string;
  trendColor: string;
  thresholdAlert?: string;
  tokens: ReturnType<typeof useECJYTokens>['tokens'];
}) {
  return (
    <Tooltip
      title={`${metric.label}: ${metric.format(metric.value)}${metric.threshold ? ` (umbral: ${metric.threshold.type === 'below' ? '<' : '>'}${metric.threshold.value})` : ''}${thresholdAlert ? `\n${thresholdAlert}` : ''}`}
      arrow
    >
      <Card
        elevation={2}
        sx={{
          height: '100%',
          bgcolor: bgColor,
          border: isAlert ? `2px solid ${color}` : '1px solid',
          borderColor: isAlert ? color : 'surface.border',
          transition: 'all 0.2s ease',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {isAlert && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              bgcolor: color,
              zIndex: 1,
            }}
          />
        )}
        <CardContent sx={{ position: 'relative', zIndex: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              style={{
                fontFamily: 'Inter',
                fontWeight: 500,
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {metric.label}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {React.createElement(trendIcon, { 
                style: { 
                  color: trendColor, 
                  fontSize: 16,
                }
              })}
              <Typography
                variant="caption"
                style={{
                  fontFamily: 'JetBrains Mono',
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  color: trendColor,
                }}
              >
                {trendLabel}
              </Typography>
            </Box>
          </Box>
          <Typography
            variant="h6"
            component="span"
            style={{
              fontFamily: tokens.typography.fontFamilies.display,
              fontWeight: 700,
              fontSize: '1.75rem',
              color,
              lineHeight: tokens.typography.lineHeights.tight,
            }}
          >
            {metric.format(animatedValue)}
          </Typography>
          {thresholdAlert && (
            <Tooltip title={thresholdAlert} arrow>
              <IconButton size="small" style={{ mt: 1, color: 'text.tertiary' }}>
                <Info fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </CardContent>
      </Card>
    </Tooltip>
  );
}

export function StatsDisplay({ stats, loading, previousStats = null }: StatsDisplayProps) {
  const { tokens } = useECJYTokens();
  const statsEnabled = useFeatureFlagEnabled('STATS_DISPLAY');
  const { breakpoint } = useGrid();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Always compute metrics to keep hook order consistent
  const retPendientes = stats?.pend_retencion || 0;
  const platPendientes = stats?.pend_plataforma || 0;
  const totalPendientes = stats?.pend_totales || (retPendientes + platPendientes);
  const crucesConfirmados = stats?.ok_historicos || 0;

  const prevRetPendientes = previousStats?.pend_retencion || retPendientes;
  const prevPlatPendientes = previousStats?.pend_plataforma || platPendientes;
  const prevTotalPendientes = previousStats?.pend_totales || totalPendientes;
  const prevCrucesConfirmados = previousStats?.ok_historicos || crucesConfirmados;

  const currentValues = [retPendientes, platPendientes, totalPendientes, crucesConfirmados];
  const previousValues = [prevRetPendientes, prevPlatPendientes, prevTotalPendientes, prevCrucesConfirmados];

  // Always call the animation hooks in the same order (4 metrics = 4 hooks)
  const animatedValues = currentValues.map((value, index) => 
    useCountUpAnimation(value, 800)
  );

  // Compute all metric data upfront
  const computedMetrics = useMemo<ComputedMetric[]>(() => {
    return STAT_METRICS_CONFIG.map((config, index) => {
      const value = currentValues[index];
      const previous = previousValues[index];
      const delta = previous > 0 ? ((value - previous) / previous) * 100 : 0;
      
      // Check imbalance alert (>20% difference between RET and PLAT)
      const isImbalance = index === 2 && retPendientes > 0 && platPendientes > 0
        ? Math.abs(retPendientes - platPendientes) / Math.max(retPendientes, platPendientes) > 0.2
        : false;
      
      const isThresholdAlert = config.threshold 
        ? (config.threshold.type === 'above' ? value > config.threshold.value : value < config.threshold.value)
        : false;
      
      const isAlert = isThresholdAlert || isImbalance;

      const trendIcon = getTrendIcon(delta);
      const trendLabel = getTrendLabel(delta);
      const trendColor = delta > 0 ? tokens.colors.semantic.security.base 
        : delta < 0 ? tokens.colors.semantic.detection.base 
        : tokens.colors.text.tertiary;

      const colorToken = config.colorToken;
      const baseColor = tokens.colors.semantic[colorToken].base;
      const subtleColor = tokens.colors.semantic[colorToken].subtle;
      const alertColor = tokens.colors.semantic.detection.base;
      const alertSubtle = tokens.colors.semantic.detection.subtle;

      const color = isAlert ? alertColor : baseColor;
      const bgColor = isAlert ? alertSubtle : subtleColor;

      const thresholdAlert = isThresholdAlert ? config.threshold?.label : undefined;
      const imbalanceAlert = isImbalance ? 'Desbalance > 20% entre RET y PLAT' : undefined;

      return {
        ...config,
        value,
        previous,
        delta,
        isAlert,
        isImbalance,
        isThresholdAlert,
        trendIcon,
        trendLabel,
        trendColor,
        color,
        bgColor,
        thresholdAlert,
        imbalanceAlert,
      };
    });
  }, [currentValues, previousValues, retPendientes, platPendientes, tokens]);

  if (!statsEnabled) {
    return null;
  }

  if (!mounted || loading || !stats) {
    return (
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, mb: 3 }}>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} elevation={2}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Cargando...</Typography>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                <span style={{ color: 'text.disabled' }}>—</span>
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  }

  return (
    <Grid
      container
      spacing={2}
      sx={{ mb: 3 }}
    >
      {computedMetrics.map((metric, index) => (
        <Grid key={metric.key} item xs={12} sm={6} md={3}>
          <StatCard
            metric={metric}
            animatedValue={animatedValues[index]}
            color={metric.color}
            bgColor={metric.bgColor}
            isAlert={metric.isAlert}
            trendIcon={metric.trendIcon}
            trendLabel={metric.trendLabel}
            trendColor={metric.trendColor}
            thresholdAlert={metric.thresholdAlert || metric.imbalanceAlert}
            tokens={tokens}
          />
        </Grid>
      ))}
    </Grid>
  );
}

export default StatsDisplay;