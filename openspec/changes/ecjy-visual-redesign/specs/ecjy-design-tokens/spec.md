# ecjy-design-tokens Specification

## Purpose

Unified token system providing semantic colors, motion curves, spacing scale, elevation levels, and CSS Grid definitions. All visual values derive from tokens — no hardcoded colors, spacing, or timing in components.

## Requirements

### Requirement: Semantic Color Tokens

The system SHALL define semantic color roles mapped to ECJY brand values: precision (blue), control (teal), detection (amber), order (green), security (purple). Each role provides light/dark variants, on-color, and state variants (hover, active, disabled).

#### Scenario: Color token resolution

- GIVEN token definitions loaded
- WHEN component requests `color.precision.main`
- THEN returns `#0095f6` (light) or `#4da8ff` (dark)
- AND `color.precision.onMain` returns contrast-compliant white/black

#### Scenario: State variant resolution

- GIVEN token `color.detection.main` = `#f59e0b`
- WHEN component requests hover variant
- THEN returns `color.detection.hover` = `#d97706` (10% darker)

### Requirement: Motion Curve Tokens

The system SHALL define 4 standard easing curves: `standard` (cubic-bezier(0.4, 0, 0.2, 1)), `decelerate` (cubic-bezier(0, 0, 0.2, 1)), `accelerate` (cubic-bezier(0.4, 0, 1, 1)), `sharp` (cubic-bezier(0.4, 0, 0.6, 1)). Durations: `instant` (0ms), `fast` (150ms), `normal` (250ms), `slow` (350ms), `hero` (800ms).

#### Scenario: Motion token consumption

- GIVEN component needs entrance animation
- WHEN using `motion.duration.hero` + `motion.easing.decelerate`
- THEN animation runs 800ms with decelerate curve

### Requirement: Spacing Scale Tokens

The system SHALL define 8-step spacing scale: `0` (0), `xs` (4px), `sm` (8px), `md` (16px), `lg` (24px), `xl` (32px), `xxl` (48px), `xxxl` (64px). All component padding, margins, gaps derive from this scale.

#### Scenario: Spacing token usage

- GIVEN component needs card padding
- WHEN using `spacing.lg`
- THEN renders 24px padding consistently

### Requirement: Elevation Tokens

The system SHALL define 5 elevation levels with box-shadow values: `level0` (none), `level1` (0 1px 3px rgba(0,0,0,0.12)), `level2` (0 4px 6px rgba(0,0,0,0.16)), `level3` (0 10px 15px rgba(0,0,0,0.2)), `level4` (0 20px 25px rgba(0,0,0,0.25)).

#### Scenario: Elevation token application

- GIVEN Card component at elevation level 2
- WHEN rendered
- THEN box-shadow matches `elevation.level2`

### Requirement: Grid System Tokens

The system SHALL define 12-column fluid grid with: `columns` (12), `gutter` (spacing.md = 16px), `margin` (spacing.lg = 24px), `breakpoints` (xs:0, sm:600, md:900, lg:1200, xl:1536). Grid utilities exposed via CSS variables and `useGrid` hook.

#### Scenario: Grid token resolution

- GIVEN container at lg breakpoint
- WHEN using `grid.columns` + `grid.gutter`
- THEN 12 columns with 16px gutters

### Requirement: MUI Theme Integration

The system SHALL integrate tokens into MUI theme via `createTheme` with `palette` (semantic colors), `shape.borderRadius` (4px), `transitions` (motion curves), `shadows` (elevation levels), `spacing` (scale function). CSS variables emitted to `:root` for non-MUI consumers.

#### Scenario: Theme token propagation

- GIVEN ThemeProvider with token-driven theme
- WHEN Button uses `color="precision"`
- THEN Button renders with precision token colors

## Data Models

### Token Structure (frontend state)

```typescript
interface DesignTokens {
  color: ColorTokens;
  motion: MotionTokens;
  spacing: SpacingTokens;
  elevation: ElevationTokens;
  grid: GridTokens;
}
```

## UI/UX References

- Color palette: ECJY brand values → precision/control/detection/order/security
- Motion: Hero narrative (800ms), micro-interactions (150-250ms)
- Grid: 12-col fluid, 3 density modes (comfortable/compact/dense)