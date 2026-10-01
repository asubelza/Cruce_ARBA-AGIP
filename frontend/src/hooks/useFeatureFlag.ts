/**
 * ECJY Feature Flag Hook
 * Checks VITE_ECJY_<COMPONENT> env vars + localStorage runtime override
 */

import { useMemo, useEffect, useState, useCallback } from 'react';

export interface UseFeatureFlagReturn {
  isEnabled: (flag: string) => boolean;
  allFlags: Record<string, boolean>;
  setFlag: (flag: string, enabled: boolean) => void;
  resetFlag: (flag: string) => void;
}

const FLAG_PREFIX = 'VITE_ECJY_';
const STORAGE_PREFIX = 'ecjy-';

function getEnvFlag(flag: string): boolean | undefined {
  const envKey = `${FLAG_PREFIX}${flag.toUpperCase().replace(/-/g, '_')}`;
  const value = import.meta.env[envKey];
  if (value === undefined) return undefined;
  return value === 'true' || value === '1';
}

function getStorageFlag(flag: string): boolean | undefined {
  if (typeof window === 'undefined') return undefined;
  const stored = localStorage.getItem(`${STORAGE_PREFIX}${flag.toLowerCase()}`);
  if (stored === null) return undefined;
  return stored === 'true';
}

function resolveFlag(flag: string): boolean {
  // Priority: localStorage override > env var > false (default)
  const storageValue = getStorageFlag(flag);
  if (storageValue !== undefined) return storageValue;
  
  const envValue = getEnvFlag(flag);
  if (envValue !== undefined) return envValue;
  
  return false;
}

function getAllKnownFlags(): string[] {
  // Known feature flags for the ECJY redesign
  return [
    'PHASE_1',
    'HERO_OPENING',
    'DIFFERENCE_DETECTOR',
    'STATE_INDICATORS',
    'COMPARISON_TABLE',
    'CONNECTION_LINES',
    'COMPARISON_ENGINE',
    'DATA_LAYERS',
    'DETECTION_PANEL',
    'VALIDATION_WORKSPACE',
    'STATS_DISPLAY',
    'FILE_UPLOAD',
    'APP_HEADER',
    'PARALLEL_RENDER',
  ];
}

export function useFeatureFlag(): UseFeatureFlagReturn {
  const [flagsCache, setFlagsCache] = useState<Record<string, boolean>>({});
  
  // Initialize cache on mount
  useEffect(() => {
    const initialFlags: Record<string, boolean> = {};
    getAllKnownFlags().forEach(flag => {
      initialFlags[flag] = resolveFlag(flag);
    });
    setFlagsCache(initialFlags);
  }, []);

  const isEnabled = useCallback((flag: string): boolean => {
    return resolveFlag(flag);
  }, []);

  const allFlags = useMemo(() => {
    const result: Record<string, boolean> = {};
    getAllKnownFlags().forEach(flag => {
      result[flag] = resolveFlag(flag);
    });
    return result;
  }, [flagsCache]); // Recompute when cache changes (after setFlag)

  const setFlag = useCallback((flag: string, enabled: boolean) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`${STORAGE_PREFIX}${flag.toLowerCase()}`, String(enabled));
    }
    setFlagsCache(prev => ({ ...prev, [flag]: enabled }));
  }, []);

  const resetFlag = useCallback((flag: string) => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`${STORAGE_PREFIX}${flag.toLowerCase()}`);
    }
    setFlagsCache(prev => {
      const next = { ...prev };
      delete next[flag];
      return next;
    });
  }, []);

  return {
    isEnabled,
    allFlags,
    setFlag,
    resetFlag,
  };
}

// Convenience hook for a specific flag
export function useFeatureFlagEnabled(flag: string): boolean {
  const { isEnabled } = useFeatureFlag();
  return isEnabled(flag);
}