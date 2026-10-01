/**
 * StateIndicators Component
 * Five ECJY value badges: Precision, Control, Detection, Order, Security
 * Compact (icon+value) and expanded (icon+label+value+trend) modes
 * Count-up animation (800ms), threshold alerts
 */

import { useEffect, useRef, useMemo, useState } from 'react';
import { Box, Tooltip, Typography } from '@mui/material';
import { 
  CheckCircle, 
  Shield, 
  Search, 
  CheckCircleOutline, 
  Lock,
  Warning,
  Error,
  TrendingUp,
  TrendingDown,
  Remove
} from '@mui/icons-material';
import { useECJYTokens } from '../theme/ECJYThemeProvider';
import { useFeatureFlagEnabled } from '../hooks/useFeatureFlag';
import { DesignTokens, tokens } from '../design-tokens/tokens';

export interface ECJYMetrics {
  precision: { value: number; previous: number; threshold: number };
  control: { value: number; previous: number };
  detection: { value: number; previous: number; threshold: number };
  order: { value: number; previous: number };
  security: { value: number; previous: number; threshold: number };
}

interface StateIndicatorsProps {
  metrics: ECJYMetrics;
  compact?: boolean;
}

interface BadgeConfig {
  key: 'precision' | 'control' | 'detection' | 'order' | 'security';
  label: string;
  icon: React.ElementType;
  alertIcon: React.ElementType;
  colorToken: keyof typeof tokens.colors.semantic;
  format: (v: number) => string;
  threshold: number;
  thresholdType: 'below' | 'above' | 'none';
}

const BADGE_CONFIG: BadgeConfig[] = [
  {
    key: 'precision',
    label: 'Precisión',
    icon: CheckCircle,
    alertIcon: Warning,
    colorToken: 'precision',
    format: (v: number) => `${v.toFixed(1)}%`,
    threshold: 95,
    thresholdType: 'below',
  },
  {
    key: 'control',
    label: 'Control',
    icon: Shield,
    alertIcon: Warning,
    colorToken: 'control',
    format: (v: number) => v.toLocaleString(),
    threshold: 0,
    thresholdType: 'none',
  },
  {
    key: 'detection',
    label: 'Detección',
    icon: Search,
    alertIcon: Warning,
    colorToken: 'detection',
    format: (v: number) => v.toLocaleString(),
    threshold: 50,
    thresholdType: 'above',
  },
  {
    key: 'order',
    label: 'Orden',
    icon: CheckCircleOutline,
    alertIcon: Warning,
    colorToken: 'order',
    format: (v: number) => `${v.toFixed(1)}%`,
    threshold: 0,
    thresholdType: 'none',
  },
  {
    key: 'security',
    label: 'Seguridad',
    icon: Lock,
    alertIcon: Error,
    colorToken: 'security',
    format: (v: number) => v.toLocaleString(),
    threshold: 0,
    thresholdType: 'above',
  },
];

interface BadgeData extends BadgeConfig {
  value: number;
  previous: number;
  delta: number;
  isAlert: boolean;
  trendIcon: React.ElementType;
  trendLabel: string;
}

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

interface CountUpValueProps {
  value: number;
  format: (v: number) => string;
  color: string;
  fontSize?: string;
  fontWeight?: number;
  tokens: DesignTokens;
}

function CountUpValue({ 
  value, 
  format, 
  color, 
  fontSize = '1.25rem',
  fontWeight = 700,
  tokens,
}: CountUpValueProps) {
  const animatedValue = useCountUpAnimation(value);

  return (
    <Typography
      variant="h6"
      component="span"
      style={{
        fontFamily: tokens.typography.fontFamilies.display,
        fontWeight,
        fontSize,
        color,
        lineHeight: tokens.typography.lineHeights.tight,
      }}
    >
      {format(animatedValue)}
    </Typography>
  );
}

function getColorForToken(tokens: DesignTokens, colorToken: keyof typeof tokens.colors.semantic, isAlert: boolean) {
  if (isAlert) {
    return tokens.colors.semantic.detection.base;
  }
  return tokens.colors.semantic[colorToken]?.base || tokens.colors.text.primary;
}

function getBgColorForToken(tokens: DesignTokens, colorToken: keyof typeof tokens.colors.semantic, isAlert: boolean) {
  if (isAlert) {
    return tokens.colors.semantic.detection.subtle;
  }
  return tokens.colors.semantic[colorToken]?.subtle || tokens.colors.surface.panel;
}

export function StateIndicators({ metrics, compact = false }: StateIndicatorsProps) {
  const { tokens } = useECJYTokens();
  const indicatorsEnabled = useFeatureFlagEnabled('STATE_INDICATORS');

  if (!indicatorsEnabled) {
    return null;
  }

  const badgeData = useMemo<BadgeData[]>(() => {
    const data = {
      precision: metrics.precision,
      control: metrics.control,
      detection: metrics.detection,
      order: metrics.order,
      security: metrics.security,
    };

    return BADGE_CONFIG.map(config => {
      const metric = data[config.key];
      const delta = metric.value - metric.previous;
      const isAlert = config.thresholdType === 'below' 
        ? metric.value < config.threshold
        : config.thresholdType === 'above'
          ? metric.value > config.threshold
          : false;

      return {
        ...config,
        value: metric.value,
        previous: metric.previous,
        delta,
        isAlert,
        trendIcon: getTrendIcon(delta),
        trendLabel: getTrendLabel(delta),
      };
    });
  }, [metrics]);

  const CompactBadge = ({ 
    badge,
  }: { 
    badge: BadgeData;
  }) => {
    const color = getColorForToken(tokens, badge.colorToken, badge.isAlert);
    const bgColor = getBgColorForToken(tokens, badge.colorToken, badge.isAlert);

    const Icon = badge.icon;
    const AlertIcon = badge.alertIcon;

    return (
      <Tooltip
        title={`${badge.label}: ${badge.format(badge.value)}${badge.threshold ? ` (umbral: ${badge.thresholdType === 'below' ? '<' : '>'}${badge.threshold})` : ''}`}
        arrow
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 1.5,
            py: 0.5,
            borderRadius: 2,
            bgcolor: bgColor,
            border: badge.isAlert ? `2px solid ${color}` : 'none',
            minWidth: 80,
            justifyContent: 'center',
            transition: 'all 0.2s ease',
          }}
        >
          <Icon
            style={{ 
              color, 
              fontSize: 20,
              marginRight: tokens.spacing[1],
            }}
          />
          <CountUpValue
            value={badge.value}
            format={badge.format}
            color={color}
            fontSize="0.875rem"
            fontWeight={600}
            tokens={tokens}
          />
          {badge.isAlert && (
            <AlertIcon style={{ color, fontSize: 16 }} />
          )}
        </Box>
      </Tooltip>
    );
  };

  const ExpandedBadge = ({ 
    badge,
  }: { 
    badge: BadgeData;
  }) => {
    const color = getColorForToken(tokens, badge.colorToken, badge.isAlert);
    const bgColor = getBgColorForToken(tokens, badge.colorToken, badge.isAlert);

    const Icon = badge.icon;
    const AlertIcon = badge.alertIcon;

    return (
      <Tooltip
        title={`${badge.label}: ${badge.format(badge.value)} (anterior: ${badge.format(badge.previous)})${badge.threshold ? ` | Umbral: ${badge.thresholdType === 'below' ? '<' : '>'}${badge.threshold}` : ''}`}
        arrow
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1,
            px: 2,
            py: 2,
            borderRadius: 2,
            bgcolor: bgColor,
            border: badge.isAlert ? `2px solid ${color}` : `1px solid ${tokens.colors.surface.border}`,
            minWidth: 120,
            textAlign: 'center',
            transition: 'all 0.2s ease',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Icon
              style={{ 
                color, 
                fontSize: 24,
              }}
            />
            {badge.isAlert && (
              <AlertIcon style={{ color, fontSize: 20 }} />
            )}
          </Box>
          <Typography
            variant="caption"
            style={{
              fontFamily: tokens.typography.fontFamilies.body,
              fontWeight: tokens.typography.fontWeights.medium,
              color: tokens.colors.text.secondary,
              textTransform: 'uppercase',
              letterSpacing: tokens.typography.letterSpacings.wide,
            }}
          >
            {badge.label}
          </Typography>
          <CountUpValue
            value={badge.value}
            format={badge.format}
            color={color}
            fontSize="1.5rem"
            fontWeight={700}
            tokens={tokens}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <badge.trendIcon
              style={{ 
                color: badge.delta > 0 ? tokens.colors.semantic.security.base : badge.delta < 0 ? tokens.colors.semantic.detection.base : tokens.colors.text.tertiary,
                fontSize: 16,
              }}
            />
            <Typography
              variant="caption"
              style={{
                fontFamily: tokens.typography.fontFamilies.mono,
                fontWeight: tokens.typography.fontWeights.medium,
                color: badge.delta > 0 ? tokens.colors.semantic.security.base : badge.delta < 0 ? tokens.colors.semantic.detection.base : tokens.colors.text.tertiary,
              }}
            >
              {badge.trendLabel}
            </Typography>
          </Box>
        </Box>
      </Tooltip>
    );
  };

  if (compact) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          flexWrap: 'wrap',
          px: 2,
          py: 1,
        }}
        role="region"
        aria-label="Indicadores de estado ECJY"
      >
        {badgeData.map(badge => (
          <CompactBadge
            key={badge.key}
            badge={badge}
          />
        ))}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 2,
        px: 2,
        py: 2,
      }}
      role="region"
      aria-label="Indicadores de estado ECJY"
    >
      {badgeData.map(badge => (
        <ExpandedBadge
          key={badge.key}
          badge={badge}
        />
      ))}
    </Box>
  );
}

export default StateIndicators;