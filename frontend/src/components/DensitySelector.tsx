import React, { useMemo } from 'react';
import { Menu, MenuItem, IconButton, Tooltip, ListItemIcon, ListItemText, Chip, Box } from '@mui/material';
import { DensitySmall, DensityMedium, DensityLarge } from '@mui/icons-material';
import { DensityMode } from '../hooks/useDensity';

interface DensitySelectorProps {
  density: DensityMode;
  onChange: (density: DensityMode) => void;
  size?: 'small' | 'medium';
  showLabel?: boolean;
}

const DENSITY_OPTIONS: { value: DensityMode; label: string; icon: React.ElementType; rowHeight: number }[] = [
  { value: 'comfortable', label: 'Cómodo', icon: DensitySmall, rowHeight: 24 },
  { value: 'compact', label: 'Compacto', icon: DensityMedium, rowHeight: 18 },
  { value: 'dense', label: 'Denso', icon: DensityLarge, rowHeight: 14 },
];

export function DensitySelector({ 
  density, 
  onChange, 
  size = 'medium',
  showLabel = false,
}: DensitySelectorProps) {
  const currentOption = useMemo(() => 
    DENSITY_OPTIONS.find(opt => opt.value === density), 
    [density]
  );

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (newDensity: DensityMode) => {
    onChange(newDensity);
    handleClose();
  };

  return (
    <>
      <Tooltip title={`Densidad: ${currentOption?.label} (${currentOption?.rowHeight}px)`}>
        <IconButton
          onClick={handleClick}
          size={size}
          color="inherit"
          aria-label="Selector de densidad"
          aria-haspopup="true"
          aria-expanded={anchorEl !== null}
        >
          {React.createElement(currentOption?.icon || DensityMedium, { fontSize: size })}
          {showLabel && (
            <Box sx={{ ml: 0.5, display: { xs: 'none', sm: 'block' } }}>
              {currentOption?.label}
            </Box>
          )}
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            minWidth: 200,
          },
        }}
      >
        {DENSITY_OPTIONS.map((option) => (
          <MenuItem
            key={option.value}
            onClick={() => handleSelect(option.value)}
            disabled={option.value === density}
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              opacity: option.value === density ? 0.6 : 1,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <ListItemIcon sx={{ minWidth: 40, color: option.value === density ? 'primary' : 'inherit' }}>
                <option.icon fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary={option.label}
                secondary={`${option.rowHeight}px por fila`}
              />
            </Box>
            {option.value === density && (
              <Chip 
                label="Activo" 
                size="small" 
                color="success" 
                variant="filled"
              />
            )}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

export default DensitySelector;