# Proposal: ECJY Visual System Redesign

## Intent

Replace the generic MUI dark-theme dashboard with a purpose-built **ECJY visual system** — a professional control instrument for ARBA/AGIP tax retention reconciliation. The current UI feels like a generic admin panel; the redesign transforms it into a precision tool where every visual element communicates **detection, control, order, security, and precision** — the five ECJY values.

## Scope

### In Scope
- Complete design token system (colors, spacing, motion curves, elevation, grid)
- 6 existing components visually overhauled: Header, StatsCards, FileUpload, DataTable→ComparisonTable, AutoMatchPreview→DetectionPanel, StagingTable→ValidationWorkspace
- 7 new components: HeroOpening, DifferenceDetector, ComparisonEngine, ConnectionLines, StateIndicators, DataLayers
- Animation/interaction layer: framer-motion + @visx for connection visualizations
- CSS Grid-based layout system with 3 density modes
- All changes frontend-only; backend API contracts unchanged

### Out of Scope
- Backend API modifications (FastAPI, MongoDB, Docker)
- New business logic or reconciliation algorithms
- Authentication/authorization changes
- Mobile/responsive breakpoints beyond desktop control instrument

## Capabilities

### New Capabilities
- `ecjy-design-tokens`: Unified token system (semantic colors, motion, spacing, elevation, grid) consumed by MUI theme and custom components
- `ecjy-hero-opening`: Animated narrative flow ARCA → SISTEMA → CONTROL → DIFERENCIAS on app load
- `ecjy-difference-detector`: Core visual comparing ARCA COMPROBANTES vs PROCESSED records
- `ecjy-comparison-engine`: Animated side-by-side comparison with progressive reveal and filters
- `ecjy-connection-lines`: SVG/Canvas lines linking matched records across tables
- `ecjy-state-indicators`: Precision, Control, Detection, Order, Security status badges
- `ecjy-data-layers`: Layered visualization (raw → matched → confirmed) with density control
- `ecjy-validation-workspace`: Manual cartesian match verification surface

### Modified Capabilities
- `file-upload`: Visual overhaul — data ingestion visualization replacing drag-drop
- `stats-display`: Precision indicators replacing generic metric cards
- `comparison-table`: Replaces DataTable — comparison instrument with density modes
- `detection-panel`: Replaces AutoMatchPreview — animated comparison with connection lines
- `app-header`: Hero narrative integration, ECJY branding

## Approach

**Approach 1: Incremental MUI Theming + Custom Components** (from exploration.md). Deep MUI theme customization via design tokens + new custom components for ECJY-specific visualizations. Phased replacement over 4 phases (6-8 weeks). MUI remains foundation for accessibility, RTL, standard components; custom Canvas/SVG (via @visx) for comparison engine where MUI fights the visual language.

### Phase Breakdown
| Phase | Weeks | Deliverables |
|-------|-------|--------------|
| 1: Tokens & Foundation | 1-2 | Design token JSON, MUI theme integration, CSS variables, grid system, motion curves |
| 2: Hero & Detector | 2-3 | HeroOpening (static → scroll-trigger), DifferenceDetector (core visual), StateIndicators |
| 3: Comparison Engine | 3-4 | ComparisonTable (replaces DataTable), ConnectionLines (SVG), ComparisonEngine, DataLayers |
| 4: Detection & Validation | 4-5 | DetectionPanel (replaces AutoMatchPreview), ValidationWorkspace (replaces StagingTable) |
| 5: Chrome & Polish | 5-6 | StatsCards, FileUpload, Header refresh, density modes, accessibility audit |

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `frontend/src/main.tsx` | Modified | ThemeProvider, palette, typography, component overrides → token-driven |
| `frontend/src/index.css` | Modified | Global styles, CSS variables for tokens, scrollbar, grid utilities |
| `frontend/src/theme/` | New | Token definitions (colors.ts, motion.ts, spacing.ts, elevation.ts, grid.ts) |
| `frontend/src/components/Header.tsx` | Modified | Hero narrative, ECJY branding |
| `frontend/src/components/StatsCards.tsx` | Modified | Precision indicators, token colors |
| `frontend/src/components/FileUpload.tsx` | Modified | Data ingestion visualization |
| `frontend/src/components/DataTable.tsx` | Removed | Replaced by ComparisonTable |
| `frontend/src/components/ComparisonTable.tsx` | New | Core comparison instrument |
| `frontend/src/components/AutoMatchPreview.tsx` | Removed | Replaced by DetectionPanel |
| `frontend/src/components/DetectionPanel.tsx` | New | Animated comparison + connection lines |
| `frontend/src/components/StagingTable.tsx` | Removed | Replaced by ValidationWorkspace |
| `frontend/src/components/ValidationWorkspace.tsx` | New | Manual verification control surface |
| `frontend/src/components/HeroOpening.tsx` | New | Animated ARCA→SISTEMA→CONTROL→DIFERENCIAS |
| `frontend/src/components/DifferenceDetector.tsx` | New | ARCA COMPROBANTES vs PROCESSED visual |
| `frontend/src/components/ComparisonEngine.tsx` | New | Progressive reveal, filters |
| `frontend/src/components/ConnectionLines.tsx` | New | SVG/Canvas match connections |
| `frontend/src/components/StateIndicators.tsx` | New | 5 ECJY value badges |
| `frontend/src/components/DataLayers.tsx` | New | Layered raw→matched→confirmed view |
| `frontend/src/hooks/useGrid.ts` | New | 12-col fluid grid hook |
| `frontend/src/hooks/useDensity.ts` | New | Density mode state (comfortable/compact/dense) |
| `frontend/package.json` | Modified | Add framer-motion, @visx/shape, @visx/responsive, canvas-confetti |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| MUI style conflicts override token values | High | CssBaseline + GlobalStyles for CSS variables; `:where()` specificity; token-layered CSS |
| Animation performance on 1000+ rows | High | Virtualize with @tanstack/react-virtual; Canvas fallback for connection lines; `will-change` |
| Custom visualizations inaccessible (Canvas) | Medium | @visx SVG preferred; parallel ARIA live regions; data tables as accessible fallback |
| Scope creep on hero/connection animations | Medium | MVP per phase: Phase 1 static hero + scroll-trigger; connections Phase 2 |
| Docker build time increase (new deps) | Low | Multi-stage build caches node_modules; pre-bundle visx if needed |
| Backward compatibility with API types | Low | Types stable; visual layer only; add integration tests per API contract |

## Rollback Plan

1. **Git revert**: Branch `rediseño_aws` contains base tokens; each phase committed separately
2. **Feature flags**: Each new component behind `VITE_ECJY_<COMPONENT>` env var; disable to fall back to original MUI components
3. **Parallel render**: During transition, render both old and new behind flag; compare visually
4. **Single-command rollback**: `docker compose down && git checkout feature/web-migration-mongodb-docker && docker compose up`

## Dependencies

- None (backend API stable, types unchanged)
- New npm deps: `framer-motion@11`, `@visx/shape@3`, `@visx/responsive@3`, `canvas-confetti@1` (dev)
- Existing: MUI v5, @emotion, recharts, React 18, TypeScript, Vite

## Success Criteria

- [ ] Design token system drives 100% of colors, spacing, motion, elevation (no hardcoded values)
- [ ] HeroOpening renders ARCA→SISTEMA→CONTROL→DIFERENCIAS narrative on load (<2s)
- [ ] ComparisonTable replaces both DataTables with 3 density modes, virtualized >1000 rows
- [ ] DetectionPanel shows animated comparison with SVG connection lines for matched pairs
- [ ] ValidationWorkspace enables manual cartesian verification with keyboard-only workflow
- [ ] All 5 ECJY values (precision, control, detection, order, security) visibly represented
- [ ] Lighthouse accessibility ≥ 95; keyboard navigation complete; screen reader tested
- [ ] Bundle size increase < 150KB gzipped (framer-motion + visx)
- [ ] Docker build time < 3min (cached); production image < 500MB