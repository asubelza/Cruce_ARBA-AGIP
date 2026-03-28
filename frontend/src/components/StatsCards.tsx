import React from 'react';
import { Box, Card, CardContent, Typography, Skeleton, Stack } from '@mui/material';
import { TableChart, Storage, CheckCircle, Warning } from '@mui/icons-material';
import { Stats } from '../types';

interface StatsCardProps {
  stats: Stats | null;
  loading: boolean;
}

const StatCard = ({ title, value, icon: Icon, color }: { title: string; value: number; icon: React.ElementType; color: string }) => (
  <Card sx={{ height: '100%', border: `2px solid ${color}20` }}>
    <CardContent>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="body2" sx={{ color: '#6c757d', mb: 0.5 }}>
            {title}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e3a5f' }}>
            {value.toLocaleString()}
          </Typography>
        </Box>
        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: `${color}15` }}>
          <Icon sx={{ color }} />
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

export const StatsCards: React.FC<StatsCardProps> = ({ stats, loading }) => {
  if (loading || !stats) {
    return (
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent>
              <Skeleton variant="text" width="60%" height={24} />
              <Skeleton variant="text" width="40%" height={48} />
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  }

  const cards = [
    { title: 'RETIENCION Pendientes', value: stats.pend_retencion, icon: TableChart, color: '#f59e0b' },
    { title: 'PLATAFORMA Pendientes', value: stats.pend_plataforma, icon: Storage, color: '#f59e0b' },
    { title: 'Total Pendientes', value: stats.pend_totales, icon: Warning, color: '#e1306c' },
    { title: 'Cruces OK', value: stats.ok_historicos, icon: CheckCircle, color: '#2d8659' },
  ];

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
      {cards.map((card, index) => (
        <StatCard key={index} {...card} />
      ))}
    </Box>
  );
};
