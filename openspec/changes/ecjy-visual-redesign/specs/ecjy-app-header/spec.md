# ecjy-app-header Specification

## Purpose

Replaces Header. Integrates HeroOpening narrative on first load, displays ECJY branding with StateIndicators, provides density mode selector, and global actions. Sticky positioned control bar.

## Requirements

### Requirement: Hero Narrative Integration

The system SHALL render HeroOpening on initial app load (first visit or after data reset). After HeroOpening completes, transitions to compact header with ECJY logo + StateIndicators.

#### Scenario: First load hero

- GIVEN user opens app with no data
- WHEN app initializes
- THEN HeroOpening plays ARCA→SISTEMA→CONTROL→DIFERENCIAS
- AND onComplete header shows compact ECJY brand + indicators

#### Scenario: Subsequent loads

- GIVEN user returns with existing data
- WHEN app loads
- THEN HeroOpening skipped
- AND compact header shown immediately

### Requirement: ECJY Branding

The system SHALL display "ECJY" logomark with tagline "Control Instrumental". Uses precision color for "ECJY", order color for tagline. Click navigates to dashboard top.

#### Scenario: Brand rendering

- GIVEN header in compact mode
- WHEN rendered
- THEN shows "ECJY" in precision blue
- AND "Control Instrumental" in order green
- AND click scrolls to top

### Requirement: StateIndicators Integration

The system SHALL embed StateIndicators in compact horizontal mode showing all 5 ECJY metrics. Updates real-time as data changes.

#### Scenario: Indicators display

- GIVEN header compact mode
- WHEN metrics available
- THEN 5 badges shown: Precision, Control, Detection, Order, Security
- AND values update without layout shift

### Requirement: Density Mode Selector

The system SHALL provide 3-mode density selector: Comfortable / Compact / Dense. Persists to localStorage. Affects all comparison tables, grids, and DataLayers.

#### Scenario: Density selector

- GIVEN user clicks density dropdown
- WHEN selects "Compact"
- THEN `useDensity` context updates
- AND all tables re-render at compact density
- AND preference saved to localStorage

### Requirement: Global Actions

The system SHALL provide: Theme toggle (dark/light), Export current view, Help/Keyboard shortcuts modal, User menu (future). Actions in consistent right-aligned group.

#### Scenario: Theme toggle

- GIVEN dark mode active
- WHEN user clicks theme icon
- THEN switches to light mode
- AND all token colors update
- AND preference persisted

## Data Models

```typescript
interface AppHeaderProps {
  metrics: ECJYMetrics;
  density: 'comfortable' | 'compact' | 'dense';
  onDensityChange: (density: DensityMode) => void;
  onThemeToggle: () => void;
  onExport: () => void;
  showHero: boolean;
  onHeroComplete: () => void;
}
```

## UI/UX References

- Tokens: `color.precision/order`, `elevation.level2`, `spacing`, `motion.duration.fast`
- Replaces: Header.tsx
- HeroOpening integration
- StateIndicators (compact mode)
- Sticky: `position: sticky; top: 0; z-index: 1100`