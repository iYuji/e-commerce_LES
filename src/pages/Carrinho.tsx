import React from 'react';
import { Box, Typography } from '@mui/material';

const Carrinho: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Carrinho de Compras
      </Typography>
      <Typography>
        Esta página mostrará o carrinho de compras.
      </Typography>
    </Box>
  );
};

export default Carrinho;