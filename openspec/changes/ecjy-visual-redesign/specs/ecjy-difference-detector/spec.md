# ecjy-difference-detector Specification

## Purpose

Core visual component comparing ARCA COMPROBANTES (source records) vs PROCESSED (matched records). Side-by-side visualization showing what exists in ARBA but not in AGIP and vice versa. Foundation for all comparison views.

## Requirements

### Requirement: Dual Panel Layout

The system SHALL render two synchronized panels: left "ARCA COMPROBANTES" (RETENCION records), right "PROCESSED" (PLATAFORMA records). Panels share vertical scroll position.

#### Scenario: Dual panel render

- GIVEN retencionData and plataformaData provided
- WHEN DifferenceDetector mounts
- THEN left panel shows RETENCION records count
- AND right panel shows PLATAFORMA records count
- AND both panels scroll together

### Requirement: Record Matching Visualization

The system SHALL highlight matched pairs across panels using shared visual indicator (color + connection line via ConnectionLines). Unmatched records shown in muted state.

#### Scenario: Matched pair highlight

- GIVEN record exists in both datasets with same CUIT+monto
- WHEN rendered
- THEN left record shows precision color accent
- AND right record shows precision color accent
- AND ConnectionLines draws link between them

#### Scenario: Unmatched record display

- GIVEN record exists only in RETENCION
- WHEN rendered
- THEN left record shows detection color (amber)
- AND right panel shows placeholder row at same vertical position

### Requirement: Density Modes

The system SHALL support 3 density modes: comfortable (24px row height), compact (18px), dense (14px). Density controlled via global `useDensity` hook.

#### Scenario: Density mode change

- GIVEN detector in comfortable mode
- WHEN user switches to compact
- THEN row height reduces to 18px
- AND visible row count increases proportionally

### Requirement: Filter Synchronization

The system SHALL apply filters (CUIT search, period range, amount range) to both panels simultaneously. Filter state shared with ComparisonEngine.

#### Scenario: Filter application

- GIVEN user enters CUIT "30-12345678-9"
- WHEN filter applied
- THEN both panels show only matching CUIT rows
- AND non-matching rows hidden in both panels

## Data Models

```typescript
interface DifferenceDetectorProps {
  retencionData: Ingreso[];
  plataformaData: Ingreso[];
  matches: MatchResult[];
  density: 'comfortable' | 'compact' | 'dense';
  filters: ComparisonFilters;
}
```

## UI/UX References

- Tokens: `color.precision`, `color.detection`, `spacing`, `elevation.level2`
- ConnectionLines integration for matched pairs
- Grid: 2 equal columns (6/12 each) at lg+, stacked at md-