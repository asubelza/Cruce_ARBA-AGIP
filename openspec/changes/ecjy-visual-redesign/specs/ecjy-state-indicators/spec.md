# ecjy-state-indicators Specification

## Purpose

Five ECJY value badges displaying real-time status: Precision, Control, Detection, Order, Security. Each badge shows icon, label, and quantitative metric. Located in app header and comparison views.

## Requirements

### Requirement: Five Value Badges

The system SHALL render five badges with fixed order: Precision (blue), Control (teal), Detection (amber), Order (green), Security (purple). Each badge: icon + label + metric value + trend indicator.

#### Scenario: Badge render

- GIVEN stats: precision=98.5%, control=1247, detection=23, order=99.2%, security=0
- WHEN StateIndicators renders
- THEN Precision badge shows "98.5%" with check icon
- AND Control badge shows "1,247" with shield icon
- AND Detection badge shows "23" with search icon
- AND Order badge shows "99.2%" with check-circle icon
- AND Security badge shows "0" with lock icon

### Requirement: Metric Definitions

The system SHALL compute metrics from data:
- Precision: (confirmed matches / total matches) × 100
- Control: total records processed this session
- Detection: unmatched records requiring review
- Order: (matched pairs / total possible pairs) × 100
- Security: failed validations / anomalies detected

#### Scenario: Precision calculation

- GIVEN 150 confirmed matches, 152 total matches
- WHEN metrics computed
- THEN Precision = (150/152)×100 = 98.68%

### Requirement: Trend Indicators

The system SHALL show trend vs previous session: ▲ improving, ▼ declining, ● stable. Tooltip shows previous value and delta.

#### Scenario: Trend display

- GIVEN previous precision 97.2%, current 98.5%
- WHEN badges render
- THEN Precision shows ▲ +1.3%
- AND tooltip shows "Prev: 97.2%"

### Requirement: Threshold Alerts

The system SHALL apply semantic color shifts when metrics cross thresholds:
- Precision < 95% → warning (amber)
- Detection > 50 → warning (amber)
- Security > 0 → critical (error red)

#### Scenario: Threshold breach

- GIVEN precision drops to 94%
- WHEN badges update
- THEN Precision badge background shifts to amber
- AND icon changes to warning triangle

### Requirement: Compact Mode

The system SHALL support compact horizontal layout (icon + value only) for header integration, and expanded vertical layout (icon + label + value + trend) for dashboard.

#### Scenario: Compact layout

- GIVEN StateIndicators in header
- WHEN compact={true}
- THEN renders single-row flex with 5 badges
- AND each badge: icon + value only

## Data Models

```typescript
interface ECJYMetrics {
  precision: { value: number; previous: number; threshold: 95 };
  control: { value: number; previous: number };
  detection: { value: number; previous: number; threshold: 50 };
  order: { value: number; previous: number };
  security: { value: number; previous: number; threshold: 0 };
}

interface StateIndicatorsProps {
  metrics: ECJYMetrics;
  compact?: boolean;
}
```

## UI/UX References

- Tokens: `color.precision/control/detection/order/security`, `elevation.level1`, `spacing.sm`
- Icons: Precision=CheckCircle, Control=Shield, Detection=Search, Order=CheckCircleOutline, Security=Lock
- Animation: value count-up on mount (800ms)