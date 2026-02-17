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
    primary: { bg: 'primary.main', opacity: 0.1 },
    success: { bg: 'success.main', opacity: 0.1 },
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }} elevation={2}>
      <CardHeader
        title={title}
        titleTypographyProps={{ fontWeight: 600 }}
        avatar={
          <Chip 
            label={`${data.length} registros`}
            size="small"
            color={color}
            variant="outlined"
          />
        }
        sx={{ 
          bgcolor: `${colorMap[color].bg}`,
          '& .MuiCardHeader-title': { color: 'white' },
        }}
      />
      <CardContent sx={{ flex: 1, p: 0, '&:last-child': { pb: 0 } }}>
        <TableContainer sx={{ maxHeight: 400 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox" sx={{ bgcolor: 'background.paper' }}>Sel</TableCell>
                <TableCell sx={{ bgcolor: 'background.paper' }}>CUIT</TableCell>
                <TableCell align="right" sx={{ bgcolor: 'background.paper' }}>Monto</TableCell>
                <TableCell sx={{ bgcolor: 'background.paper' }}>Período</TableCell>
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
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={isSelected}
                        color={color}
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleSelection(itemId);
                        }}
                      />
                    </TableCell>
                    <TableCell onClick={() => onToggleSelection(itemId)}>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {item.cuit}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" onClick={() => onToggleSelection(itemId)}>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 500 }}>
                        {formatCurrency(item.monto)}
                      </Typography>
                    </TableCell>
                    <TableCell onClick={() => onToggleSelection(itemId)}>
                      <Typography variant="body2" color="text.secondary">
                        {item.periodo}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
              {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
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
