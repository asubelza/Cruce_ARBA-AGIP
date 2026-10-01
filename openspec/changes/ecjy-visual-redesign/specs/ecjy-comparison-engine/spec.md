# ecjy-comparison-engine Specification

## Purpose

Animated side-by-side comparison with progressive reveal and multi-dimensional filters. Drives the core comparison workflow: filter → reveal → inspect → confirm. Orchestrates DifferenceDetector, ConnectionLines, and StateIndicators.

## Requirements

### Requirement: Progressive Reveal Animation

The system SHALL animate record appearance in staggered waves: matched pairs first (precision green), then unmatched ARCA (detection amber), then unmatched PROCESSED (security purple). Wave delay 100ms per record, max 500ms total.

#### Scenario: Progressive reveal

- GIVEN comparison data loaded
- WHEN engine starts
- THEN matched records fade in at 0-200ms
- AND ARCA-only records fade in at 200-400ms
- AND PLATAFORMA-only records fade in at 400-500ms

#### Scenario: Reveal cancellation

- GIVEN reveal in progress
- WHEN new filter applied
- THEN current reveal cancels
- AND new reveal starts with filtered data

### Requirement: Multi-Dimensional Filters

The system SHALL provide filter controls for: CUIT (exact/partial), Period (range picker), Amount (range ± tolerance), Match Status (matched/unmatched/both). Filters combine with AND logic.

#### Scenario: Combined filter

- GIVEN user sets CUIT="30-*" AND period="2024-01".."2024-12" AND amount±0.01
- WHEN filters applied
- THEN only records matching ALL criteria shown
- AND filter pill bar displays active filters with remove actions

### Requirement: Filter Persistence

The system SHALL persist filter state to URL query params and localStorage. Restored on page reload.

#### Scenario: Filter restoration

- GIVEN user filtered CUIT="30-12345678-9"
- WHEN user reloads page
- THEN filter reapplied automatically
- AND URL contains `?cuit=30-12345678-9`

### Requirement: Export Filtered View

The system SHALL export current filtered comparison to CSV/Excel with columns: Source, CUIT, Amount, Period, Match Status, Matched Pair ID.

#### Scenario: Export action

- GIVEN filtered view showing 42 records
- WHEN user clicks Export
- THEN CSV downloads with 42 rows + header
- AND filename includes timestamp and filter summary

## Data Models

```typescript
interface ComparisonEngineProps {
  retencionData: Ingreso[];
  plataformaData: Ingreso[];
  matches: MatchResult[];
  onFilterChange: (filters: ComparisonFilters) => void;
  onExport: (data: ExportRow[]) => void;
}

interface ComparisonFilters {
  cuit?: string;
  periodRange?: [string, string];
  amountRange?: [number, number];
  tolerance?: number;
  matchStatus?: 'matched' | 'unmatched' | 'both';
}
```

## UI/UX References

- Tokens: `motion.duration.normal`, `motion.easing.standard`, `color.precision/detection/security`
- Filter bar: sticky top, collapsible on mobile
- Density: inherits from `useDensity` hook