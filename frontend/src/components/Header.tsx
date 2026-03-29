import { AppBar, Toolbar, Box, Button, Typography } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';

export const Header: React.FC = () => {
  return (
    <AppBar position="sticky" elevation={0} sx={{ bgcolor: '#1e3a5f' }}>
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
              color: 'white', 
              fontWeight: 700,
              display: { xs: 'none', sm: 'block' }
            }}
          >
            Estudio Contable JY
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
