import { AppBar, Toolbar, Box, Button, Typography, IconButton } from '@mui/material';
import { ArrowBack, Brightness4, Brightness7 } from '@mui/icons-material';
import { useDarkMode } from '../main';

export const Header: React.FC = () => {
  const { darkMode, toggleDarkMode } = useDarkMode();

  return (
    <AppBar 
      position="sticky" 
      elevation={0}
      sx={{ 
        bgcolor: darkMode ? '#16213e' : '#1e3a5f',
        color: darkMode ? '#e0e0e0' : 'white'
      }}
    >
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <img 
            src="/images/logos/Logo_Mediano.png" 
            alt="Estudio Contable JY" 
            height="50"
            style={{ objectFit: 'contain' }}
          />
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 700,
              display: { xs: 'none', sm: 'block' },
              color: 'inherit'
            }}
          >
            Cruce ARBA-AGIP
          </Typography>
        </Box>
        
        <Box sx={{ flexGrow: 1 }} />
        
        <IconButton 
          onClick={toggleDarkMode}
          sx={{ color: 'inherit' }}
          title={darkMode ? 'Modo claro' : 'Modo oscuro'}
        >
          {darkMode ? <Brightness7 /> : <Brightness4 />}
        </IconButton>
        
        <Button 
          href="/"
          startIcon={<ArrowBack />}
          sx={{ 
            textTransform: 'none',
            ml: 1,
            color: 'inherit'
          }}
        >
          Volver
        </Button>
      </Toolbar>
    </AppBar>
  );
};
