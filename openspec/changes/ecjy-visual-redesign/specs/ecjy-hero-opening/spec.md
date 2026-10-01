# ecjy-hero-opening Specification

## Purpose

Animated narrative sequence on app load: ARCA → SISTEMA → CONTROL → DIFERENCIAS. Communicates the reconciliation journey through staged typography reveals. Completes in <2s. Accessible via reduced-motion preference.

## Requirements

### Requirement: Narrative Sequence Rendering

The system SHALL render four sequential text stages: "ARCA", "SISTEMA", "CONTROL", "DIFERENCIAS". Each stage fades in with 800ms duration, 200ms stagger between stages. Total sequence < 2s.

#### Scenario: Happy path narrative flow

- GIVEN app loads with HeroOpening mounted
- WHEN component renders
- THEN "ARCA" appears at 0ms
- AND "SISTEMA" appears at 200ms
- AND "CONTROL" appears at 400ms
- AND "DIFERENCIAS" appears at 600ms
- AND all four visible by 1400ms

#### Scenario: Reduced motion preference

- GIVEN user prefers reduced motion
- WHEN HeroOpening mounts
- THEN all four stages render immediately without animation
- AND total render time < 100ms

### Requirement: Visual Hierarchy

The system SHALL display stages with descending visual weight: "ARCA" largest (displayLarge), "SISTEMA" (displayMedium), "CONTROL" (displaySmall), "DIFERENCIAS" (headlineMedium). Each uses corresponding ECJY value color: precision, control, detection, order.

#### Scenario: Stage styling

- GIVEN narrative stages rendered
- WHEN "ARCA" displays
- THEN uses `color.precision.main` + `typography.displayLarge`
- WHEN "DIFERENCIAS" displays
- THEN uses `color.order.main` + `typography.headlineMedium`

### Requirement: Completion Callback

The system SHALL fire `onComplete` callback after final stage visible. Parent uses this to transition to main dashboard.

#### Scenario: Completion trigger

- GIVEN HeroOpening sequence running
- WHEN "DIFERENCIAS" becomes visible
- THEN `onComplete()` called once
- AND parent can unmount HeroOpening

### Requirement: Skip Interaction

The system SHALL allow user to skip animation via click/tap/keypress. Skip jumps immediately to final state and fires `onComplete`.

#### Scenario: User skip

- GIVEN animation in progress
- WHEN user clicks or presses any key
- THEN all stages render immediately
- AND `onComplete()` fires

## Data Models

```typescript
interface HeroOpeningProps {
  onComplete: () => void;
}
```

## UI/UX References

- Tokens: `motion.duration.hero`, `motion.easing.decelerate`, `color.precision/control/detection/order`
- Typography: displayLarge → displayMedium → displaySmall → headlineMedium
- Accessibility: respects `prefers-reduced-motion`, keyboard skippable