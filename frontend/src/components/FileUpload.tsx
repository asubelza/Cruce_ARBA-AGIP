import React, { useState, useRef } from 'react';
import { Card, CardContent, Typography, Box, Alert, Stack, CircularProgress } from '@mui/material';
import { CloudUpload, CheckCircle, InsertDriveFile } from '@mui/icons-material';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface FileUploadProps {
  onUploadSuccess: () => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onUploadSuccess }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ message: string; retencion_count: number; plataforma_count: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await uploadFile(files[0]);
    }
  };

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
    } finally {
      setUploading(false);
    }
  };

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

        <Box
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          sx={{
            border: 2,
            borderStyle: 'dashed',
            borderColor: isDragging ? 'primary.main' : 'divider',
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
            bgcolor: isDragging ? 'action.hover' : 'transparent',
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
          
          {uploading ? (
            <Stack alignItems="center" spacing={2}>
              <CircularProgress />
              <Typography color="text.secondary">Subiendo archivo...</Typography>
            </Stack>
          ) : uploadResult ? (
            <Stack alignItems="center" spacing={2}>
              <CheckCircle sx={{ fontSize: 48, color: 'success.main' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {uploadResult.message}
              </Typography>
              <Stack direction="row" spacing={3}>
                <Typography variant="body2" color="text.secondary">
                  RETIENCION: {uploadResult.retencion_count} registros
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  PLATAFORMA: {uploadResult.plataforma_count} registros
                </Typography>
              </Stack>
            </Stack>
          ) : (
            <Stack alignItems="center" spacing={2}>
              <CloudUpload sx={{ fontSize: 48, color: 'text.disabled' }} />
              <Typography>
                Arrastra un archivo aquí o haz clic para seleccionar
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Archivos Excel (.xlsx, .xls) con hojas RETENCION y PLATAFORMA
              </Typography>
            </Stack>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};
