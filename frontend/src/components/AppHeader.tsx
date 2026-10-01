import React, { useState, useEffect, useCallback } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Box, 
  IconButton, 
  Tooltip, 
  Menu, 
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip
} from '@mui/material';
import { 
  TableChart, 
  Brightness4, 
  Brightness7, 
  Download, 
  HelpOutline,
  KeyboardArrowDown,
  Settings,
  DensityMedium,
  DensityLarge,
  DensitySmall
} from '@mui/icons-material';
import { useECJYTokens } from '../theme/ECJYThemeProvider';
import { useFeatureFlagEnabled } from '../hooks/useFeatureFlag';
import { useDensity, DensityMode } from '../hooks/useDensity';
import { HeroOpening } from './HeroOpening';
import { StateIndicators } from './StateIndicators';
import { DensitySelector } from './DensitySelector';

interface AppHeaderProps {
  /** Whether to show HeroOpening on first load */
  showHero?: boolean;
  /** Hero completion callback */
  onHeroComplete?: () => void;
  /** ECJY metrics for StateIndicators compact mode */
  metrics?: {
    precision: { value: number; previous: number; threshold: number };
    control: { value: number; previous: number };
    detection: { value: number; previous: number; threshold: number };
    order: { value: number; previous: number };
    security: { value: number; previous: number; threshold: number };
  };
  /** Dark mode state */
  darkMode?: boolean;
  /** Toggle dark mode callback */
  toggleDarkMode?: () => void;
  /** Export callback */
  onExport?: () => void;
  /** Help/shortcuts modal open state */
  helpOpen?: boolean;
  /** Help/shortcuts modal close callback */
  onHelpClose?: () => void;
  /** Help/shortcuts modal open callback */
  onHelpOpen?: () => void;
}

interface Shortcut {
  keys: string;
  description: string;
}

const SHORTCUTS: Shortcut[] = [
  { keys: 'Ctrl + N', description: 'Nuevo cruce' },
  { keys: 'Ctrl + O', description: 'Cargar archivo' },
  { keys: 'Ctrl + E', description: 'Exportar datos' },
  { keys: 'Ctrl + F', description: 'Buscar CUIT' },
  { keys: 'Ctrl + D', description: 'Cambiar densidad' },
  { keys: 'Ctrl + Shift + H', description: 'Ayuda / Atajos' },
  { keys: 'Escape', description: 'Cerrar modales / Saltar animación' },
  { keys: '← / →', description: 'Navegar conexiones' },
  { keys: '↑ / ↓', description: 'Cambiar tabla' },
  { keys: 'Enter', description: 'Confirmar selección' },
  { keys: 'Space', description: 'Toggle selección' },
];

export function AppHeader({
  showHero = false,
  onHeroComplete,
  metrics,
  darkMode = true,
  toggleDarkMode,
  onExport,
  helpOpen = false,
  onHelpClose,
  onHelpOpen,
}: AppHeaderProps) {
  const { tokens } = useECJYTokens();
  const headerEnabled = useFeatureFlagEnabled('APP_HEADER');
  const { density, setDensity } = useDensity();
  const [heroCompleted, setHeroCompleted] = useState(!showHero);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [helpDialogOpen, setHelpDialogOpen] = useState(helpOpen);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setHelpDialogOpen(helpOpen);
  }, [helpOpen]);

  const handleHeroComplete = useCallback(() => {
    setHeroCompleted(true);
    onHeroComplete?.();
  }, [onHeroComplete]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDensityChange = (newDensity: DensityMode) => {
    setDensity(newDensity);
    handleMenuClose();
  };

  const handleHelpOpen = () => {
    setHelpDialogOpen(true);
    onHelpOpen?.();
  };

  const handleHelpClose = () => {
    setHelpDialogOpen(false);
    onHelpClose?.();
  };

  const handleExport = () => {
    onExport?.();
    handleMenuClose();
  };

  const handleThemeToggle = () => {
    toggleDarkMode?.();
    handleMenuClose();
  };

  if (!headerEnabled) {
    return null;
  }

  if (!mounted) {
    return (
      <AppBar position="sticky" elevation={0} sx={{ 
        bgcolor: 'background.paper', 
        borderBottom: 1, 
        borderColor: 'divider',
        zIndex: 1100,
      }}>
        <Toolbar />
      </AppBar>
    );
  }

  // Show HeroOpening on first load
  if (showHero && !heroCompleted) {
    return (
      <>
        <HeroOpening onComplete={handleHeroComplete} />
        <AppBar position="sticky" elevation={0} sx={{ 
          bgcolor: 'background.paper', 
          borderBottom: 1, 
          borderColor: 'divider',
          zIndex: 1100,
        }}>
          <Toolbar />
        </AppBar>
      </>
    );
  }

  return (
    <AppBar position="sticky" elevation={0} sx={{ 
      bgcolor: 'background.paper', 
      borderBottom: 1, 
      borderColor: 'divider',
      zIndex: 1100,
    }}>
      <Toolbar variant="dense" sx={{ minHeight: 56 }}>
        {/* Left side - ECJY Branding */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mr: 2, flexShrink: 0 }}>
          <Box sx={{ 
            background: 'linear-gradient(135deg, #00D4AA 0%, #0095F6 100%)',
            p: 1,
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0, 212, 170, 0.3)',
          }}>
            <TableChart sx={{ color: 'white', fontSize: 22 }} />
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
            <Typography 
              variant="h6" 
              component="h1" 
              sx={{ 
                fontWeight: 700, 
                fontSize: '1.1rem',
                background: 'linear-gradient(135deg, #00D4AA 0%, #0095F6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Cruce ARBA - AGIP
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                fontFamily: tokens.typography.fontFamilies.body,
                fontWeight: 500,
                color: tokens.colors.text.tertiary,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              ECJY · Precisión · Control · Orden
            </Typography>
          </Box>
        </Box>

        {/* Center - StateIndicators Compact Mode */}
        {metrics && (
          <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', maxWidth: 600, mx: 2 }}>
            <StateIndicators metrics={metrics} compact={true} />
          </Box>
        )}

        {/* Right side - Global Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
          {/* Density Selector */}
          <Tooltip title="Densidad de tabla">
            <DensitySelector 
              density={density} 
              onChange={handleDensityChange}
              size="small"
            />
          </Tooltip>

          {/* Theme Toggle */}
          {toggleDarkMode && (
            <Tooltip title={darkMode ? 'Modo claro' : 'Modo oscuro'}>
              <IconButton onClick={handleThemeToggle} color="inherit" size="small">
                {darkMode ? <Brightness7 fontSize="small" /> : <Brightness4 fontSize="small" />}
              </IconButton>
            </Tooltip>
          )}

          {/* Export */}
          {onExport && (
            <Tooltip title="Exportar datos">
              <IconButton onClick={handleExport} color="inherit" size="small">
                <Download fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          {/* Help/Shortcuts */}
          <Tooltip title="Atajos de teclado">
            <IconButton onClick={handleHelpOpen} color="inherit" size="small">
              <HelpOutline fontSize="small" />
            </IconButton>
          </Tooltip>

          {/* Settings Menu */}
          <Tooltip title="Configuración">
            <IconButton onClick={handleMenuOpen} color="inherit" size="small">
              <Settings fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{
            sx: {
              minWidth: 220,
              bgcolor: tokens.colors.surface.panel,
              border: `1px solid ${tokens.colors.surface.border}`,
            },
          }}
        >
          <ListItem disableGutters sx={{ px: 2, py: 1, borderBottom: `1px solid ${tokens.colors.surface.border}` }}>
            <ListItemText 
              primary="Configuración" 
              primaryTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
            />
          </ListItem>
          
          <ListItem disableGutters sx={{ px: 2, py: 0.5 }}>
            <ListItemIcon sx={{ minWidth: 40 }}>
              <DensitySmall fontSize="small" color={density === 'comfortable' ? 'primary' : 'action'} />
            </ListItemIcon>
            <ListItemText primary="Cómodo (24px)" />
            <Chip 
              label="Activo" 
              size="small" 
              color={density === 'comfortable' ? 'success' : 'default'} 
              variant={density === 'comfortable' ? 'filled' : 'outlined'}
              onClick={() => handleDensityChange('comfortable')}
            />
          </ListItem>
          
          <ListItem disableGutters sx={{ px: 2, py: 0.5 }}>
            <ListItemIcon sx={{ minWidth: 40 }}>
              <DensityMedium fontSize="small" color={density === 'compact' ? 'primary' : 'action'} />
            </ListItemIcon>
            <ListItemText primary="Compacto (18px)" />
            <Chip 
              label="Activo" 
              size="small" 
              color={density === 'compact' ? 'success' : 'default'} 
              variant={density === 'compact' ? 'filled' : 'outlined'}
              onClick={() => handleDensityChange('compact')}
            />
          </ListItem>
          
          <ListItem disableGutters sx={{ px: 2, py: 0.5 }}>
            <ListItemIcon sx={{ minWidth: 40 }}>
              <DensityLarge fontSize="small" color={density === 'dense' ? 'primary' : 'action'} />
            </ListItemIcon>
            <ListItemText primary="Denso (14px)" />
            <Chip 
              label="Activo" 
              size="small" 
              color={density === 'dense' ? 'success' : 'default'} 
              variant={density === 'dense' ? 'filled' : 'outlined'}
              onClick={() => handleDensityChange('dense')}
            />
          </ListItem>

          <Divider sx={{ my: 1 }} />

          <ListItem disableGutters sx={{ px: 2, py: 0.5 }} onClick={handleThemeToggle}>
            <ListItemIcon sx={{ minWidth: 40 }}>
              {darkMode ? <Brightness7 fontSize="small" /> : <Brightness4 fontSize="small" />}
            </ListItemIcon>
            <ListItemText primary={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'} />
          </ListItem>

          <Divider sx={{ my: 1 }} />

          <ListItem disableGutters sx={{ px: 2, py: 0.5 }} onClick={handleExport}>
            <ListItemIcon sx={{ minWidth: 40 }}>
              <Download fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Exportar datos" />
          </ListItem>

          <ListItem disableGutters sx={{ px: 2, py: 0.5 }} onClick={handleHelpOpen}>
            <ListItemIcon sx={{ minWidth: 40 }}>
              <HelpOutline fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Atajos de teclado" />
          </ListItem>
        </Menu>

        {/* Help/Shortcuts Dialog */}
        <Dialog open={helpDialogOpen} onClose={handleHelpClose} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <HelpOutline color="primary" />
              <Typography variant="h6">Atajos de teclado</Typography>
            </Box>
            <IconButton onClick={handleHelpClose} size="small">
              <KeyboardArrowDown />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <List dense>
              {SHORTCUTS.map((shortcut, index) => (
                <ListItem key={index} sx={{ py: 0.5 }}>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 300 }}>
                        <Box sx={{ 
                          fontFamily: tokens.typography.fontFamilies.mono,
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          color: tokens.colors.semantic.control.base,
                          backgroundColor: tokens.colors.semantic.control.subtle,
                          px: 1,
                          py: 0.2,
                          borderRadius: 1,
                          minWidth: 120,
                          textAlign: 'center',
                        }}>
                          {shortcut.keys}
                        </Box>
                        <Typography variant="body2">{shortcut.description}</Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleHelpClose}>Cerrar</Button>
          </DialogActions>
        </Dialog>
      </Toolbar>
    </AppBar>
  );
}

export default AppHeader;