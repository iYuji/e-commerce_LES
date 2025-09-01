import React from 'react';
import { Box, Typography } from '@mui/material';

const CardDetail: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Detalhes da Carta
      </Typography>
      <Typography>
        Esta página mostrará os detalhes de uma carta específica.
      </Typography>
    </Box>
  );
};

export default CardDetail;