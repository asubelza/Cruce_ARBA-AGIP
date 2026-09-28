# ecjy-validation-workspace Specification

## Purpose

Manual cartesian match verification surface replacing StagingTable. Keyboard-first workflow for reviewing, confirming, or rejecting auto-matched pairs and creating manual matches. Precision instrument for data quality control.

## Requirements

### Requirement: Cartesian Grid View

The system SHALL render cartesian product of unmatched RETENCION × unmatched PLATAFORMA records as searchable, sortable grid. Each cell represents potential match pair.

#### Scenario: Grid render

- GIVEN 50 unmatched RET, 45 unmatched PLAT
- WHEN ValidationWorkspace mounts
- THEN grid shows 2,250 potential pairs
- AND virtualized rendering (50 rows visible)

### Requirement: Keyboard-First Navigation

The system SHALL support full keyboard workflow: Arrow keys navigate cells, Enter confirms match, Escape rejects, Space toggles selection, Ctrl+Enter bulk confirms selected.

#### Scenario: Keyboard confirmation

- GIVEN user navigates to cell (row 3, col 7)
- WHEN user presses Enter
- THEN pair added to confirmed staging
- AND cell marked with check icon
- AND focus moves to next logical cell

#### Scenario: Bulk confirm

- GIVEN user selected 10 cells via Space+Arrows
- WHEN user presses Ctrl+Enter
- THEN all 10 pairs confirmed
- AND staging updates with 10 new items

### Requirement: Match Scoring

The system SHALL compute and display match score per pair: CUIT exact (40%), Amount ±0.01 (35%), Period match (15%), Razón Social similarity (10%). Score shown as 0-100 badge.

#### Scenario: Score display

- GIVEN pair: CUIT exact, amount diff 0.005, period match, RS 90% similar
- WHEN cell renders
- THEN score badge shows 95 (precision green)
- AND tooltip breaks down component scores

### Requirement: Filter & Search

The system SHALL filter grid by: CUIT search (both sides), Amount range, Period range, Score threshold. Filters reduce cartesian product dynamically.

#### Scenario: Score threshold filter

- GIVEN grid showing all scores
- WHEN user sets minimum score = 80
- THEN only pairs scoring ≥80 displayed
- AND grid dimensions update accordingly

### Requirement: Staging Integration

The system SHALL push confirmed pairs to staging area (ecjy-staging-store). Staging shows confirmed count, allows review before final commit to backend.

#### Scenario: Staging push

- GIVEN user confirms 5 pairs
- WHEN confirmations complete
- THEN staging count increases by 5
- AND "Commit to Backend" button enables

## Data Models

```typescript
interface ValidationWorkspaceProps {
  unmatchedRetencion: Ingreso[];
  unmatchedPlataforma: Ingreso[];
  onConfirmMatch: (retId: string, platId: string, score: number) => void;
  onBulkConfirm: (pairs: {retId: string; platId: string; score: number}[]) => void;
}

interface MatchScore {
  total: number;
  cuit: number;
  amount: number;
  period: number;
  razonSocial: number;
}
```

## UI/UX References

- Tokens: `color.precision/detection/order`, `spacing`, `elevation.level2`, `motion.duration.fast`
- Grid: @tanstack/react-virtual for 10000+ cells
- Keyboard: roving tabindex, ARIA grid role
- Density: inherits from `useDensity` (affects row height)