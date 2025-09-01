import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Box,
  TextField,
  MenuItem,
  Chip,
  Snackbar,
  Alert,
} from '@mui/material';
import { ShoppingCart } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getCards, addToCart } from '../store';
import { Card as CardType } from '../types';

const Catalogo: React.FC = () => {
  const navigate = useNavigate();
  const [cards, setCards] = useState<CardType[]>([]);
  const [filteredCards, setFilteredCards] = useState<CardType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [rarityFilter, setRarityFilter] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  useEffect(() => {
    const loadedCards = getCards();
    setCards(loadedCards);
    setFilteredCards(loadedCards);
  }, []);

  useEffect(() => {
    let filtered = cards;

    if (searchTerm) {
      filtered = filtered.filter((card: CardType) =>
        card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter) {
      filtered = filtered.filter((card: CardType) => card.type === typeFilter);
    }

    if (rarityFilter) {
      filtered = filtered.filter((card: CardType) => card.rarity === rarityFilter);
    }

    setFilteredCards(filtered);
  }, [cards, searchTerm, typeFilter, rarityFilter]);

  const handleAddToCart = (card: CardType) => {
    addToCart(card, 1);
    setSnackbarOpen(true);
  };

  const getUniqueValues = (key: keyof CardType) => {
    return Array.from(new Set(cards.map((card: CardType) => card[key]))).filter(Boolean);
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'common': return 'default';
      case 'uncommon': return 'primary';
      case 'rare': return 'secondary';
      case 'epic': return 'warning';
      case 'legendary': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Catálogo de Cartas
      </Typography>

      {/* Filters */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          label="Buscar cartas..."
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ minWidth: 200 }}
        />
        <TextField
          select
          label="Tipo"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          sx={{ minWidth: 120 }}
        >
          <MenuItem value="">Todos</MenuItem>
          {getUniqueValues('type').map((type: any) => (
            <MenuItem key={type} value={type}>
              {type}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Raridade"
          value={rarityFilter}
          onChange={(e) => setRarityFilter(e.target.value)}
          sx={{ minWidth: 120 }}
        >
          <MenuItem value="">Todas</MenuItem>
          {getUniqueValues('rarity').map((rarity: any) => (
            <MenuItem key={rarity} value={rarity}>
              {rarity}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {/* Cards Grid */}
      <Grid container spacing={3}>
        {filteredCards.map((card: CardType) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={card.id}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                }
              }}
              onClick={() => navigate(`/card/${card.id}`)}
            >
              <CardMedia
                component="div"
                sx={{
                  height: 200,
                  backgroundColor: 'grey.300',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography variant="h6" color="text.secondary">
                  {card.name}
                </Typography>
              </CardMedia>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h6" component="h2">
                  {card.name}
                </Typography>
                <Box sx={{ mb: 1 }}>
                  <Chip 
                    label={card.type} 
                    size="small" 
                    sx={{ mr: 1 }} 
                  />
                  <Chip 
                    label={card.rarity} 
                    size="small" 
                    color={getRarityColor(card.rarity) as any}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {card.description}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" color="primary">
                    R$ {card.price.toFixed(2)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Estoque: {card.stock}
                  </Typography>
                </Box>
              </CardContent>
              <Box sx={{ p: 2, pt: 0 }}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<ShoppingCart />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToCart(card);
                  }}
                  disabled={card.stock === 0}
                >
                  {card.stock === 0 ? 'Sem Estoque' : 'Adicionar ao Carrinho'}
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredCards.length === 0 && (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="h6" color="text.secondary">
            Nenhuma carta encontrada
          </Typography>
        </Box>
      )}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert severity="success" onClose={() => setSnackbarOpen(false)}>
          Carta adicionada ao carrinho!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Catalogo;