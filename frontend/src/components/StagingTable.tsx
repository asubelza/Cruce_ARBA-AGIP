import React from 'react';
import { Card, CardHeader, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, IconButton } from '@mui/material';
import { Delete } from '@mui/icons-material';
import { StagingItem } from '../types';

interface StagingTableProps {
  staging: StagingItem[];
  onClear: () => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(value);
};

export const StagingTable: React.FC<StagingTableProps> = ({ staging, onClear }) => {
  return (
    <Card sx={{ mb: 3 }}>
      <CardHeader
        title="Staging de Cruces (Cartesiano)"
        titleTypographyProps={{ fontWeight: 600, sx: { color: 'white' } }}
        action={
          <IconButton onClick={onClear} sx={{ color: 'white' }}>
            <Delete />
          </IconButton>
        }
        sx={{ 
          bgcolor: '#2d8659',
        }}
      />
      <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
        <TableContainer sx={{ maxHeight: 300 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ bgcolor: '#f8f9fa', color: '#1e3a5f', fontWeight: 600 }}>RET ID</TableCell>
                <TableCell sx={{ bgcolor: '#f8f9fa', color: '#1e3a5f', fontWeight: 600 }}>PLAT ID</TableCell>
                <TableCell sx={{ bgcolor: '#f8f9fa', color: '#1e3a5f', fontWeight: 600 }}>CUIT</TableCell>
                <TableCell align="right" sx={{ bgcolor: '#f8f9fa', color: '#1e3a5f', fontWeight: 600 }}>Monto RET</TableCell>
                <TableCell align="right" sx={{ bgcolor: '#f8f9fa', color: '#1e3a5f', fontWeight: 600 }}>Monto PLAT</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {staging.map((item, idx) => (
                <TableRow key={idx} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#6c757d' }}>
                      {item.ret_id.slice(-8)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#6c757d' }}>
                      {item.plat_id.slice(-8)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#1e3a5f' }}>
                      {item.cuit_ret}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#1e3a5f' }}>
                      {formatCurrency(item.monto_ret)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#2d8659' }}>
                      {formatCurrency(item.monto_plat)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};
