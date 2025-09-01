import React from 'react';
import { Box, Typography } from '@mui/material';

const Checkout: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Finalizar Compra
      </Typography>
      <Typography>
        Esta página permitirá finalizar a compra.
      </Typography>
    </Box>
  );
};

export default Checkout;