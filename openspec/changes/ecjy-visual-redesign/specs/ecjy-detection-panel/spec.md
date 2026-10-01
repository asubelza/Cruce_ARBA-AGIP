# ecjy-detection-panel Specification

## Purpose

Replaces AutoMatchPreview. Animated comparison view showing matched pairs with SVG connection lines, progressive reveal, and inline confirmation actions. Integrates ConnectionLines and StateIndicators.

## Requirements

### Requirement: Animated Match Reveal

The system SHALL animate matched pairs appearing in staggered sequence: each pair fades in + connection line draws in. Delay 80ms per pair, max 800ms total. Respects `prefers-reduced-motion`.

#### Scenario: Match reveal

- GIVEN 20 auto-matched pairs
- WHEN DetectionPanel mounts
- THEN pair 1 appears at 0ms + line draws
- AND pair 20 appears at 1520ms
- AND all complete < 2s

#### Scenario: Reduced motion

- GIVEN reduced motion preference
- WHEN panel mounts
- THEN all pairs render instantly
- AND connection lines render without animation

### Requirement: Side-by-Side Comparison Rows

The system SHALL render each match as dual-row: left RETENCION data (precision styling), right PLATAFORMA data (order styling). Connected by ConnectionLines. Amount diff highlighted.

#### Scenario: Dual row render

- GIVEN match: CUIT=30-12345678-9, RET=$1000.00, PLAT=$1000.00
- WHEN row renders
- THEN left shows CUIT + RET amount in precision blue
- AND right shows PLAT amount in order green
- AND connection line links them
- AND diff shows "0.00" with green check

### Requirement: Inline Confirm/Reject Actions

The system SHALL provide per-row actions: Confirm (check), Reject (x), Flag for review (flag). Bulk actions in header: Confirm All, Reject All, Export.

#### Scenario: Row confirm

- GIVEN match row displayed
- WHEN user clicks Confirm
- THEN row moves to confirmed staging
- AND connection line fades to order green
- AND StateIndicators precision updates

#### Scenario: Bulk confirm

- GIVEN 15 matches displayed
- WHEN user clicks "Confirm All"
- THEN all 15 confirmed
- AND panel shows empty state with success message

### Requirement: Filter Integration

The system SHALL share filter state with ComparisonEngine: CUIT, period, amount range, match quality (exact/near). Filter pills displayed above panel.

#### Scenario: Filter sync

- GIVEN user filters CUIT="30-12345678-9" in ComparisonEngine
- WHEN DetectionPanel renders
- THEN only matching pairs shown
- AND filter pill visible with remove action

### Requirement: Match Quality Badges

The system SHALL show quality badge per match: "EXACT" (precision green), "NEAR ±0.01" (detection amber), "MANUAL" (security purple). Badge clickable to open ValidationWorkspace for that pair.

#### Scenario: Quality badge

- GIVEN match with amount diff 0.005
- WHEN badge renders
- THEN shows "NEAR ±0.01" in amber
- AND click opens ValidationWorkspace pre-filtered to this CUIT

## Data Models

```typescript
interface DetectionPanelProps {
  matches: MatchResult[];
  onConfirm: (matches: MatchResult[]) => void;
  onReject: (matches: MatchResult[]) => void;
  onFlag: (match: MatchResult) => void;
  filters: ComparisonFilters;
  density: 'comfortable' | 'compact' | 'dense';
}
```

## UI/UX References

- Tokens: `color.precision/order/detection/security`, `motion.duration.normal`, `elevation.level2`
- Replaces: AutoMatchPreview.tsx
- ConnectionLines integration
- StateIndicators for precision metric
- Virtualized for >500 matches