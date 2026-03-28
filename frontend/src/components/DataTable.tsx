import React from 'react';
import { Card, CardHeader, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Checkbox, Chip, Box } from '@mui/material';
import { Ingreso } from '../types';

interface DataTableProps {
  title: string;
  data: Ingreso[];
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
  color: 'primary' | 'success';
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(value);
};

export const DataTable: React.FC<DataTableProps> = ({ 
  title, 
  data, 
  selectedIds, 
  onToggleSelection,
  color 
}) => {
  const colorMap = {
    primary: { bg: '#1e3a5f', text: 'white' },
    success: { bg: '#2d8659', text: 'white' },
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        title={title}
        titleTypographyProps={{ fontWeight: 600, sx: { color: colorMap[color].text } }}
        avatar={
          <Chip 
            label={`${data.length} registros`}
            size="small"
            sx={{ 
              bgcolor: 'white',
              color: colorMap[color].bg,
              border: `1px solid ${colorMap[color].bg}`,
              fontWeight: 600
            }}
          />
        }
        sx={{ 
          bgcolor: colorMap[color].bg,
        }}
      />
      <CardContent sx={{ flex: 1, p: 0, '&:last-child': { pb: 0 } }}>
        <TableContainer sx={{ maxHeight: 400 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox" sx={{ bgcolor: '#f8f9fa', color: '#1e3a5f', fontWeight: 600 }}>Sel</TableCell>
                <TableCell sx={{ bgcolor: '#f8f9fa', color: '#1e3a5f', fontWeight: 600 }}>CUIT</TableCell>
                <TableCell align="right" sx={{ bgcolor: '#f8f9fa', color: '#1e3a5f', fontWeight: 600 }}>Monto</TableCell>
                <TableCell sx={{ bgcolor: '#f8f9fa', color: '#1e3a5f', fontWeight: 600 }}>Período</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((item) => {
                const itemId = item._id || item.id || '';
                const isSelected = selectedIds.has(itemId);
                return (
                  <TableRow
                    key={itemId}
                    hover
                    selected={isSelected}
                    sx={{ 
                      cursor: 'pointer',
                      '&.Mui-selected': {
                        bgcolor: color === 'primary' ? '#e3f2fd' : '#e8f5e9',
                      }
                    }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={isSelected}
                        sx={{ 
                          color: colorMap[color].bg,
                          '&.Mui-checked': { color: colorMap[color].bg }
                        }}
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleSelection(itemId);
                        }}
                      />
                    </TableCell>
                    <TableCell onClick={() => onToggleSelection(itemId)}>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#1e3a5f' }}>
                        {item.cuit}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" onClick={() => onToggleSelection(itemId)}>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 500, color: '#1e3a5f' }}>
                        {formatCurrency(item.monto)}
                      </Typography>
                    </TableCell>
                    <TableCell onClick={() => onToggleSelection(itemId)}>
                      <Typography variant="body2" sx={{ color: '#6c757d' }}>
                        {item.periodo}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
              {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                    <Typography sx={{ color: '#6c757d' }}>
                      No hay registros pendientes
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};
