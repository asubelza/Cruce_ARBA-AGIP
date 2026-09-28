# Design: ECJY Visual System Redesign

## Technical Approach

Transform the generic MUI dashboard into a purpose-built ECJY control instrument through a phased, token-driven replacement strategy. The design leverages the existing `ECJYThemeProvider` and design token system (already committed on `rediseño_aws` branch) as foundation. Each phase introduces new components behind feature flags (`VITE_ECJY_<COMPONENT>`), enabling instant rollback. The architecture keeps React Context + custom hooks for state (sufficient for current scope), adds framer-motion for orchestration, @visx for accessible SVG connections, and @tanstack/react-virtual for 1000+ row performance.

## Architecture Decisions

### Decision: State Management — Keep React Context + Custom Hooks

| Alternative | Tradeoff | Decision |
|-------------|----------|----------|
| Redux/Zustand | Adds ~15KB, steep learning curve, overkill for 8 hooks | **Reject** |
| React Context + hooks (current) | Zero deps, team knows it, scales to ~20 components | **Accept** |
| Jotai/Recoil | Atomic but unfamiliar, bundle cost | **Reject** |

**Rationale**: Current 8 hooks (`useStats`, `usePendientes`, `useAutoMatch`, `useStaging`, `useFileUpload`, plus new `useDensity`, `useGrid`, `useFeatureFlag`) cover all needs. No global client state requires normalization.

### Decision: Animation Library — framer-motion + @visx (not Canvas-only)

| Alternative | Tradeoff | Decision |
|-------------|----------|----------|
| Canvas only (konva/fabric) | Fast for 1000+ lines, but inaccessible, no SSR | **Reject** |
| framer-motion + @visx SVG | Accessible, declarative, tree-shakeable, ~80KB total | **Accept** |
| CSS animations only | Limited orchestration, no layout animations | **Reject** |

**Rationale**: @visx provides accessible SVG connection lines (screen readers, keyboard nav). Canvas fallback only activates when >500 visible connections (see Virtualization Strategy).

### Decision: Virtualization — @tanstack/react-virtual

| Alternative | Tradeoff | Decision |
|-------------|----------|----------|
| react-window | Mature but less flexible, no TypeScript-first | **Reject** |
| @tanstack/react-virtual | Headless, TS-first, flexible overscan, 5KB | **Accept** |
| Custom IntersectionObserver | Reinventing wheel, maintenance burden | **Reject** |

**Rationale**: Used by ComparisonTable, DetectionPanel, ValidationWorkspace. Renders 20 rows + 5 overscan buffer.

### Decision: Feature Flags — Build-time env + Runtime localStorage Override

| Alternative | Tradeoff | Decision |
|-------------|----------|----------|
| LaunchDarkly/ConfigCat | External dependency, overkill | **Reject** |
| VITE_* env + localStorage | Zero deps, dev can toggle in browser, CI controllable | **Accept** |
| URL query params only | Not persistent across sessions | **Reject** |

**Rationale**: Each new component reads `VITE_ECJY_<COMPONENT>` at build + `localStorage.getItem('ecjy-<component>')` at runtime. Fallback renders original MUI component.

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        App (root)                               │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │ ECJYTheme   │  │ useDensity   │  │ useFeatureFlag         │ │
│  │ Provider    │  │ (localStorage)│ │ (env + localStorage)   │ │
│  └──────┬──────┘  └──────┬───────┘  └───────────┬────────────┘ │
│         │                │                       │              │
│         ▼                ▼                       ▼              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    HeroOpening (conditional)              │  │
│  │         onComplete → sets heroPlayed=true                 │  │
│  └──────────────────────────┬────────────────────────────────┘  │
│                             ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                      AppHeader                             │  │
│  │  [ECJY Brand] [StateIndicators(compact)] [DensitySelect]  │  │
│  └──────────────────────────┬────────────────────────────────┘  │
│                             ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                        Main (Grid)                          │  │
│  │  ┌──────────────────┐  ┌────────────────────────────────┐  │
│  │  │ StatsDisplay     │  │ FileUpload                      │  │
│  │  │ (4 metric cards) │  │ (pipeline viz)                  │  │
│  │  └──────────────────┘  └────────────────────────────────┘  │
│  │                             ▼                               │
│  │  ┌──────────────────────────────────────────────────────┐   │
│  │  │            ComparisonEngine (orchestrator)            │   │
│  │  │  [Filters] → [DifferenceDetector] + [ConnectionLines]  │   │
│  │  │         ┌─────────────┐   ┌─────────────┐             │   │
│  │  │         │ Comparison  │   │ Comparison  │             │   │
│  │  │         │ Table (RET) │   │ Table (PLAT)│             │   │
│  │  │         │ @virtualized│   │ @virtualized│             │   │
│  │  │         └─────────────┘   └─────────────┘             │   │
│  │  └──────────────────────────────────────────────────────┘   │
│  │                             ▼                               │
│  │  ┌──────────────────┐  ┌────────────────────────────────┐  │
│  │  │ DetectionPanel   │  │ ValidationWorkspace             │  │
│  │  │ (auto-matches)   │  │ (cartesian manual match)        │  │
│  │  │ +ConnectionLines │  │ @virtualized grid               │  │
│  │  └──────────────────┘  └────────────────────────────────┘  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

Data Flow:
API (FastAPI) → useApi hooks → App state → ComparisonEngine props
                                              ↓
                                    DifferenceDetector (retencionData, plataformaData, matches)
                                              ↓
                                    ConnectionLines (matches, leftRowRefs, rightRowRefs)
                                              ↓
                                    DetectionPanel / ValidationWorkspace (filtered subsets)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `frontend/src/theme/tokens.ts` | Modify | Extend tokens: add `hero` duration (800ms), `sharp` easing, density row heights |
| `frontend/src/theme/ECJYThemeProvider.tsx` | Modify | Add feature flag helpers, export `useFeatureFlag`, `useDensity` from context |
| `frontend/src/hooks/useDensity.ts` | Create | Density mode hook: reads/writes localStorage, exposes CSS var `--ecjy-density-multiplier` |
| `frontend/src/hooks/useGrid.ts` | Create | 12-col fluid grid hook: returns `colSpan(n)`, `gap`, `margin` from tokens |
| `frontend/src/hooks/useFeatureFlag.ts` | Create | Feature flag hook: `isEnabled('componentName')` checks VITE_* + localStorage |
| `frontend/src/components/HeroOpening.tsx` | Create | Animated narrative ARCA→SISTEMA→CONTROL→DIFERENCIAS (framer-motion) |
| `frontend/src/components/DifferenceDetector.tsx` | Create | Dual panel comparison: RETENCION vs PLATAFORMA, synchronized scroll |
| `frontend/src/components/ComparisonEngine.tsx` | Create | Orchestrator: progressive reveal, filters, export, drives sub-components |
| `frontend/src/components/ConnectionLines.tsx` | Create | SVG connections via @visx/shape + @visx/responsive; Canvas fallback >500 |
| `frontend/src/components/StateIndicators.tsx` | Create | 5 ECJY value badges (compact/expanded), count-up animation |
| `frontend/src/components/DataLayers.tsx` | Create | Layered viz: Raw/Matched/Confirmed with opacity toggles, dense→scatter |
| `frontend/src/components/ComparisonTable.tsx` | Create | Replaces DataTable ×2; virtualized, 3 densities, match status column |
| `frontend/src/components/DetectionPanel.tsx` | Create | Replaces AutoMatchPreview; animated reveal + inline confirm/reject |
| `frontend/src/components/ValidationWorkspace.tsx` | Create | Replaces StagingTable; cartesian grid, keyboard-first, match scoring |
| `frontend/src/components/StatsDisplay.tsx` | Create | Replaces StatsCards; 4 precision metrics, animated count-up, trend |
| `frontend/src/components/FileUpload.tsx` | Modify | Replace drag-drop with click-select + 4-stage pipeline visualization |
| `frontend/src/components/AppHeader.tsx` | Modify | Replaces Header; HeroOpening integration, StateIndicators, density selector |
| `frontend/src/components/DataTable.tsx` | Delete | Removed — replaced by ComparisonTable |
| `frontend/src/components/AutoMatchPreview.tsx` | Delete | Removed — replaced by DetectionPanel |
| `frontend/src/components/StagingTable.tsx` | Delete | Removed — replaced by ValidationWorkspace |
| `frontend/src/components/Header.tsx` | Delete | Removed — replaced by AppHeader |
| `frontend/src/components/StatsCards.tsx` | Delete | Removed — replaced by StatsDisplay |
| `frontend/src/App.tsx` | Modify | Compose new tree: HeroOpening → AppHeader → StatsDisplay + FileUpload → ComparisonEngine → DetectionPanel/ValidationWorkspace |
| `frontend/src/index.css` | Modify | Add density CSS vars, grid utilities, scrollbar styling, reduced-motion media query |
| `frontend/package.json` | Modify | Add: framer-motion@11, @visx/shape@3, @visx/responsive@3, @tanstack/react-virtual@3, canvas-confetti@1 (dev) |
| `frontend/Dockerfile` | Modify | Multi-stage build cache optimization for new deps |

## Interfaces / Contracts

### New Hook Interfaces

```typescript
// frontend/src/hooks/useDensity.ts
type DensityMode = 'comfortable' | 'compact' | 'dense';

interface UseDensityReturn {
  density: DensityMode;
  setDensity: (d: DensityMode) => void;
  rowHeight: number;        // 24 | 18 | 14
  multiplier: number;       // 1.0 | 0.75 | 0.5
}

// frontend/src/hooks/useGrid.ts
interface UseGridReturn {
  columns: 12;
  gutter: string;           // '16px' from spacing.md
  margin: string;           // '24px' from spacing.lg
  colSpan: (n: number) => string;  // e.g., colSpan(6) → 'span 6 / span 6'
  breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

// frontend/src/hooks/useFeatureFlag.ts
interface UseFeatureFlagReturn {
  isEnabled: (flag: string) => boolean;  // flag = 'HeroOpening' | 'ComparisonTable' etc.
  allFlags: Record<string, boolean>;
}
```

### New Component Props (Key Interfaces)

```typescript
// ComparisonEngine — orchestrator
interface ComparisonEngineProps {
  retencionData: Ingreso[];
  plataformaData: Ingreso[];
  matches: MatchResult[];
  confirmedMatches: CruceOk[];
  onFilterChange: (filters: ComparisonFilters) => void;
  onExport: (data: ExportRow[]) => void;
  density: DensityMode;
}

// ConnectionLines — accessible SVG connections
interface ConnectionLinesProps {
  matches: MatchResult[];
  leftRowRefs: Map<string, HTMLTableRowElement>;
  rightRowRefs: Map<string, HTMLTableRowElement>;
  density: DensityMode;
  hoveredPairId?: string;
  onPairHover: (pairId: string | null) => void;
}

// ValidationWorkspace — keyboard-first cartesian grid
interface ValidationWorkspaceProps {
  unmatchedRetencion: Ingreso[];
  unmatchedPlataforma: Ingreso[];
  onConfirmMatch: (retId: string, platId: string, score: number) => void;
  onBulkConfirm: (pairs: {retId: string; platId: string; score: number}[]) => void;
  density: DensityMode;
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Token resolution, hook logic (useDensity, useGrid, useFeatureFlag), metric calculations (StateIndicators), match scoring (ValidationWorkspace) | Vitest + React Testing Library; snapshot CSS var output |
| Integration | ComparisonEngine filter → DifferenceDetector sync, ConnectionLines viewport culling, HeroOpening skip/complete callbacks | Render full sub-trees with mocked API data; test virtualization row counts |
| E2E | Full upload → compare → confirm flow; density mode persistence; feature flag rollback; reduced-motion accessibility | Playwright: Chromium + Firefox; axe-core for a11y; test 1000+ row perf |

## Migration / Rollout

**Phased Rollout (5 Phases, 6-8 Weeks)**

| Phase | Components | Feature Flags | Rollback |
|-------|------------|---------------|----------|
| 1: Tokens & Foundation | Extended tokens, useDensity, useGrid, useFeatureFlag, ECJYThemeProvider updates | `VITE_ECJY_PHASE_1` | Flip flag → original MUI theme |
| 2: Hero & Detector | HeroOpening, DifferenceDetector, StateIndicators | `VITE_ECJY_HERO_OPENING`, `VITE_ECJY_DIFFERENCE_DETECTOR`, `VITE_ECJY_STATE_INDICATORS` | Each flag independent |
| 3: Comparison Engine | ComparisonTable, ConnectionLines, ComparisonEngine, DataLayers | `VITE_ECJY_COMPARISON_TABLE`, `VITE_ECJY_CONNECTION_LINES`, `VITE_ECJY_COMPARISON_ENGINE`, `VITE_ECJY_DATA_LAYERS` | Parallel render mode (dev only) |
| 4: Detection & Validation | DetectionPanel, ValidationWorkspace | `VITE_ECJY_DETECTION_PANEL`, `VITE_ECJY_VALIDATION_WORKSPACE` | Keyboard nav tested separately |
| 5: Chrome & Polish | StatsDisplay, FileUpload, AppHeader, density selector, a11y audit | `VITE_ECJY_STATS_DISPLAY`, `VITE_ECJY_FILE_UPLOAD`, `VITE_ECJY_APP_HEADER` | Full visual regression vs baseline |

**Parallel Render Mode (Dev Only)**: When `VITE_ECJY_PARALLEL_RENDER=true`, both old and new components render side-by-side for visual diff comparison.

**Single-Command Rollback**: `docker compose down && git checkout feature/web-migration-mongodb-docker && docker compose up`

## Open Questions

- [ ] **Font Loading Strategy**: Current ECJYThemeProvider loads Space Grotesk/JetBrains Mono/Inter from Google Fonts. Should we self-host for offline/production reliability? (Impacts Docker image size and CSP)
- [ ] **Canvas Confetti Scope**: Spec mentions `canvas-confetti` for success celebrations. Confirm if needed for ValidationWorkspace commit or only HeroOpening completion.
- [ ] **Match Scoring Algorithm**: ValidationWorkspace spec defines weights (CUIT 40%, Amount 35%, Period 15%, RS 10%). Backend currently returns binary match. Should scoring move to backend or stay frontend-only?
- [ ] **ConnectionLines Accessibility**: ARIA live region announces "X connections rendered". Need design for keyboard navigation between connections (Tab order? Arrow keys?).
- [ ] **Dense Mode Threshold**: DataLayers switches to scatter plot at "row count thresholds". Define exact threshold (spec says 5000 records). Should this be configurable?
- [ ] **Export Format**: ComparisonEngine exports CSV. Should we also support Excel (.xlsx) given original domain?

---

**Next Step**: Ready for tasks (sdd-tasks).