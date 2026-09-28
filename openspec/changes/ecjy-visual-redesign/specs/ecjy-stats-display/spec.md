# ecjy-stats-display Specification

## Purpose

Replaces StatsCards. Precision indicator dashboard showing 4 key metrics with ECJY semantic colors, trend indicators, and animated count-up. Integrates with StateIndicators for unified metric system.

## Requirements

### Requirement: Four Precision Metrics

The system SHALL display 4 metric cards: RETENCION Pendientes, PLATAFORMA Pendientes, Total Pendientes, Cruces Confirmados. Each with icon, label, animated value, trend, and ECJY color role.

#### Scenario: Metric cards render

- GIVEN stats: ret=1247, plat=1180, total=2427, ok=1150
- WHEN StatsDisplay renders
- THEN Card 1: "RETENCION Pendientes" 1,247 (detection amber)
- AND Card 2: "PLATAFORMA Pendientes" 1,180 (detection amber)
- AND Card 3: "Total Pendientes" 2,427 (security purple)
- AND Card 4: "Cruces Confirmados" 1,150 (precision green)

### Requirement: Animated Count-Up

The system SHALL animate value from 0 to target on mount and on data change. Duration 800ms with `motion.easing.decelerate`. Respects `prefers-reduced-motion`.

#### Scenario: Count-up animation

- GIVEN previous total=2000, new total=2427
- WHEN stats update
- THEN value animates 2000 → 2427 over 800ms
- AND easing decelerates near target

### Requirement: Trend Indicators

The system SHALL show trend vs previous period: ▲ increase, ▼ decrease, ● stable. Tooltip shows previous value and % change.

#### Scenario: Trend display

- GIVEN previous confirmed=1100, current=1150
- WHEN card renders
- THEN shows ▲ +4.5%
- AND tooltip: "Anterior: 1,100 (+50)"

### Requirement: Threshold Alerts

The system SHALL apply alert styling when metrics exceed thresholds: Total Pendientes > 5000 → warning border, RETENCION/PLATAFORMA imbalance > 20% → detection highlight.

#### Scenario: Imbalance alert

- GIVEN RET=2000, PLAT=1000 (100% imbalance)
- WHEN cards render
- THEN both cards show amber left border
- AND tooltip: "Desequilibrio 100% — revisar carga"

### Requirement: Density-Responsive Grid

The system SHALL use CSS Grid: 1 col (xs), 2 col (sm), 4 col (md+). Gap from `spacing.md`. Cards equal height.

#### Scenario: Responsive grid

- GIVEN viewport 1200px
- WHEN rendered
- THEN 4 columns, equal height cards
- AND gap 16px

## Data Models

```typescript
interface StatsDisplayProps {
  stats: Stats;
  previousStats?: Stats;
  density: 'comfortable' | 'compact' | 'dense';
}

interface Stats {
  pend_retencion: number;
  pend_plataforma: number;
  pend_totales: number;
  ok_historicos: number;
}
```

## UI/UX References

- Tokens: `color.precision/detection/security`, `motion.duration.hero`, `motion.easing.decelerate`, `elevation.level1`, `spacing`
- Replaces: StatsCards.tsx
- Grid: 12-col fluid via `useGrid`
- Animation: framer-motion count-up
- Cards: elevation.level1, hover → elevation.level2