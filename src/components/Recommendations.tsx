import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Paper,
} from '@mui/material';
import {
  AutoAwesome,
  TrendingUp,
  Refresh,
  ShoppingCart,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { recommendationApi, RecommendationCard } from '../api/recommendationApi';
import * as Store from '../store/index';

interface RecommendationsProps {
  customerId?: string;
  cardId?: string;
  type?: 'hybrid' | 'collaborative' | 'history' | 'popular' | 'similar';
  limit?: number;
  title?: string;
  showReasons?: boolean;
}

const Recommendations: React.FC<RecommendationsProps> = ({
  customerId: propCustomerId,
  cardId,
  type = 'hybrid',
  limit = 8,
  title,
  showReasons = false,
}) => {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<RecommendationCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | undefined>(propCustomerId);

  // Busca customerId da sessão se não foi fornecido
  useEffect(() => {
    if (!propCustomerId) {
      const session = Store.getSession();
      if (session?.userId) {
        setCustomerId(session.userId);
      }
    }
  }, [propCustomerId]);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      let response;
      
      if (type === 'similar' && cardId) {
        response = await recommendationApi.getSimilarRecommendations(cardId, limit);
      } else if (type === 'popular') {
        response = await recommendationApi.getPopularRecommendations(limit);
      } else if (customerId) {
        response = await recommendationApi.getCustomerRecommendations(
          customerId,
          type === 'similar' ? 'hybrid' : type,
          limit
        );
      } else {
        response = await recommendationApi.getRecommendations(
          customerId,
          type === 'similar' ? 'hybrid' : type,
          limit
        );
      }

      setRecommendations(response.recommendations || []);
    } catch (err) {
      console.error('Error loading recommendations:', err);
      setError('Erro ao carregar recomendações. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecommendations();
  }, [customerId, cardId, type, limit]);

  const handleCardClick = (cardId: string) => {
    navigate(`/catalogo?card=${cardId}`);
  };

  const handleAddToCart = (card: RecommendationCard) => {
    const cardData = {
      id: card.id,
      name: card.name,
      type: card.type,
      rarity: card.rarity,
      price: card.price,
      stock: card.stock,
      image: card.image,
      description: card.description,
      category: null,
    };

    Store.addToCart(cardData, 1);
    
    // Dispara evento para atualizar carrinho
    window.dispatchEvent(new CustomEvent('cart:updated'));
  };

  const getRarityColor = (rarity: string) => {
    const colors: Record<string, string> = {
      Common: '#9e9e9e',
      Uncommon: '#4caf50',
      Rare: '#2196f3',
      Legendary: '#ff9800',
      Mythic: '#e91e63',
    };
    return colors[rarity] || colors.Common;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert 
        severity="error" 
        action={
          <IconButton onClick={loadRecommendations} size="small">
            <Refresh />
          </IconButton>
        }
      >
        {error}
      </Alert>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  const displayTitle = title || 
    (type === 'popular' ? 'Cartas Mais Populares' :
     type === 'similar' ? 'Cartas Similares' :
     'Recomendadas para Você');

  return (
    <Box sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <AutoAwesome sx={{ color: '#4f7cff' }} />
          <Typography variant="h5" component="h2" fontWeight="bold">
            {displayTitle}
          </Typography>
          {type === 'hybrid' && (
            <Chip 
              label="IA" 
              size="small" 
              sx={{ 
                bgcolor: '#4f7cff', 
                color: 'white',
                fontWeight: 'bold'
              }} 
            />
          )}
        </Box>
        <Tooltip title="Atualizar recomendações">
          <IconButton onClick={loadRecommendations} size="small">
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      <Grid container spacing={3}>
        {recommendations.map((card) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={card.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6,
                },
                position: 'relative',
              }}
            >
              {card.recommendationScore && (
                <Chip
                  label={`${Math.round(card.recommendationScore * 100)}% match`}
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    zIndex: 1,
                    bgcolor: 'rgba(79, 124, 255, 0.9)',
                    color: 'white',
                    fontWeight: 'bold',
                  }}
                />
              )}
              
              <CardActionArea onClick={() => handleCardClick(card.id)}>
                <CardMedia
                  component="img"
                  height="200"
                  image={card.image || '/images/placeholder.jpg'}
                  alt={card.name}
                  sx={{
                    objectFit: 'cover',
                    bgcolor: '#1a1a1a',
                  }}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" component="h3" noWrap fontWeight="bold">
                    {card.name}
                  </Typography>
                  
                  <Box display="flex" gap={1} mt={1} mb={1} flexWrap="wrap">
                    <Chip
                      label={card.type}
                      size="small"
                      sx={{ bgcolor: '#06d6a0', color: 'white' }}
                    />
                    <Chip
                      label={card.rarity}
                      size="small"
                      sx={{
                        bgcolor: getRarityColor(card.rarity),
                        color: 'white',
                      }}
                    />
                  </Box>

                  {card.description && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 1,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {card.description}
                    </Typography>
                  )}

                  {showReasons && card.recommendationReasons && card.recommendationReasons.length > 0 && (
                    <Paper
                      sx={{
                        p: 1,
                        mt: 1,
                        bgcolor: 'rgba(79, 124, 255, 0.1)',
                        border: '1px solid rgba(79, 124, 255, 0.3)',
                      }}
                    >
                      <Typography variant="caption" fontWeight="bold" display="block" mb={0.5}>
                        Por que recomendamos:
                      </Typography>
                      {card.recommendationReasons.map((reason, idx) => (
                        <Typography key={idx} variant="caption" display="block" color="text.secondary">
                          • {reason}
                        </Typography>
                      ))}
                    </Paper>
                  )}

                  <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                    <Typography variant="h6" color="primary" fontWeight="bold">
                      R$ {card.price.toFixed(2)}
                    </Typography>
                    <Chip
                      label={card.stock > 0 ? `Estoque: ${card.stock}` : 'Sem estoque'}
                      size="small"
                      color={card.stock > 0 ? 'success' : 'error'}
                    />
                  </Box>
                </CardContent>
              </CardActionArea>

              {card.stock > 0 && (
                <Box sx={{ p: 1, pt: 0 }}>
                  <Tooltip title="Adicionar ao carrinho">
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(card);
                      }}
                      color="primary"
                      sx={{ width: '100%' }}
                    >
                      <ShoppingCart />
                      <Typography variant="body2" ml={1}>
                        Adicionar
                      </Typography>
                    </IconButton>
                  </Tooltip>
                </Box>
              )}
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Recommendations;

