import { AppBar, Toolbar, Box, Button } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';

export const Header: React.FC = () => {
  return (
    <AppBar position="sticky" elevation={0} sx={{ bgcolor: '#1e3a5f' }}>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <img 
            src="/images/logos/Logo_Mediano.png" 
            alt="Estudio JY" 
            height="40"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
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
