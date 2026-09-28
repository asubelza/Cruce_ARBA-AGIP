# Tasks: ECJY Visual System Redesign

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 2800-3500 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | 5 chained PRs (Phase 1→2→3→4→5) |
| Delivery strategy | auto-chain |
| Chain strategy | feature-branch-chain |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units (Chained PRs)

| Unit | Goal | Likely PR | Base Branch | Notes |
|------|------|-----------|-------------|-------|
| 1 | Tokens, hooks, fonts, deps, Dockerfile | PR 1 | `rediseño_aws` | Foundation; no UI changes |
| 2 | HeroOpening, DifferenceDetector, StateIndicators | PR 2 | PR 1 branch | Visual narrative + core detector |
| 3 | ComparisonEngine, ComparisonTable, ConnectionLines, DataLayers | PR 3 | PR 2 branch | Core comparison instrument |
| 4 | DetectionPanel, ValidationWorkspace | PR 4 | PR 3 branch | Detection + validation workflows |
| 5 | StatsDisplay, FileUpload, AppHeader, DensitySelector, a11y, cleanup | PR 5 | PR 4 branch | Chrome, polish, legacy removal |

---

## Phase 1: Tokens & Foundation (PR 1)

### 1.1 Extend Design Tokens
- [x] 1.1.1 Add `hero` duration (800ms) and `sharp` easing to `motion` tokens in `frontend/src/theme/tokens.ts`
- [x] 1.1.2 Add density row heights: comfortable=24, compact=18, dense=14 to tokens
- [x] 1.1.3 Export new token types for TypeScript consumers

### 1.2 Create Core Hooks
- [x] 1.2.1 Create `frontend/src/hooks/useDensity.ts` with localStorage persistence, CSS var `--ecjy-density-multiplier`, rowHeight/multiplier getters
- [x] 1.2.2 Create `frontend/src/hooks/useGrid.ts` returning colSpan(n), gutter, margin, breakpoint from tokens
- [x] 1.2.3 Create `frontend/src/hooks/useFeatureFlag.ts` checking `VITE_ECJY_<COMPONENT>` + localStorage override

### 1.3 Update ECJYThemeProvider
- [x] 1.3.1 Add feature flag helpers to context value in `frontend/src/theme/ECJYThemeProvider.tsx`
- [x] 1.3.2 Export `useFeatureFlag`, `useDensity` from provider context
- [x] 1.3.3 Wrap children with density context provider

### 1.4 Self-Host Fonts
- [x] 1.4.1 Download Space Grotesk, JetBrains Mono, Inter font files to `frontend/public/fonts/`
- [x] 1.4.2 Update `ECJYThemeProvider` to load fonts from local `/fonts/` instead of Google Fonts
- [x] 1.4.3 Add `@font-face` declarations in `frontend/src/index.css` with `font-display: swap`

### 1.5 Add Dependencies & Dockerfile
- [x] 1.5.1 Add to `frontend/package.json`: framer-motion@11, @visx/shape@3, @visx/responsive@3, @tanstack/react-virtual@3, canvas-confetti@1 (devDependency)
- [x] 1.5.2 Update `frontend/Dockerfile` multi-stage build for new deps cache optimization
- [x] 1.5.3 Run `npm install` and verify no peer dependency conflicts

### 1.6 Unit Tests — Foundation
- [x] 1.6.1 Test `useDensity` localStorage read/write, CSS var update, rowHeight mapping
- [x] 1.6.2 Test `useGrid` colSpan calculations at each breakpoint
- [x] 1.6.3 Test `useFeatureFlag` env + localStorage priority logic
- [x] 1.6.4 Test token resolution for new motion/density tokens

---

## Phase 2: Hero & Detector (PR 2)

### 2.1 HeroOpening Component
- [ ] 2.1.1 Create `frontend/src/components/HeroOpening.tsx` with framer-motion narrative sequence (ARCA→SISTEMA→CONTROL→DIFERENCIAS)
- [ ] 2.1.2 Implement 800ms duration, 200ms stagger, decelerate easing
- [ ] 2.1.3 Add skip interaction (click/keypress) and reduced-motion support
- [ ] 2.1.4 Fire `onComplete` callback after final stage
- [ ] 2.1.5 Add canvas-confetti burst on completion (optional per resolved question)

### 2.2 DifferenceDetector Component
- [ ] 2.2.1 Create `frontend/src/components/DifferenceDetector.tsx` dual panel layout (RETENCION | PLATAFORMA)
- [ ] 2.2.2 Implement synchronized scroll between panels
- [ ] 2.2.3 Add matched pair highlighting (precision color) + unmatched (detection amber)
- [ ] 2.2.4 Integrate density modes via `useDensity` hook (3 row heights)
- [ ] 2.2.5 Connect filter synchronization with ComparisonEngine

### 2.3 StateIndicators Component
- [ ] 2.3.1 Create `frontend/src/components/StateIndicators.tsx` with 5 badges (Precision, Control, Detection, Order, Security)
- [ ] 2.3.2 Implement compact (icon+value) and expanded (icon+label+value+trend) modes
- [ ] 2.3.3 Add count-up animation (800ms) on mount/update
- [ ] 2.3.4 Implement threshold alerts: Precision<95%→amber, Detection>50→amber, Security>0→red
- [ ] 2.3.5 Compute metrics from props: confirmed/total, processed count, unmatched count, match rate, anomalies

### 2.4 Feature Flags Integration
- [ ] 2.4.1 Wrap HeroOpening with `VITE_ECJY_HERO_OPENING` flag
- [ ] 2.4.2 Wrap DifferenceDetector with `VITE_ECJY_DIFFERENCE_DETECTOR` flag
- [ ] 2.4.3 Wrap StateIndicators with `VITE_ECJY_STATE_INDICATORS` flag
- [ ] 2.4.4 Add parallel render mode support (`VITE_ECJY_PARALLEL_RENDER`)

### 2.5 Unit & Integration Tests — Hero/Detector
- [ ] 2.5.1 Test HeroOpening sequence timing, skip, reduced-motion, onComplete callback
- [ ] 2.5.2 Test DifferenceDetector dual panel sync scroll, match highlighting, density switching
- [ ] 2.5.3 Test StateIndicators metric calculations, threshold colors, compact/expanded layouts
- [ ] 2.5.4 Integration: HeroOpening → AppHeader transition, filter sync DifferenceDetector↔ComparisonEngine

---

## Phase 3: Comparison Engine (PR 3)

### 3.1 ComparisonTable Component
- [ ] 3.1.1 Create `frontend/src/components/ComparisonTable.tsx` replacing DataTable (both usages)
- [ ] 3.1.2 Implement `source: 'retencion' | 'plataforma'` prop with correct columns
- [ ] 3.1.3 Add virtualized scrolling via @tanstack/react-virtual (>1000 rows, 5 buffer)
- [ ] 3.1.4 Implement 3 density modes (comfortable/compact/dense) via useDensity
- [ ] 3.1.5 Add "Estado" match status column: Sin cruce/Coincide/Diferencia/Confirmado
- [ ] 3.1.6 Add inline amount comparison for matched pairs (RET ≡ PLAT with diff badge)
- [ ] 3.1.7 Maintain Selection API compatibility (selectedIds Set, onToggleSelection)

### 3.2 ConnectionLines Component
- [ ] 3.2.1 Create `frontend/src/components/ConnectionLines.tsx` using @visx/shape + @visx/responsive
- [ ] 3.2.2 Draw curved SVG paths between matched row centers (left edge → right edge)
- [ ] 3.2.3 Implement hover highlight (stroke-width 3px, color brighten, row highlight)
- [ ] 3.2.4 Add viewport culling: only render visible rows ±5 buffer
- [ ] 3.2.5 Implement Canvas fallback when connection count > 500
- [ ] 3.2.6 Add draw-in animation (stroke-dashoffset SVG, progressive Canvas) 400ms staggered 20ms
- [ ] 3.2.7 Implement keyboard navigation: ←/→ navigate connections, ↑/↓ switch tables, Enter confirm
- [ ] 3.2.8 Add ARIA live region announcing "X connections rendered"

### 3.3 ComparisonEngine Orchestrator
- [ ] 3.3.1 Create `frontend/src/components/ComparisonEngine.tsx` as parent orchestrator
- [ ] 3.3.2 Implement progressive reveal: matched (0-200ms) → ARCA-only (200-400ms) → PLAT-only (400-500ms)
- [ ] 3.3.3 Add multi-dimensional filters: CUIT, period range, amount range ±tolerance, match status
- [ ] 3.3.4 Persist filter state to URL query params + localStorage
- [ ] 3.3.5 Add export filtered view to CSV (MVP; .xlsx follow-up)
- [ ] 3.3.6 Wire DifferenceDetector + 2×ComparisonTable + ConnectionLines + StateIndicators

### 3.4 DataLayers Component
- [ ] 3.4.1 Create `frontend/src/components/DataLayers.tsx` with 3 toggleable layers (Raw/Matched/Confirmed)
- [ ] 3.4.2 Implement opacity sliders (10-100%) per layer
- [ ] 3.4.3 Assign layer colors: Raw=neutral, Matched=precision, Confirmed=order
- [ ] 3.4.4 Add density-adaptive rendering: comfortable=rows, compact=condensed, dense=scatter plot (>5000 threshold)
- [ ] 3.4.5 Show live record counts in toggle labels

### 3.5 Unit & Integration Tests — Comparison Engine
- [ ] 3.5.1 Test ComparisonTable virtualization (5000 rows, DOM <30), density switching, match status, amount diff
- [ ] 3.5.2 Test ConnectionLines SVG render, hover, viewport culling, Canvas fallback >500, keyboard nav, ARIA
- [ ] 3.5.3 Test ComparisonEngine progressive reveal cancellation on filter change, filter persistence, CSV export
- [ ] 3.5.4 Test DataLayers layer toggles, opacity, density switch to scatter at 5000, count updates
- [ ] 3.5.5 Integration: ComparisonEngine filter → DifferenceDetector sync, ConnectionLines viewport culling

---

## Phase 4: Detection & Validation (PR 4)

### 4.1 DetectionPanel Component
- [ ] 4.1.1 Create `frontend/src/components/DetectionPanel.tsx` replacing AutoMatchPreview
- [ ] 4.1.2 Implement animated match reveal: staggered fade-in + connection line draw-in (80ms/pair, max 800ms)
- [ ] 4.1.3 Add side-by-side dual rows with ConnectionLines integration
- [ ] 4.1.4 Add inline Confirm/Reject/Flag actions per row + bulk Confirm All/Reject All/Export
- [ ] 4.1.5 Integrate filter pills from ComparisonEngine
- [ ] 4.1.6 Add match quality badges: EXACT (green), NEAR ±0.01 (amber), MANUAL (purple) → click opens ValidationWorkspace

### 4.2 ValidationWorkspace Component
- [ ] 4.2.1 Create `frontend/src/components/ValidationWorkspace.tsx` replacing StagingTable
- [ ] 4.2.2 Implement cartesian grid (unmatched RET × unmatched PLAT) virtualized via @tanstack/react-virtual
- [ ] 4.2.3 Add keyboard-first navigation: Arrow keys navigate cells, Enter confirm, Escape reject, Space toggle, Ctrl+Enter bulk
- [ ] 4.2.4 Implement match scoring: CUIT 40%, Amount 35%, Period 15%, RS 10% → 0-100 badge with tooltip breakdown
- [ ] 4.2.5 Add filters: CUIT search, amount range, period range, score threshold (dynamic cartesian reduction)
- [ ] 4.2.6 Push confirmed pairs to staging store; enable "Commit to Backend" button

### 4.3 Unit & Integration Tests — Detection/Validation
- [ ] 4.3.1 Test DetectionPanel animated reveal, reduced-motion, inline actions, quality badges, filter sync
- [ ] 4.3.2 Test ValidationWorkspace cartesian grid virtualization (10000+ cells), keyboard nav (roving tabindex, ARIA grid), match scoring breakdown
- [ ] 4.3.3 Test ValidationWorkspace filters reduce cartesian product, staging integration, bulk confirm
- [ ] 4.3.4 Integration: DetectionPanel quality badge click → ValidationWorkspace pre-filtered

---

## Phase 5: Chrome & Polish (PR 5)

### 5.1 StatsDisplay Component
- [ ] 5.1.1 Create `frontend/src/components/StatsDisplay.tsx` replacing StatsCards
- [ ] 5.1.2 Implement 4 metric cards: RET Pendientes, PLAT Pendientes, Total Pendientes, Cruces Confirmados
- [ ] 5.1.3 Add animated count-up (800ms decelerate) on mount and data change
- [ ] 5.1.4 Add trend indicators vs previous period (▲/▼/● with tooltip)
- [ ] 5.1.5 Implement threshold alerts: Total>5000 warning border, imbalance>20% amber highlight
- [ ] 5.1.6 Use CSS Grid responsive: 1 col xs, 2 col sm, 4 col md+ via useGrid

### 5.2 FileUpload Component (Modify)
- [ ] 5.2.1 Modify `frontend/src/components/FileUpload.tsx`: remove drag-drop, add click-to-select
- [ ] 5.2.2 Add 4-stage pipeline visualization: Subiendo → Detectando hojas → Procesando → Validando
- [ ] 5.2.3 Show sheet detection with RETIENCION typo handling
- [ ] 5.2.4 Display validation summary with counts + "Ver detalles" modal
- [ ] 5.2.5 Success state with animated counters + estimated matches + "Continuar" navigation

### 5.3 AppHeader Component
- [ ] 5.3.1 Create `frontend/src/components/AppHeader.tsx` replacing Header
- [ ] 5.3.2 Integrate HeroOpening on first load (showHero prop), compact header after completion
- [ ] 5.3.3 Embed StateIndicators compact mode + ECJY branding (precision "ECJY" + order tagline)
- [ ] 5.3.4 Add density mode selector (Comfortable/Compact/Dense) persisting to localStorage
- [ ] 5.3.5 Add global actions: theme toggle, export, help/shortcuts modal
- [ ] 5.3.6 Make sticky: position:sticky top:0 z-index:1100

### 5.4 Density Selector Component
- [ ] 5.4.1 Create reusable `DensitySelector` component (dropdown with 3 options)
- [ ] 5.4.2 Integrate with `useDensity` hook and localStorage persistence
- [ ] 5.4.3 Place in AppHeader and optionally in ComparisonEngine toolbar

### 5.5 Full Accessibility Audit
- [ ] 5.5.1 Run axe-core on all new components (HeroOpening, DifferenceDetector, ComparisonTable, ConnectionLines, DetectionPanel, ValidationWorkspace, StatsDisplay, FileUpload, AppHeader)
- [ ] 5.5.2 Verify keyboard navigation for all interactive elements (Tab order, Arrow keys, Enter/Space, Escape)
- [ ] 5.5.3 Test screen reader compatibility (NVDA/VoiceOver): ARIA roles, live regions, labels
- [ ] 5.5.4 Verify reduced-motion respected across all animations
- [ ] 5.5.5 Check color contrast ratios meet WCAG AA for all token colors

### 5.6 Visual Regression Baseline
- [ ] 5.6.1 Set up Storybook stories for all new components in all states/densities
- [ ] 5.6.2 Configure Chromatic (or local snapshot testing) for visual regression baseline
- [ ] 5.6.3 Capture baseline screenshots for each component at comfortable/compact/dense

### 5.7 Remove Legacy Components
- [ ] 5.7.1 Delete `frontend/src/components/DataTable.tsx`
- [ ] 5.7.2 Delete `frontend/src/components/AutoMatchPreview.tsx`
- [ ] 5.7.3 Delete `frontend/src/components/StagingTable.tsx`
- [ ] 5.7.4 Delete `frontend/src/components/Header.tsx`
- [ ] 5.7.5 Delete `frontend/src/components/StatsCards.tsx`
- [ ] 5.7.6 Update `frontend/src/App.tsx` to compose new tree: HeroOpening → AppHeader → StatsDisplay + FileUpload → ComparisonEngine → DetectionPanel/ValidationWorkspace
- [ ] 5.7.7 Update `frontend/src/index.css` with density CSS vars, grid utilities, scrollbar styling, reduced-motion media query

### 5.8 E2E Tests & Final Integration
- [ ] 5.8.1 Playwright E2E: full upload → compare → confirm flow (Chromium + Firefox)
- [ ] 5.8.2 Playwright E2E: density mode persistence across reloads
- [ ] 5.8.3 Playwright E2E: feature flag rollback (each component flag independently)
- [ ] 5.8.4 Playwright E2E: reduced-motion accessibility + 1000+ row performance
- [ ] 5.8.5 Verify all feature flags documented in `.env.example`

---

## Definition of Done (Per Task)

Each task is complete when:
- [ ] Implementation matches spec scenarios exactly
- [ ] Unit tests pass (Vitest + RTL) covering spec scenarios
- [ ] Integration tests pass for component interactions
- [ ] Accessibility check passes (axe-core, keyboard nav, screen reader)
- [ ] Visual regression snapshot captured (Storybook/Chromatic)
- [ ] Feature flag tested: enabled → new component renders; disabled → original MUI renders
- [ ] Code committed as single work-unit commit (tests + implementation + docs)