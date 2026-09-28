# ecjy-file-upload Specification

## Purpose

Replaces FileUpload. Data ingestion visualization showing upload progress, sheet detection, record parsing, and validation results. Not drag-and-drop — click-to-select with visual pipeline feedback.

## Requirements

### Requirement: Click-to-Select Upload

The system SHALL provide clickable drop zone opening native file picker. No drag-and-drop. Accepts .xlsx/.xls. Shows selected filename before upload.

#### Scenario: File selection

- GIVEN user clicks drop zone
- WHEN file picker opens
- AND user selects "cruce_enero.xlsx"
- THEN zone shows "cruce_enero.xlsx (2.3 MB)"
- AND "Subir" button enables

### Requirement: Pipeline Visualization

The system SHALL show 4-stage pipeline during upload: 1) Subiendo, 2) Detectando hojas, 3) Procesando registros, 4) Validando. Each stage shows spinner → check on completion.

#### Scenario: Pipeline progress

- GIVEN upload starts
- WHEN stage 1 completes
- THEN "Subiendo" shows check icon
- AND "Detectando hojas" starts spinning
- AND so on through all 4 stages

### Requirement: Sheet Detection Feedback

The system SHALL display detected sheet names with record counts: "RETENCION: 1,247 registros", "PLATAFORMA: 1,180 registros". Handles "RETIENCION" typo gracefully.

#### Scenario: Sheet detection

- GIVEN Excel has sheets "RETIENCION" and "PLATAFORMA"
- WHEN processing completes
- THEN shows "RETIENCION (detectado como RETENCION): 1,247"
- AND "PLATAFORMA: 1,180"

### Requirement: Validation Results

The system SHALL show validation summary: total records, duplicates removed, invalid CUITs, missing amounts, period format issues. Each issue type with count and "Ver detalles" link.

#### Scenario: Validation summary

- GIVEN upload processed
- WHEN validation complete
- THEN shows: "1,247 válidos • 12 duplicados • 3 CUIT inválidos • 0 montos faltantes"
- AND "Ver detalles" opens modal with row-level issues

### Requirement: Success State with Metrics

The system SHALL display success state with animated metric counters: RETENCION count, PLATAFORMA count, Estimated matches. Auto-triggers stats refresh.

#### Scenario: Success metrics

- GIVEN upload successful
- WHEN success state renders
- THEN counters animate 0 → 1247 (RET) and 0 → 1180 (PLAT)
- AND "Estimados 1,150 cruces" with precision badge
- AND "Continuar" button navigates to comparison view

## Data Models

```typescript
interface FileUploadProps {
  onUploadComplete: (result: UploadResult) => void;
}

interface UploadResult {
  retencionCount: number;
  plataformaCount: number;
  estimatedMatches: number;
  validationIssues: ValidationIssue[];
}

interface ValidationIssue {
  type: 'duplicate' | 'invalid_cuit' | 'missing_amount' | 'invalid_period';
  count: number;
  rows: number[];
}
```

## UI/UX References

- Tokens: `color.precision/order/detection`, `motion.duration.normal`, `elevation.level2`, `spacing`
- Replaces: FileUpload.tsx (removes drag-drop, adds pipeline viz)
- Pipeline: 4-step stepper with icons
- Animation: framer-motion for counter count-up