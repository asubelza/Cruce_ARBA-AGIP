# Exploration: ECJY Visual System Redesign for Cruce ARBA-AGIP Frontend

## Current State

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: Material-UI (MUI) v5 with `@emotion` styling
- **Data Grid**: `@mui/x-data-grid` v6
- **Charts**: `recharts` v2
- **API**: Axios + custom hooks (`useApi.ts`)
- **Build**: Docker multi-stage (frontend on port 3000, nginx proxy on 80)

### Current Theme (main.tsx)
```typescript
palette: {
  mode: 'dark',
  primary: { main: '#0095f6' },      // Instagram blue
  secondary: { main: '#00c853' },    // Green
  background: { default: '#0a0a0a', paper: '#121212' }
}
```
- Dark mode only, near-black backgrounds
- Inter font family
- Standard MUI component overrides (border-radius, button styling)

### Current Components
| Component | Purpose | Key Characteristics |
|-----------|---------|---------------------|
| `Header` | App bar with logo/title | Gradient icon, sticky, dark mode toggle (unused) |
| `StatsCards` | 4 metric cards | Grid layout, colored icons, skeleton loading |
| `FileUpload` | Drag-drop Excel upload | Dashed border, upload states, result summary |
| `DataTable` (x2) | RETIENCION / PLATAFORMA tables | MUI Table, checkbox selection, sticky header, currency formatting |
| `AutoMatchPreview` | AI-matched pairs review | Side-by-side comparison, OK/DIF chips, bulk actions |
| `StagingTable` | Manual cartesian matches | Compact ID display, dual amounts, clear action |

### Data Flow
1. **Upload** → `/api/upload` (Excel with RETENCION/PLATAFORMA sheets)
2. **Stats** → `/api/stats` (pending counts + historical OK)
3. **Pendientes** → `/api/pendientes/retencion|plataforma` (unreconciled records)
4. **Auto-Match** → `/api/auto-match` (CUIT + amount matching)
5. **Staging** → `/api/staging/generate` (cartesian product of selections)
6. **Confirm** → `/api/cruces/confirmar` or `/api/cruces/confirmar-auto`

### Constraints (MUST Remain Compatible)
- Backend API contracts unchanged
- MongoDB collections: `ingresos`, `cruces_ok`
- Docker Compose 4-service architecture
- Nginx reverse proxy routing
- Existing data types (`Ingreso`, `MatchResult`, `StagingItem`, `Stats`, `CruceOk`)

---

## Affected Areas

### Core Theme & Design System
- `frontend/src/main.tsx` — ThemeProvider, palette, typography, component overrides
- `frontend/src/index.css` — Global styles, scrollbar, CSS variables
- **New**: Design token system (colors, spacing, motion, elevation)

### All Components (Visual Overhaul)
- `Header.tsx` — Hero opening, ARCA → SISTEMA → CONTROL → DIFERENCIAS narrative
- `StatsCards.tsx` — Precision indicators, not generic cards
- `FileUpload.tsx` — Data ingestion visualization (not file drop)
- `DataTable.tsx` → **ComparisonTable** — Reimagined as comparison instrument
- `AutoMatchPreview.tsx` → **DetectionPanel** — Animated comparison, connection lines
- `StagingTable.tsx` → **ValidationWorkspace** — Control surface for manual verification

### New Components Needed
- `HeroOpening.tsx` — Animated data flow: ARCA → SISTEMA → CONTROL → DIFERENCIAS
- `DifferenceDetector.tsx` — Core visual: ARCA COMPROBANTES vs PROCESSED
- `ComparisonEngine.tsx` — Animated comparison, filters, progressive reveal
- `ConnectionLines.tsx` — SVG/Canvas lines linking matched records
- `StateIndicators.tsx` — Precision, Control, Detection, Order, Security badges
- `DataLayers.tsx` — Layered visualization (raw → matched → confirmed)

### Animation & Interaction Layer
- **New dependency**: `framer-motion` for layout animations, enter/exit, drag
- **New dependency**: `@visx` or `d3` for custom connection visualizations
- **New dependency**: `canvas-confetti` or similar for micro-celebrations on confirm

### Architecture Decisions
- **MUI Customization vs Full Custom**: MUI provides accessibility, theming, components — keep as foundation, extend heavily
- **CSS-in-JS**: Continue `@emotion` (already in stack) for dynamic theming
- **State Management**: React Context + hooks (current) — sufficient, no Redux/Zustand needed
- **Charting**: `recharts` for stats, custom SVG/Canvas for comparison visualizations

---

## Approaches

### 1. Incremental MUI Theming + Custom Components (RECOMMENDED)
**Description**: Deep MUI theme customization + new custom components for ECJY-specific visualizations, phased replacement of existing components.

| Aspect | Assessment |
|--------|------------|
| **Pros** | - Leverages existing MUI investment (accessibility, RTL, components)<br>- Incremental delivery, each component independently deployable<br>- Theme tokens propagate to all MUI components automatically<br>- Team knows MUI patterns<br>- Lower risk, reversible |
| **Cons** | - MUI's opinionated styles may fight custom visual language<br>- Bundle size (MUI + emotion + framer-motion + visx)<br>- Some ECJY patterns (grids, connection lines) need escape hatches |
| **Effort** | Medium (6-8 weeks for full redesign) |

**Implementation Path**:
1. **Week 1-2**: Design token system (colors, spacing, motion curves, elevation, grids)
2. **Week 2-3**: HeroOpening + DifferenceDetector (new visual anchors)
3. **Week 3-4**: ComparisonTable replacing DataTable (core instrument)
4. **Week 4-5**: DetectionPanel replacing AutoMatchPreview (animated comparison)
5. **Week 5-6**: ValidationWorkspace replacing StagingTable
6. **Week 6-7**: StatsCards + FileUpload + Header refresh
7. **Week 7-8**: Polish, motion refinement, accessibility audit

### 2. Full Custom Design System (Radical)
**Description**: Build from scratch with CSS Modules / Tailwind / vanilla CSS + custom components, drop MUI entirely.

| Aspect | Assessment |
|--------|------------|
| **Pros** | - Zero framework constraints, pure ECJY visual DNA<br>- Smaller bundle (no MUI)<br>- Complete control over every pixel |
| **Cons** | - Rebuild all accessibility, keyboard nav, focus management<br>- Lose MUI's battle-tested components (Dialog, Tooltip, Select, etc.)<br>- 3-4x effort, high risk<br>- Team must maintain design system forever |
| **Effort** | High (12-16 weeks) |

### 3. Hybrid: MUI for Chrome, Custom Canvas/SVG for Data Visualizations
**Description**: Keep MUI for layout, navigation, forms, dialogs. Build comparison/detection views as custom React + Canvas/SVG components (framer-motion + visx/d3).

| Aspect | Assessment |
|--------|------------|
| **Pros** | - Best of both: MUI reliability + custom data viz freedom<br>- Clear separation: "app chrome" vs "instrument panel"<br>- Canvas/WebGL for 1000+ row comparisons performant |
| **Cons** | - Two visual languages to harmonize<br>- More complex build (canvas + DOM sync)<br>- Accessibility harder for canvas regions |
| **Effort** | Medium-High (8-10 weeks) |

---

## Recommendation

**Approach 1 (Incremental MUI Theming + Custom Components)** with selective Approach 3 techniques for the comparison engine.

### Why
1. **Pragmatic**: Existing MUI investment is sound; throwing it away adds risk without user value
2. **ECJY DNA achievable via tokens**: The visual values (precision, control, detection, order, security) map to design tokens — color scales, motion curves, grid systems, elevation — not framework choice
3. **Phased delivery**: User sees value every 2 weeks; can validate direction early
4. **Escape hatches**: For the "Difference Detection" core, use custom Canvas/SVG (Approach 3) embedded in MUI Cards
5. **Team velocity**: Current team knows MUI; learning curve for custom design system would stall progress

### Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Design Tokens** | `@emotion` theme + `style-dictionary` or manual token JSON | Single source of truth, consumed by MUI theme + custom components |
| **Motion** | `framer-motion` for layout/enter/exit; CSS transitions for micro-interactions | Declarative, performant, works with React 18 |
| **Connection Lines** | `@visx/shape` + `@visx/responsive` (SVG) or `canvas` for >500 rows | SVG for accessibility + interactivity; Canvas fallback for scale |
| **Grid System** | CSS Grid + custom `useGrid` hook (12-col, fluid, respects density) | ECJY "grids, lines, order" — not MUI Grid v2 |
| **Data Density** | Three modes: `comfortable` (default), `compact`, `dense` (instrument view) | "Professional control instrument" needs density control |
| **Color System** | Semantic tokens: `precision`, `control`, `detection`, `order`, `security` → mapped to hex | Values-first, not color-first; enables theming variants |

---

## Risks

1. **MUI Style Conflicts**: MUI's injected styles may override custom token values
   - *Mitigation*: Use `CssBaseline` + `GlobalStyles` for token CSS variables; increase specificity via `:where()` or layered CSS

2. **Animation Performance on Large Datasets**: 1000+ rows with framer-motion + connection lines
   - *Mitigation*: Virtualize tables (`@tanstack/react-virtual` or MUI DataGrid Pro), canvas for lines, `will-change` hints

3. **Accessibility of Custom Visualizations**: Canvas/connection lines not screen-reader accessible
   - *Mitigation*: Parallel ARIA live regions, data tables as accessible fallback, `visx` SVG preferred over canvas

4. **Scope Creep**: "Hero animation" + "connection lines" + "progressive reveal" = feature creep
   - *Mitigation*: Define MVP per phase; hero opening = Phase 1 static with scroll-trigger; connections = Phase 2

5. **Docker Build Time**: Adding framer-motion, visx, style-dictionary increases node_modules
   - *Mitigation*: Multi-stage Docker build (already present), cache node_modules layer

6. **Backward Compatibility**: API types must not change
   - *Mitigation*: Types are stable; visual layer only. Add integration tests for each API contract.

---

## Ready for Proposal

**Yes** — sufficient understanding to write a concrete SDD proposal with:
- Phase breakdown (4-5 phases, 2 weeks each)
- Design token specification (colors, motion, grid, elevation)
- Component replacement map (old → new with acceptance criteria)
- Technical architecture (token system, animation strategy, canvas/SVG integration)
- Migration strategy (feature flags, parallel render, gradual cutover)

**Next step for orchestrator**: Present this exploration to user, confirm approach, then launch `sdd-propose` with change name `ecjy-visual-redesign`.