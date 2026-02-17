import React from 'react';
import { AppBar, Toolbar, Typography, Box, IconButton, Tooltip } from '@mui/material';
import { TableChart, Brightness4, Brightness7 } from '@mui/icons-material';

interface HeaderProps {
  darkMode?: boolean;
  toggleDarkMode?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ darkMode = true, toggleDarkMode }) => {
  return (
    <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ 
            background: 'linear-gradient(135deg, #0095f6 0%, #e1306c 100%)',
            p: 1,
            borderRadius: 2,
          }}>
            <TableChart sx={{ color: 'white' }} />
          </Box>
          <Typography variant="h6" component="h1" sx={{ fontWeight: 700 }}>
            Cruce{' '}
            <Box component="span" sx={{ color: 'primary.main' }}>ARBA</Box>
            {' - '}
            <Box component="span" sx={{ color: 'success.main' }}>AGIP</Box>
          </Typography>
        </Box>
        
        <Box sx={{ flexGrow: 1 }} />
        
        {toggleDarkMode && (
          <Tooltip title={darkMode ? 'Modo claro' : 'Modo oscuro'}>
            <IconButton onClick={toggleDarkMode} color="inherit">
              {darkMode ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
          </Tooltip>
        )}
      </Toolbar>
    </AppBar>
  );
};
