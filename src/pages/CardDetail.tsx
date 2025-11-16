import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Typography,
  Button,
  CardMedia,
  Chip,
  IconButton,
  Snackbar,
  Alert,
  Divider,
  Paper,
  Rating,
} from "@mui/material";
import {
  Add,
  Remove,
  ShoppingCart,
  ArrowBack,
  Favorite,
  FavoriteBorder,
  Share,
} from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
import * as Store from "../store/index";
import { Card as CardType } from "../types";
import Recommendations from "../components/Recommendations";

const CardDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [card, setCard] = useState<CardType | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  useEffect(() => {
    if (id) {
      const cards = Store.getCards();
      const foundCard = cards.find((c: CardType) => c.id === id);
      setCard(foundCard || null);
    }
  }, [id]);

  const handleAddToCart = () => {
    if (card && quantity > 0) {
      Store.addToCart(card, quantity);
      setSnackbarMessage(
        `${quantity} x ${card.name} adicionado(s) ao carrinho!`
      );
      setSnackbarOpen(true);
      setQuantity(1);
    }
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && card && newQuantity <= card.stock) {
      setQuantity(newQuantity);
    }
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    setSnackbarMessage(
      isFavorite ? "Removido dos favoritos" : "Adicionado aos favoritos"
    );
    setSnackbarOpen(true);
  };

  const handleShare = async () => {
    if (navigator.share && card) {
      try {
        await navigator.share({
          title: card.name,
          text: card.description,
          url: window.location.href,
        });
      } catch (error) {
        console.log("Erro ao compartilhar:", error);
      }
    } else {
      // Fallback: copiar URL para clipboard
      navigator.clipboard.writeText(window.location.href);
      setSnackbarMessage("Link copiado para a área de transferência!");
      setSnackbarOpen(true);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case "common":
        return "default";
      case "uncommon":
        return "primary";
      case "rare":
        return "secondary";
      case "epic":
        return "warning";
      case "legendary":
        return "error";
      default:
        return "default";
    }
  };

  const getTypeColor = (type: string) => {
    const typeColors: Record<string, string> = {
      fire: "#FF6B6B",
      water: "#4ECDC4",
      grass: "#95E1D3",
      electric: "#FFD93D",
      psychic: "#DA70D6",
      fighting: "#CD853F",
      ghost: "#9370DB",
      dragon: "#FF8C00",
      normal: "#A8A8A8",
    };
    return typeColors[type.toLowerCase()] || "#A8A8A8";
  };

  if (!card) {
    return (
      <Box sx={{ textAlign: "center", mt: 4 }}>
        <Typography variant="h5" color="text.secondary">
          Carta não encontrada
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate("/catalogo")}
          sx={{ mt: 2 }}
        >
          Voltar ao Catálogo
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header com botão voltar */}
      <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 2 }}>
        <IconButton onClick={() => navigate(-1)}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" component="h1">
          {card.name}
        </Typography>
        <Box sx={{ ml: "auto", display: "flex", gap: 1 }}>
          <IconButton
            onClick={toggleFavorite}
            color={isFavorite ? "error" : "default"}
          >
            {isFavorite ? <Favorite /> : <FavoriteBorder />}
          </IconButton>
          <IconButton onClick={handleShare}>
            <Share />
          </IconButton>
        </Box>
      </Box>

      <Grid container spacing={4}>
        {/* Imagem da carta */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2, textAlign: "center" }}>
            <CardMedia
              component="img"
              sx={{
                width: "100%",
                maxWidth: 400,
                height: "auto",
                borderRadius: 2,
                mx: "auto",
              }}
              image={
                card.image ||
                `https://via.placeholder.com/400x560/333/fff?text=${card.name}`
              }
              alt={card.name}
            />
          </Paper>
        </Grid>

        {/* Informações da carta */}
        <Grid item xs={12} md={6}>
          <Box
            sx={{ height: "100%", display: "flex", flexDirection: "column" }}
          >
            {/* Badges de tipo e raridade */}
            <Box sx={{ mb: 3, display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Chip
                label={card.type}
                sx={{
                  backgroundColor: getTypeColor(card.type),
                  color: "white",
                  fontWeight: "bold",
                }}
              />
              <Chip
                label={card.rarity}
                color={getRarityColor(card.rarity) as any}
                variant="outlined"
              />
              <Chip label={`ID: ${card.id}`} size="small" variant="outlined" />
            </Box>

            {/* Descrição */}
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ mb: 3, lineHeight: 1.7 }}
            >
              {card.description}
            </Typography>

            {/* Avaliação (simulada) */}
            <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 2 }}>
              <Typography variant="subtitle1">Avaliação:</Typography>
              <Rating value={4.5} precision={0.5} readOnly />
              <Typography variant="body2" color="text.secondary">
                (127 avaliações)
              </Typography>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Preço e estoque */}
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="h3"
                color="primary"
                fontWeight="bold"
                gutterBottom
              >
                R$ {card.price.toFixed(2)}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Typography
                  variant="body1"
                  color={
                    card.stock > 10
                      ? "success.main"
                      : card.stock > 0
                      ? "warning.main"
                      : "error.main"
                  }
                >
                  {card.stock > 0
                    ? `${card.stock} em estoque`
                    : "Fora de estoque"}
                </Typography>
                {card.stock <= 5 && card.stock > 0 && (
                  <Chip label="Últimas unidades" color="warning" size="small" />
                )}
              </Box>
            </Box>

            {/* Seletor de quantidade */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Quantidade:
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <IconButton
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={quantity <= 1}
                >
                  <Remove />
                </IconButton>
                <Typography
                  variant="h6"
                  sx={{
                    minWidth: 50,
                    textAlign: "center",
                    fontWeight: "bold",
                  }}
                >
                  {quantity}
                </Typography>
                <IconButton
                  onClick={() => handleQuantityChange(quantity + 1)}
                  disabled={quantity >= card.stock}
                >
                  <Add />
                </IconButton>
              </Box>
            </Box>

            {/* Botões de ação */}
            <Box
              sx={{
                mt: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <Button
                variant="contained"
                size="large"
                startIcon={<ShoppingCart />}
                onClick={handleAddToCart}
                disabled={card.stock === 0}
                fullWidth
              >
                {card.stock === 0 ? "Fora de Estoque" : "Adicionar ao Carrinho"}
              </Button>

              <Box sx={{ display: "flex", gap: 2 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => navigate("/catalogo")}
                >
                  Continuar Comprando
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => navigate("/carrinho")}
                >
                  Ver Carrinho
                </Button>
              </Box>
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* Seção de informações adicionais */}
      <Box sx={{ mt: 6 }}>
        <Typography variant="h5" gutterBottom>
          Informações Adicionais
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Detalhes da Carta
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography color="text.secondary">Tipo:</Typography>
                  <Typography fontWeight="bold">{card.type}</Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography color="text.secondary">Raridade:</Typography>
                  <Typography fontWeight="bold">{card.rarity}</Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography color="text.secondary">Preço:</Typography>
                  <Typography fontWeight="bold">
                    R$ {card.price.toFixed(2)}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography color="text.secondary">Estoque:</Typography>
                  <Typography fontWeight="bold">
                    {card.stock} unidades
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Política de Vendas
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Typography variant="body2">✓ Garantia de qualidade</Typography>
                <Typography variant="body2">
                  ✓ Envio em até 2 dias úteis
                </Typography>
                <Typography variant="body2">✓ Troca em até 30 dias</Typography>
                <Typography variant="body2">✓ Suporte especializado</Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Recomendações de cartas similares */}
      {card && (
        <Recommendations
          cardId={card.id}
          type="similar"
          limit={8}
          title="Cartas Similares"
          showReasons={true}
        />
      )}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert severity="success" onClose={() => setSnackbarOpen(false)}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CardDetail;
