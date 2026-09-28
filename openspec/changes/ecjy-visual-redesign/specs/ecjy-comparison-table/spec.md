# ecjy-comparison-table Specification

## Purpose

Replaces DataTable (used twice: RETENCION pendientes + PLATAFORMA pendientes). Core comparison instrument with 3 density modes, virtualized scrolling >1000 rows, inline match indicators, and ECJY token styling.

## Requirements

### Requirement: Dual Table Replacement

The system SHALL replace both DataTable instances with single ComparisonTable component configurable via `source: 'retencion' | 'plataforma'`. Maintains selection API compatibility.

#### Scenario: RETENCION table

- GIVEN ComparisonTable with source='retencion'
- WHEN rendered
- THEN shows RETENCION pendientes columns: CUIT, Monto, Período
- AND selection checkboxes functional
- AND header shows "RETENCION Pendientes" with count chip

#### Scenario: PLATAFORMA table

- GIVEN ComparisonTable with source='plataforma'
- WHEN rendered
- THEN shows PLATAFORMA pendientes columns: CUIT, Monto, Período
- AND selection works independently

### Requirement: Three Density Modes

The system SHALL support density modes: comfortable (24px row, 16px padding), compact (18px row, 12px padding), dense (14px row, 8px padding). Mode controlled by global `useDensity` hook.

#### Scenario: Density switch

- GIVEN table in comfortable mode showing 15 rows
- WHEN density changes to compact
- THEN row height 18px, shows 20 rows
- AND column headers compact accordingly

### Requirement: Virtualized Scrolling

The system SHALL use @tanstack/react-virtual for >1000 rows. Renders only visible rows + 5 buffer. Maintains sticky header.

#### Scenario: Large dataset

- GIVEN 5000 records
- WHEN table renders
- THEN initial render < 100ms
- AND scroll 60fps
- AND DOM nodes ~30 rows max

### Requirement: Match Status Column

The system SHALL add "Estado" column showing match status: "Sin cruce" (gray), "Coincide" (precision green), "Diferencia" (detection amber), "Confirmado" (order green). Derived from matches prop.

#### Scenario: Status display

- GIVEN record has confirmed match
- WHEN row renders
- THEN Estado shows "Confirmado" with order green chip
- AND row has subtle order green left border

### Requirement: Inline Amount Comparison

The system SHALL show both amounts when matched: RETENCION amount (precision color) and PLATAFORMA amount (order color) in same cell with mini diff indicator.

#### Scenario: Matched amount display

- GIVEN matched record: RET $10,000.00, PLAT $10,000.00
- WHEN row renders
- THEN shows "$10,000.00 ≡ $10,000.00" with green equivalence
- AND diff badge shows "0.00"

### Requirement: Selection API Compatibility

The system SHALL maintain `selectedIds: Set<string>` and `onToggleSelection(id)` props for backward compatibility with parent components.

#### Scenario: Selection callback

- GIVEN parent passes selectedIds and onToggleSelection
- WHEN user clicks checkbox
- THEN onToggleSelection called with record ID
- AND selectedIds updated in parent

## Data Models

```typescript
interface ComparisonTableProps {
  source: 'retencion' | 'plataforma';
  data: Ingreso[];
  matches: MatchResult[];
  confirmedMatches: CruceOk[];
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
  density: 'comfortable' | 'compact' | 'dense';
}
```

## UI/UX References

- Tokens: `color.precision/order/detection/neutral`, `spacing`, `elevation.level1`, `typography.body2`
- Replaces: DataTable.tsx (both usages)
- Density: `useDensity` hook
- Virtualization: @tanstack/react-virtual