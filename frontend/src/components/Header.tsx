import React from 'react';
import { AppBar, Toolbar, Typography, Box, Button } from '@mui/material';
import { TableChart, ArrowBack } from '@mui/icons-material';

export const Header: React.FC = () => {
  return (
    <AppBar position="sticky" elevation={0} sx={{ bgcolor: '#1e3a5f' }}>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ 
            background: 'rgba(255,255,255,0.15)',
            p: 1,
            borderRadius: 2,
          }}>
            <TableChart sx={{ color: 'white' }} />
          </Box>
          <Typography variant="h6" component="h1" sx={{ fontWeight: 700, color: 'white' }}>
            Cruce{' '}
            <Box component="span" sx={{ color: '#90caf9' }}>ARBA</Box>
            {' - '}
            <Box component="span" sx={{ color: '#a5d6a7' }}>AGIP</Box>
          </Typography>
        </Box>
        
        <Box sx={{ flexGrow: 1 }} />
        
        <Button 
          href="/"
          startIcon={<ArrowBack />}
          sx={{ 
            color: 'white', 
            textTransform: 'none',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
          }}
        >
          Volver al Estudio
        </Button>
      </Toolbar>
    </AppBar>
  );
};
