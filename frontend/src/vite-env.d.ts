/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_ECJY_VISUAL_PHASE_1: string;
  readonly VITE_ECJY_HERO_OPENING: string;
  readonly VITE_ECJY_DIFFERENCE_DETECTOR: string;
  readonly VITE_ECJY_STATE_INDICATORS: string;
  readonly VITE_ECJY_COMPARISON_TABLE: string;
  readonly VITE_ECJY_CONNECTION_LINES: string;
  readonly VITE_ECJY_COMPARISON_ENGINE: string;
  readonly VITE_ECJY_DATA_LAYERS: string;
  readonly VITE_ECJY_DETECTION_PANEL: string;
  readonly VITE_ECJY_VALIDATION_WORKSPACE: string;
  readonly VITE_ECJY_STATS_DISPLAY: string;
  readonly VITE_ECJY_FILE_UPLOAD: string;
  readonly VITE_ECJY_APP_HEADER: string;
  readonly VITE_ECJY_PARALLEL_RENDER: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}