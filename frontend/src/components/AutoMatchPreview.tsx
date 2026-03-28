import React, { useState } from 'react';
import { Card, CardHeader, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, IconButton, Chip, Checkbox, Button, Stack } from '@mui/material';
import { Delete, CheckCircle } from '@mui/icons-material';
import { MatchResult } from '../types';

interface AutoMatchPreviewProps {
  matches: MatchResult[];
  onConfirm: (selectedMatches: MatchResult[]) => void;
  onClear: () => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(value);
};

export const AutoMatchPreview: React.FC<AutoMatchPreviewProps> = ({ matches, onConfirm, onClear }) => {
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set(matches.map((_, i) => i)));

  const toggleSelection = (index: number) => {
    const newSet = new Set(selectedIndices);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setSelectedIndices(newSet);
  };

  const selectAll = () => {
    setSelectedIndices(new Set(matches.map((_, i) => i)));
  };

  const deselectAll = () => {
    setSelectedIndices(new Set());
  };

  const handleConfirm = () => {
    const selectedMatches = matches.filter((_, i) => selectedIndices.has(i));
    onConfirm(selectedMatches);
  };

  const selectedCount = selectedIndices.size;

  return (
    <Card sx={{ mb: 3 }}>
      <CardHeader
        title={`Auto-Match: ${matches.length} cruces encontrados (${selectedCount} seleccionados)`}
        titleTypographyProps={{ fontWeight: 600, sx: { color: 'white' } }}
        avatar={
          <Chip 
            label={`${selectedCount}/${matches.length}`}
            size="small"
            sx={{ 
              bgcolor: 'white',
              color: selectedCount === matches.length ? '#2d8659' : '#1e3a5f',
              fontWeight: 600
            }}
          />
        }
        action={
          <Stack direction="row" spacing={1}>
            <Button 
              size="small" 
              onClick={selectAll}
              sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
            >
              Todos
            </Button>
            <Button 
              size="small" 
              onClick={deselectAll}
              sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
            >
              Ninguno
            </Button>
            <IconButton 
              onClick={handleConfirm} 
              title="Confirmar seleccionados" 
              disabled={selectedCount === 0}
              sx={{ color: selectedCount > 0 ? '#a5d6a7' : 'rgba(255,255,255,0.5)' }}
            >
              <CheckCircle />
            </IconButton>
            <IconButton onClick={onClear} title="Descartar todo" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              <Delete />
            </IconButton>
          </Stack>
        }
        sx={{ 
          bgcolor: '#1e3a5f',
        }}
      />
      <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
        <TableContainer sx={{ maxHeight: 300 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox" sx={{ bgcolor: '#f8f9fa', color: '#1e3a5f', fontWeight: 600 }}>✓</TableCell>
                <TableCell sx={{ bgcolor: '#f8f9fa', color: '#1e3a5f', fontWeight: 600 }}>CUIT</TableCell>
                <TableCell align="right" sx={{ bgcolor: '#f8f9fa', color: '#1e3a5f', fontWeight: 600 }}>Monto RET</TableCell>
                <TableCell align="right" sx={{ bgcolor: '#f8f9fa', color: '#1e3a5f', fontWeight: 600 }}>Monto PLAT</TableCell>
                <TableCell sx={{ bgcolor: '#f8f9fa', color: '#1e3a5f', fontWeight: 600 }}>Período RET</TableCell>
                <TableCell sx={{ bgcolor: '#f8f9fa', color: '#1e3a5f', fontWeight: 600 }}>Período PLAT</TableCell>
                <TableCell sx={{ bgcolor: '#f8f9fa', color: '#1e3a5f', fontWeight: 600 }}>Estado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {matches.map((item, idx) => {
                const amountsMatch = Math.abs(item.monto_ret - item.monto_plat) <= 0.01;
                const isSelected = selectedIndices.has(idx);
                return (
                  <TableRow 
                    key={idx} 
                    hover
                    selected={isSelected}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={isSelected}
                        onChange={() => toggleSelection(idx)}
                        sx={{ color: '#1e3a5f', '&.Mui-checked': { color: '#1e3a5f' } }}
                        size="small"
                      />
                    </TableCell>
                    <TableCell onClick={() => toggleSelection(idx)}>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#1e3a5f' }}>
                        {item.cuit}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" onClick={() => toggleSelection(idx)}>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#1e3a5f' }}>
                        {formatCurrency(item.monto_ret)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" onClick={() => toggleSelection(idx)}>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#2d8659' }}>
                        {formatCurrency(item.monto_plat)}
                      </Typography>
                    </TableCell>
                    <TableCell onClick={() => toggleSelection(idx)}>
                      <Typography variant="body2" sx={{ color: '#6c757d' }}>
                        {item.periodo_ret}
                      </Typography>
                    </TableCell>
                    <TableCell onClick={() => toggleSelection(idx)}>
                      <Typography variant="body2" sx={{ color: '#6c757d' }}>
                        {item.periodo_plat}
                      </Typography>
                    </TableCell>
                    <TableCell onClick={() => toggleSelection(idx)}>
                      <Chip 
                        label={amountsMatch ? 'OK' : 'DIF'}
                        size="small"
                        sx={{ 
                          bgcolor: amountsMatch ? '#e8f5e9' : '#fff3e0',
                          color: amountsMatch ? '#2d8659' : '#f57c00',
                          fontWeight: 600
                        }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};
