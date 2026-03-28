import { useState, useEffect, useCallback } from 'react';
import { Ingreso, Stats, MatchResult, StagingItem } from '../types';

const API_URL = import.meta.env.VITE_API_URL || '/cruce/api';

export const useStats = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/stats`);
      if (!response.ok) throw new Error('Error fetching stats');
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
};

export const usePendientes = () => {
  const [retencion, setRetencion] = useState<Ingreso[]>([]);
  const [plataforma, setPlataforma] = useState<Ingreso[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPendientes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [retRes, platRes] = await Promise.all([
        fetch(`${API_URL}/pendientes/retencion`),
        fetch(`${API_URL}/pendientes/plataforma`)
      ]);
      
      if (!retRes.ok || !platRes.ok) throw new Error('Error fetching pendientes');
      
      const [retData, platData] = await Promise.all([
        retRes.json(),
        platRes.json()
      ]);
      
      setRetencion(retData);
      setPlataforma(platData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  return { retencion, plataforma, loading, error, refetch: fetchPendientes };
};

export const useAutoMatch = () => {
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAutoMatch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/auto-match`, { method: 'POST' });
      if (!response.ok) throw new Error('Error running auto-match');
      const data = await response.json();
      setMatches(data.matches || []);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { matches, loading, error, runAutoMatch };
};

export const useStaging = () => {
  const [staging, setStaging] = useState<StagingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateStaging = useCallback(async (retIds: string[], platIds: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/staging/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ret_ids: retIds, plat_ids: platIds })
      });
      if (!response.ok) throw new Error('Error generating staging');
      const data = await response.json();
      setStaging(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const confirmStaging = useCallback(async (items: StagingItem[]) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/cruces/confirmar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(items)
      });
      if (!response.ok) throw new Error('Error confirming cruces');
      const data = await response.json();
      setStaging([]);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearStaging = useCallback(() => {
    setStaging([]);
  }, []);

  return { staging, loading, error, generateStaging, confirmStaging, clearStaging };
};

export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ message: string; retencion_count: number; plataforma_count: number } | null>(null);

  const uploadFile = useCallback(async (file: File) => {
    setUploading(true);
    setError(null);
    setResult(null);
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) throw new Error('Error uploading file');
      const data = await response.json();
      setResult(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setUploading(false);
    }
  }, []);

  return { uploading, error, result, uploadFile };
};