# ecjy-data-layers Specification

## Purpose

Layered visualization showing data progression: Raw (all records) → Matched (paired) → Confirmed (validated). Three toggleable layers with opacity control. Density-aware rendering.

## Requirements

### Requirement: Three Layer Toggles

The system SHALL provide layer toggles: Raw (all RETENCION+PLATAFORMA), Matched (auto-matched pairs), Confirmed (user-validated). Each layer independent on/off with opacity slider (10%-100%).

#### Scenario: Layer toggle

- GIVEN all three layers enabled
- WHEN user disables Raw layer
- THEN only Matched and Confirmed layers visible
- AND Raw records hidden from view

#### Scenario: Opacity control

- GIVEN Matched layer at 100% opacity
- WHEN user sets opacity to 40%
- THEN matched records render at 40% opacity
- AND underlying Raw layer partially visible

### Requirement: Layer Color Coding

The system SHALL assign distinct colors per layer: Raw = neutral gray, Matched = precision blue, Confirmed = order green. Color derived from tokens.

#### Scenario: Layer colors

- GIVEN layers rendered
- THEN Raw records use `color.neutral.main`
- AND Matched records use `color.precision.main`
- AND Confirmed records use `color.order.main`

### Requirement: Density-Adaptive Rendering

The system SHALL adapt point/row representation by density: comfortable = full rows, compact = condensed rows, dense = data points (dots on timeline). Switches automatically at row count thresholds.

#### Scenario: Dense mode switch

- GIVEN 5000 records, comfortable mode
- WHEN user switches to dense
- THEN renders as scatter plot / timeline dots
- AND hover shows tooltip with full record details

### Requirement: Layer Statistics

The system SHALL display record count per layer in toggle labels: "Raw (12,450)", "Matched (1,247)", "Confirmed (1,180)". Updates in real-time as data changes.

#### Scenario: Count display

- GIVEN 12450 raw, 1247 matched, 1180 confirmed
- WHEN DataLayers renders
- THEN toggle labels show counts
- AND counts update when matches confirmed

## Data Models

```typescript
interface DataLayersProps {
  rawData: { retencion: Ingreso[]; plataforma: Ingreso[] };
  matchedData: MatchResult[];
  confirmedData: CruceOk[];
  density: 'comfortable' | 'compact' | 'dense';
  onLayerChange: (layers: LayerConfig) => void;
}

interface LayerConfig {
  raw: { enabled: boolean; opacity: number };
  matched: { enabled: boolean; opacity: number };
  confirmed: { enabled: boolean; opacity: number };
}
```

## UI/UX References

- Tokens: `color.precision/order/neutral`, `motion.duration.fast`, `elevation.level1`
- Control panel: collapsible sidebar (280px) with toggles + opacity sliders
- Dense mode: recharts ScatterChart or @visx timeline