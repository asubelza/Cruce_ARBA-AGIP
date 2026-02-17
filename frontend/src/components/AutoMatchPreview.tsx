import React, { useState } from 'react';
import { Card, CardHeader, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, IconButton, Box, Chip, Checkbox, Button, Stack } from '@mui/material';
import { Delete, Check, CheckCircle } from '@mui/icons-material';
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
    <Card sx={{ mb: 3 }} elevation={2}>
      <CardHeader
        title={`Auto-Match: ${matches.length} cruces encontrados (${selectedCount} seleccionados)`}
        titleTypographyProps={{ fontWeight: 600 }}
        avatar={
          <Chip 
            label={`${selectedCount}/${matches.length}`}
            color={selectedCount === matches.length ? 'success' : 'primary'}
            size="small"
          />
        }
        action={
          <Stack direction="row" spacing={1}>
            <Button size="small" onClick={selectAll}>Todos</Button>
            <Button size="small" onClick={deselectAll}>Ninguno</Button>
            <IconButton onClick={handleConfirm} color="success" title="Confirmar seleccionados" disabled={selectedCount === 0}>
              <CheckCircle />
            </IconButton>
            <IconButton onClick={onClear} color="error" title="Descartar todo">
              <Delete />
            </IconButton>
          </Stack>
        }
        sx={{ 
          bgcolor: 'primary.main',
          '& .MuiCardHeader-title': { color: 'white' },
          '& .MuiButton-root': { color: 'white' },
        }}
      />
      <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
        <TableContainer sx={{ maxHeight: 300 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox" sx={{ bgcolor: 'background.paper' }}>✓</TableCell>
                <TableCell sx={{ bgcolor: 'background.paper' }}>CUIT</TableCell>
                <TableCell align="right" sx={{ bgcolor: 'background.paper' }}>Monto RET</TableCell>
                <TableCell align="right" sx={{ bgcolor: 'background.paper' }}>Monto PLAT</TableCell>
                <TableCell sx={{ bgcolor: 'background.paper' }}>Período RET</TableCell>
                <TableCell sx={{ bgcolor: 'background.paper' }}>Período PLAT</TableCell>
                <TableCell sx={{ bgcolor: 'background.paper' }}>Estado</TableCell>
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
                        color="primary"
                        size="small"
                      />
                    </TableCell>
                    <TableCell onClick={() => toggleSelection(idx)}>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {item.cuit}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" onClick={() => toggleSelection(idx)}>
                      <Typography variant="body2" color="primary.main" sx={{ fontFamily: 'monospace' }}>
                        {formatCurrency(item.monto_ret)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" onClick={() => toggleSelection(idx)}>
                      <Typography variant="body2" color="success.main" sx={{ fontFamily: 'monospace' }}>
                        {formatCurrency(item.monto_plat)}
                      </Typography>
                    </TableCell>
                    <TableCell onClick={() => toggleSelection(idx)}>
                      <Typography variant="body2" color="text.secondary">
                        {item.periodo_ret}
                      </Typography>
                    </TableCell>
                    <TableCell onClick={() => toggleSelection(idx)}>
                      <Typography variant="body2" color="text.secondary">
                        {item.periodo_plat}
                      </Typography>
                    </TableCell>
                    <TableCell onClick={() => toggleSelection(idx)}>
                      <Chip 
                        label={amountsMatch ? 'OK' : 'DIF'}
                        color={amountsMatch ? 'success' : 'warning'}
                        size="small"
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
