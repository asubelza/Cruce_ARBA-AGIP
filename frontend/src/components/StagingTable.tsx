import React from 'react';
import { Card, CardHeader, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, IconButton, Box } from '@mui/material';
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
    <Card sx={{ mb: 3 }} elevation={2}>
      <CardHeader
        title="Staging de Cruces (Cartesiano)"
        titleTypographyProps={{ fontWeight: 600 }}
        action={
          <IconButton onClick={onClear} color="error">
            <Delete />
          </IconButton>
        }
        sx={{ 
          bgcolor: 'secondary.main',
          '& .MuiCardHeader-title': { color: 'white' },
        }}
      />
      <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
        <TableContainer sx={{ maxHeight: 300 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ bgcolor: 'background.paper' }}>RET ID</TableCell>
                <TableCell sx={{ bgcolor: 'background.paper' }}>PLAT ID</TableCell>
                <TableCell sx={{ bgcolor: 'background.paper' }}>CUIT</TableCell>
                <TableCell align="right" sx={{ bgcolor: 'background.paper' }}>Monto RET</TableCell>
                <TableCell align="right" sx={{ bgcolor: 'background.paper' }}>Monto PLAT</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {staging.map((item, idx) => (
                <TableRow key={idx} hover>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                      {item.ret_id.slice(-8)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                      {item.plat_id.slice(-8)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {item.cuit_ret}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color="primary.main" sx={{ fontFamily: 'monospace' }}>
                      {formatCurrency(item.monto_ret)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color="success.main" sx={{ fontFamily: 'monospace' }}>
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
