import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Alert, 
  Stack, 
  CircularProgress, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Chip,
  LinearProgress,
  IconButton
} from '@mui/material';
import { 
  CloudUpload, 
  CheckCircle, 
  InsertDriveFile, 
  Description,
  Visibility,
  Close,
  ChevronRight
} from '@mui/icons-material';
import { useECJYTokens } from '../theme/ECJYThemeProvider';
import { useFeatureFlagEnabled } from '../hooks/useFeatureFlag';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface UploadResult {
  message: string;
  retencion_count: number;
  plataforma_count: number;
  sheets_detected?: string[];
  validation_summary?: {
    retencion: { valid: number; invalid: number; errors: string[] };
    plataforma: { valid: number; invalid: number; errors: string[] };
  };
  estimated_matches?: number;
}

interface FileUploadProps {
  onUploadSuccess: () => void;
  onContinue?: () => void;
}

type PipelineStage = 'subiendo' | 'detectando' | 'procesando' | 'validando' | 'completado';

const PIPELINE_STAGES: { key: PipelineStage; label: string; icon: React.ElementType }[] = [
  { key: 'subiendo', label: 'Subiendo', icon: CloudUpload },
  { key: 'detectando', label: 'Detectando hojas', icon: Description },
  { key: 'procesando', label: 'Procesando', icon: InsertDriveFile },
  { key: 'validando', label: 'Validando', icon: Visibility },
];

function useCountUpAnimation(endValue: number, duration = 800) {
  const [displayValue, setDisplayValue] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const startTime = performance.now();
    startTimeRef.current = startTime;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing: decelerate (cubic-bezier(0, 0, 0.38, 1))
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      
      setDisplayValue(Math.floor(easedProgress * endValue));

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [endValue, duration]);

  return displayValue;
}

function CountUpValue({ 
  value, 
  format, 
  color, 
  fontSize = '1.5rem',
  fontWeight = 700,
}: { 
  value: number; 
  format: (v: number) => string; 
  color: string; 
  fontSize?: string;
  fontWeight?: number;
}) {
  const animatedValue = useCountUpAnimation(value);
  const { tokens } = useECJYTokens();

  return (
    <Typography
      variant="h6"
      component="span"
      style={{
        fontFamily: tokens.typography.fontFamilies.display,
        fontWeight,
        fontSize,
        color,
        lineHeight: tokens.typography.lineHeights.tight,
      }}
    >
      {format(animatedValue)}
    </Typography>
  );
}

function PipelineVisualization({ 
  currentStage, 
  completedStages,
  tokens 
}: { 
  currentStage: PipelineStage; 
  completedStages: PipelineStage[];
  tokens: ReturnType<typeof useECJYTokens>['tokens'];
}) {
  const stageOrder = ['subiendo', 'detectando', 'procesando', 'validando'] as const;
  const currentIndex = stageOrder.indexOf(currentStage);

  return (
    <Box sx={{ mb: 3 }}>
      <Stack direction="row" spacing={1} useFlexGap>
        {PIPELINE_STAGES.map((stage, index) => {
          const isCompleted = completedStages.includes(stage.key);
          const isCurrent = stage.key === currentStage;
          const isFuture = index > currentIndex;
          
          const Icon = stage.icon;
          const color = isCompleted || isCurrent 
            ? tokens.colors.semantic.precision.base 
            : tokens.colors.text.disabled;
          const bgColor = isCompleted 
            ? tokens.colors.semantic.precision.subtle 
            : isCurrent 
              ? tokens.colors.semantic.precision.subtle 
              : tokens.colors.surface.panel;
          const borderColor = isCurrent 
            ? tokens.colors.semantic.precision.base 
            : tokens.colors.surface.border;

          return (
            <Box
              key={stage.key}
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1,
                p: 2,
                borderRadius: 2,
                bgcolor: bgColor,
                border: `2px solid ${borderColor}`,
                transition: 'all 0.3s ease',
                position: 'relative',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  bgcolor: isCompleted || isCurrent ? color : 'transparent',
                  border: isCompleted || isCurrent ? 'none' : `2px solid ${color}`,
                  color: isCompleted || isCurrent ? tokens.colors.surface.bg : color,
                  transition: 'all 0.3s ease',
                }}
              >
                {isCompleted ? (
                  <CheckCircle fontSize="small" />
                ) : (
                  <Icon fontSize="small" />
                )}
              </Box>
              <Typography
                variant="caption"
                style={{
                  fontFamily: tokens.typography.fontFamilies.body,
                  fontWeight: isCurrent ? 600 : 400,
                  color: isCurrent ? color : tokens.colors.text.secondary,
                  textAlign: 'center',
                }}
              >
                {stage.label}
              </Typography>
              {index < PIPELINE_STAGES.length - 1 && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 20,
                    right: -8,
                    width: 16,
                    height: 2,
                    bgcolor: completedStages.includes(stageOrder[index + 1] as PipelineStage) 
                      ? tokens.colors.semantic.precision.base 
                      : tokens.colors.surface.border,
                    zIndex: -1,
                  }}
                />
              )}
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}

export function FileUpload({ onUploadSuccess, onContinue }: FileUploadProps) {
  const { tokens } = useECJYTokens();
  const uploadEnabled = useFeatureFlagEnabled('FILE_UPLOAD');
  const [uploading, setUploading] = useState(false);
  const [pipelineStage, setPipelineStage] = useState<PipelineStage>('subiendo');
  const [completedStages, setCompletedStages] = useState<PipelineStage[]>([]);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Simulate pipeline stages during upload
  useEffect(() => {
    if (!uploading) return;

    const stages: PipelineStage[] = ['subiendo', 'detectando', 'procesando', 'validando'];
    let currentIndex = 0;

    const advanceStage = () => {
      if (currentIndex < stages.length) {
        const stage = stages[currentIndex];
        setPipelineStage(stage);
        if (currentIndex > 0) {
          setCompletedStages(prev => [...prev, stages[currentIndex - 1]]);
        }
        currentIndex++;
        setTimeout(advanceStage, 800); // 800ms per stage
      } else {
        setPipelineStage('completado');
        setCompletedStages(stages);
      }
    };

    const timer = setTimeout(advanceStage, 100);
    return () => clearTimeout(timer);
  }, [uploading]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await uploadFile(files[0]);
    }
  };

  const uploadFile = async (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setError('Por favor selecciona un archivo Excel (.xlsx o .xls)');
      return;
    }

    setUploading(true);
    setError(null);
    setUploadResult(null);
    setCompletedStages([]);
    setPipelineStage('subiendo');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Error uploading file');
      
      const data = await response.json();
      setUploadResult(data);
      onUploadSuccess();
    } catch (err) {
      console.error('Upload error:', err);
      setError('Error al subir el archivo');
      setUploading(false);
      setCompletedStages([]);
      setPipelineStage('subiendo');
    }
  };

  const formatNumber = (n: number) => n.toLocaleString();

  if (!uploadEnabled) {
    return null;
  }

  if (!mounted) {
    return (
      <Card sx={{ mb: 3 }} elevation={2}>
        <CardContent>
          <Typography variant="body2" color="text.secondary">Cargando...</Typography>
        </CardContent>
      </Card>
    );
  }

  const hasResult = uploadResult !== null;
  const sheetsDetected = uploadResult?.sheets_detected || [];
  const hasRetencionTypo = sheetsDetected.some(s => s.toUpperCase().includes('RETIENCION'));
  const validationSummary = uploadResult?.validation_summary;

  return (
    <Card sx={{ mb: 3 }} elevation={2}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <InsertDriveFile color="primary" />
          <Typography variant="h6">Cargar Archivo Excel</Typography>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {!hasResult ? (
          // Initial state - click to select
          <Box
            onClick={() => fileInputRef.current?.click()}
            sx={{
              border: 2,
              borderStyle: 'dashed',
              borderColor: 'divider',
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'action.hover',
              },
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            
            <Stack alignItems="center" spacing={2}>
              <CloudUpload sx={{ fontSize: 48, color: 'text.disabled' }} />
              <Typography>
                Haz clic para seleccionar archivo Excel
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Archivos .xlsx o .xls con hojas RETENCION y PLATAFORMA
              </Typography>
            </Stack>
          </Box>
        ) : uploading ? (
          // Uploading with pipeline visualization
          <>
            <PipelineVisualization 
              currentStage={pipelineStage} 
              completedStages={completedStages}
              tokens={tokens}
            />
            
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <CircularProgress size={60} thickness={4} color="primary" />
              <Typography variant="body1" sx={{ mt: 2, color: 'text.secondary' }}>
                {pipelineStage === 'subiendo' && 'Subiendo archivo...'}
                {pipelineStage === 'detectando' && 'Detectando hojas del archivo...'}
                {pipelineStage === 'procesando' && 'Procesando registros...'}
                {pipelineStage === 'validando' && 'Validando datos...'}
              </Typography>
            </Box>
          </>
        ) : (
          // Success state with animated counters and details
          <>
            <PipelineVisualization 
              currentStage="completado" 
              completedStages={completedStages}
              tokens={tokens}
            />

            <Alert severity="success" sx={{ mb: 3 }} icon={<CheckCircle />}>
              {uploadResult?.message || 'Archivo procesado correctamente'}
            </Alert>

            {/* Sheet detection with RETIENCION typo handling */}
            {sheetsDetected.length > 0 && (
              <Box sx={{ mb: 3, p: 2, bgcolor: 'surface.panel', borderRadius: 2, border: `1px solid ${tokens.colors.surface.border}` }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Description color="primary" /> Hojas detectadas
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {sheetsDetected.map((sheet, index) => (
                    <Chip
                      key={index}
                      label={sheet}
                      icon={sheet.toUpperCase().includes('RETIENCION') && (
                        <Typography variant="caption" style={{ color: tokens.colors.semantic.detection.base, fontWeight: 600 }}>
                          (typo detectado)
                        </Typography>
                      )}
                      variant="outlined"
                      size="small"
                      color={sheet.toUpperCase().includes('RETIENCION') ? 'warning' : 'default'}
                    />
                  ))}
                </Stack>
              </Box>
            )}

            {/* Animated counters */}
            <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap', mb: 3, alignItems: 'center' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                <CountUpValue
                  value={uploadResult?.retencion_count || 0}
                  format={formatNumber}
                  color={tokens.colors.semantic.control.base}
                  fontSize="2rem"
                />
                <Typography variant="caption" color="text.secondary">
                  Registros RETENCION
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.disabled' }}>
                <ChevronRight />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                <CountUpValue
                  value={uploadResult?.plataforma_count || 0}
                  format={formatNumber}
                  color={tokens.colors.semantic.precision.base}
                  fontSize="2rem"
                />
                <Typography variant="caption" color="text.secondary">
                  Registros PLATAFORMA
                </Typography>
              </Box>
              {uploadResult?.estimated_matches && (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.disabled' }}>
                    <ChevronRight />
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                    <CountUpValue
                      value={uploadResult.estimated_matches}
                      format={formatNumber}
                      color={tokens.colors.semantic.security.base}
                      fontSize="2rem"
                    />
                    <Typography variant="caption" color="text.secondary">
                      Matches estimados
                    </Typography>
                  </Box>
                </>
              )}
            </Box>

            {/* Validation summary */}
            {validationSummary && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Visibility color="primary" /> Resumen de validación
                </Typography>
                <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                  <Box sx={{ p: 2, bgcolor: 'success.subtle', borderRadius: 2, border: `1px solid ${tokens.colors.semantic.security.subtle}`, minWidth: 200 }}>
                    <Typography variant="caption" color="text.secondary">RETENCION válidos</Typography>
                    <Typography variant="h6" color="success.main" style={{ fontFamily: tokens.typography.fontFamilies.display }}>
                      {validationSummary.retencion.valid}
                    </Typography>
                    {validationSummary.retencion.invalid > 0 && (
                      <Typography variant="caption" color="error.main">
                        {validationSummary.retencion.invalid} con errores
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ p: 2, bgcolor: 'success.subtle', borderRadius: 2, border: `1px solid ${tokens.colors.semantic.security.subtle}`, minWidth: 200 }}>
                    <Typography variant="caption" color="text.secondary">PLATAFORMA válidos</Typography>
                    <Typography variant="h6" color="success.main" style={{ fontFamily: tokens.typography.fontFamilies.display }}>
                      {validationSummary.plataforma.valid}
                    </Typography>
                    {validationSummary.plataforma.invalid > 0 && (
                      <Typography variant="caption" color="error.main">
                        {validationSummary.plataforma.invalid} con errores
                      </Typography>
                    )}
                  </Box>
                </Stack>
                {(validationSummary.retencion.errors.length > 0 || validationSummary.plataforma.errors.length > 0) && (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Visibility />}
                    onClick={() => setShowDetails(true)}
                    sx={{ mt: 2 }}
                  >
                    Ver detalles
                  </Button>
                )}
              </Box>
            )}

            {/* Continue button */}
            {onContinue && (
              <Box sx={{ textAlign: 'right', mt: 2 }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<ChevronRight />}
                  onClick={onContinue}
                  sx={{ px: 4 }}
                >
                  Continuar
                </Button>
              </Box>
            )}
          </>
        )}

        {/* Validation Details Modal */}
        <Dialog open={showDetails} onClose={() => setShowDetails(false)} maxWidth="md" fullWidth>
          <DialogTitle>Detalles de validación</DialogTitle>
          <DialogContent>
            {validationSummary && (
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle1" color="primary.main" gutterBottom>
                    RETENCION
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Válidos: {validationSummary.retencion.valid} | Inválidos: {validationSummary.retencion.invalid}
                  </Typography>
                  {validationSummary.retencion.errors.length > 0 && (
                    <Box sx={{ mt: 1, maxHeight: 200, overflow: 'auto' }}>
                      {validationSummary.retencion.errors.map((err, i) => (
                        <Typography key={i} variant="body2" color="error.main" sx={{ display: 'block', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                          {err}
                        </Typography>
                      ))}
                    </Box>
                  )}
                </Box>
                <Box>
                  <Typography variant="subtitle1" color="success.main" gutterBottom>
                    PLATAFORMA
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Válidos: {validationSummary.plataforma.valid} | Inválidos: {validationSummary.plataforma.invalid}
                  </Typography>
                  {validationSummary.plataforma.errors.length > 0 && (
                    <Box sx={{ mt: 1, maxHeight: 200, overflow: 'auto' }}>
                      {validationSummary.plataforma.errors.map((err, i) => (
                        <Typography key={i} variant="body2" color="error.main" sx={{ display: 'block', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                          {err}
                        </Typography>
                      ))}
                    </Box>
                  )}
                </Box>
              </Stack>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowDetails(false)}>Cerrar</Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
}

export default FileUpload;