# ecjy-connection-lines Specification

## Purpose

SVG/Canvas lines linking matched records across side-by-side panels. Visualizes the "thread" connecting ARCA COMPROBANTES to PROCESSED records. Uses @visx for SVG rendering with Canvas fallback for 1000+ lines.

## Requirements

### Requirement: Matched Pair Connections

The system SHALL draw curved SVG paths between matched record rows in left and right panels. Path originates at right edge of left row, terminates at left edge of right row. Curve uses `motion.easing.decelerate` bezier.

#### Scenario: Single connection render

- GIVEN matched pair at row index 5 (left) and row index 5 (right)
- WHEN ConnectionLines renders
- THEN SVG path connects row centers
- AND path color = `color.precision.main`
- AND path stroke-width = 2px

#### Scenario: Connection hover highlight

- GIVEN user hovers a record row
- WHEN hover detected
- THEN corresponding connection line stroke-width = 3px
- AND line color brightens to `color.precision.hover`
- AND both connected rows highlight

### Requirement: Virtualized Rendering

The system SHALL only render connections for rows currently in viewport (+/- 5 buffer). Uses IntersectionObserver or scroll position calculation.

#### Scenario: Viewport culling

- GIVEN 5000 matched pairs, 50 visible
- WHEN user scrolls to row 100
- THEN only connections for rows 95-105 rendered
- AND DOM node count < 20 paths

### Requirement: Canvas Fallback

The system SHALL switch to Canvas rendering when connection count > 500. Canvas layer overlays SVG, draws same paths via `CanvasRenderingContext2D`.

#### Scenario: Canvas activation

- GIVEN 600 matched pairs visible
- WHEN ConnectionLines mounts
- THEN renders to `<canvas>` instead of SVG
- AND visual output identical to SVG

### Requirement: Animation on Mount

The system SHALL animate connection draw-in using stroke-dashoffset (SVG) or progressive path drawing (Canvas). Duration 400ms per line, staggered 20ms.

#### Scenario: Draw-in animation

- GIVEN connections rendered
- WHEN component mounts
- THEN lines draw from center outward
- AND all complete within 600ms

## Data Models

```typescript
interface ConnectionLinesProps {
  matches: MatchResult[];
  leftRowRefs: Map<string, HTMLTableRowElement>;
  rightRowRefs: Map<string, HTMLTableRowElement>;
  density: 'comfortable' | 'compact' | 'dense';
  hoveredPairId?: string;
}
```

## UI/UX References

- Tokens: `color.precision`, `motion.duration.normal`, `motion.easing.decelerate`
- @visx/shape for curves, @visx/responsive for container sizing
- Accessibility: ARIA live region announces "X connections rendered"