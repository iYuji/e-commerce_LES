import React, { useState, useEffect } from "react";
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
  FormControl,
  InputLabel,
  Select,
  Slider,
  Switch,
  FormControlLabel,
  Pagination,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  ShoppingCart,
  ViewList,
  ViewModule,
  Favorite,
  FavoriteBorder,
  FilterList,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import * as Store from "../store/index";
import { Card as CardType } from "../types";

const ITEMS_PER_PAGE = 12;

const Catalogo: React.FC = () => {
  const navigate = useNavigate();
  const [cards, setCards] = useState<CardType[]>([]);
  const [filteredCards, setFilteredCards] = useState<CardType[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [rarityFilter, setRarityFilter] = useState("");
  const [priceRange, setPriceRange] = useState<number[]>([0, 300]);
  const [sortBy, setSortBy] = useState("name");
  const [showOnlyInStock, setShowOnlyInStock] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  useEffect(() => {
    // Limpar cartas antigas e recriar com novas URLs
    localStorage.removeItem("cards");
    Store.ensureSeed();

    const loadedCards = Store.getCards();
    setCards(loadedCards);
    setFilteredCards(loadedCards);

    // Calcular range de preços automático
    if (loadedCards.length > 0) {
      const prices = loadedCards.map((card: CardType) => card.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      setPriceRange([minPrice, maxPrice]);
    }
  }, []);
  useEffect(() => {
    let filtered = cards;

    // Filtro por texto
    if (searchTerm) {
      filtered = filtered.filter(
        (card: CardType) =>
          card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          card.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por tipo
    if (typeFilter) {
      filtered = filtered.filter((card: CardType) => card.type === typeFilter);
    }

    // Filtro por raridade
    if (rarityFilter) {
      filtered = filtered.filter(
        (card: CardType) => card.rarity === rarityFilter
      );
    }

    // Filtro por preço
    filtered = filtered.filter(
      (card: CardType) =>
        card.price >= priceRange[0] && card.price <= priceRange[1]
    );

    // Filtro por estoque
    if (showOnlyInStock) {
      filtered = filtered.filter((card: CardType) => card.stock > 0);
    }

    // Ordenação
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "rarity":
          const rarityOrder = [
            "Common",
            "Uncommon",
            "Rare",
            "Epic",
            "Legendary",
          ];
          return rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity);
        case "stock":
          return b.stock - a.stock;
        default:
          return 0;
      }
    });

    setFilteredCards(filtered);
    setCurrentPage(1);
  }, [
    cards,
    searchTerm,
    typeFilter,
    rarityFilter,
    priceRange,
    sortBy,
    showOnlyInStock,
  ]);

  const handleAddToCart = (card: CardType, event: React.MouseEvent) => {
    event.stopPropagation();
    Store.addToCart(card, 1);
    setSnackbarMessage(`${card.name} adicionado ao carrinho!`);
    setSnackbarOpen(true);
  };

  const toggleFavorite = (cardId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const newFavorites = new Set(favorites);
    if (newFavorites.has(cardId)) {
      newFavorites.delete(cardId);
      setSnackbarMessage("Removido dos favoritos");
    } else {
      newFavorites.add(cardId);
      setSnackbarMessage("Adicionado aos favoritos");
    }
    setFavorites(newFavorites);
    setSnackbarOpen(true);
  };

  const getUniqueValues = (key: keyof CardType) => {
    return Array.from(new Set(cards.map((card: CardType) => card[key]))).filter(
      Boolean
    );
  };

  const getRarityColor = (rarity: string) => {
    if (!rarity) return "default";
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
    if (!type) return "#A8A8A8";
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

  // Paginação
  const totalPages = Math.ceil(filteredCards.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentCards = filteredCards.slice(startIndex, endIndex);

  const getCardGradient = (type: string) => {
    const gradients: { [key: string]: string } = {
      Electric: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
      Fire: "linear-gradient(135deg, #FF6347 0%, #DC143C 100%)",
      Water: "linear-gradient(135deg, #4169E1 0%, #1E90FF 100%)",
      Grass: "linear-gradient(135deg, #32CD32 0%, #228B22 100%)",
      Psychic: "linear-gradient(135deg, #9932CC 0%, #8A2BE2 100%)",
      Fighting: "linear-gradient(135deg, #8B4513 0%, #A0522D 100%)",
      Ghost: "linear-gradient(135deg, #483D8B 0%, #6A5ACD 100%)",
      Dragon: "linear-gradient(135deg, #FF8C00 0%, #FF4500 100%)",
      Normal: "linear-gradient(135deg, #DEB887 0%, #D2B48C 100%)",
    };
    return (
      gradients[type] || "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
    );
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setTypeFilter("");
    setRarityFilter("");
    setSortBy("name");
    setShowOnlyInStock(false);
    const prices = cards.map((card) => card.price);
    setPriceRange([Math.min(...prices), Math.max(...prices)]);
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1">
          Catálogo de Cartas
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Visualização em Grade">
            <IconButton
              onClick={() => setViewMode("grid")}
              color={viewMode === "grid" ? "primary" : "default"}
            >
              <ViewModule />
            </IconButton>
          </Tooltip>
          <Tooltip title="Visualização em Lista">
            <IconButton
              onClick={() => setViewMode("list")}
              color={viewMode === "list" ? "primary" : "default"}
            >
              <ViewList />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Filtros */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <FilterList />
          <Typography variant="h6">Filtros</Typography>
          <Button size="small" onClick={handleClearFilters}>
            Limpar Filtros
          </Button>
        </Box>

        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Buscar cartas..."
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Tipo</InputLabel>
              <Select
                value={typeFilter}
                label="Tipo"
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                {getUniqueValues("type").map((type: any) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Raridade</InputLabel>
              <Select
                value={rarityFilter}
                label="Raridade"
                onChange={(e) => setRarityFilter(e.target.value)}
              >
                <MenuItem value="">Todas</MenuItem>
                {getUniqueValues("rarity").map((rarity: any) => (
                  <MenuItem key={rarity} value={rarity}>
                    {rarity}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Ordenar por</InputLabel>
              <Select
                value={sortBy}
                label="Ordenar por"
                onChange={(e) => setSortBy(e.target.value)}
              >
                <MenuItem value="name">Nome</MenuItem>
                <MenuItem value="price-low">Menor Preço</MenuItem>
                <MenuItem value="price-high">Maior Preço</MenuItem>
                <MenuItem value="rarity">Raridade</MenuItem>
                <MenuItem value="stock">Estoque</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={showOnlyInStock}
                  onChange={(e) => setShowOnlyInStock(e.target.checked)}
                />
              }
              label="Apenas em estoque"
            />
          </Grid>

          <Grid item xs={12} md={1}>
            <Typography variant="body2" gutterBottom>
              Preço: R$ {priceRange[0]} - R$ {priceRange[1]}
            </Typography>
            <Slider
              value={priceRange}
              onChange={(_, newValue) => setPriceRange(newValue as number[])}
              valueLabelDisplay="auto"
              min={0}
              max={300}
              step={5}
            />
          </Grid>
        </Grid>
      </Card>

      {/* Resultados */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="body1" color="text.secondary">
          {filteredCards.length} carta(s) encontrada(s)
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Página {currentPage} de {totalPages}
        </Typography>
      </Box>

      {/* Cards Grid */}
      <Grid container spacing={2}>
        {currentCards.map((card: CardType) => (
          <Grid
            item
            xs={12}
            sm={viewMode === "grid" ? 6 : 12}
            md={viewMode === "grid" ? 4 : 12}
            lg={viewMode === "grid" ? 3 : 12}
            key={card.id}
          >
            <Card
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: viewMode === "grid" ? "column" : "row",
                boxShadow: 2, // sombra menor
                cursor: "pointer",
                transition: "all 0.3s ease",
                position: "relative",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: 4,
                },
              }}
              onClick={() => navigate(`/card/${card.id}`)}
            >
              {/* Botão de favorito */}
              <IconButton
                sx={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  zIndex: 1,
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 1)",
                  },
                }}
                onClick={(e) => toggleFavorite(card.id, e)}
                color={favorites.has(card.id) ? "error" : "default"}
              >
                {favorites.has(card.id) ? <Favorite /> : <FavoriteBorder />}
              </IconButton>

              <CardMedia
                component="div"
                sx={{
                  width: viewMode === "grid" ? "100%" : 200,
                  height: viewMode === "grid" ? 280 : 180,
                  backgroundImage: card.image
                    ? `url(${card.image})`
                    : getCardGradient(card.type),
                  backgroundSize: "contain",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "center",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  mt: 3, // margem no topo da imagem
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderRadius: 2,
                  boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
                }}
              >
                {!card.image && (
                  <Typography
                    variant="h6"
                    color="text.primary"
                    sx={{
                      textAlign: "center",
                      fontWeight: "bold",
                      textShadow: "1px 1px 2px rgba(0,0,0,0.7)",
                      color: "white",
                    }}
                  >
                    {card.name}
                  </Typography>
                )}
              </CardMedia>

              <CardContent
                sx={{
                  flexGrow: 1,
                  display: "flex",
                  flexDirection: "column",
                  pt: 4, // padding-top maior especificamente
                  px: 3, // padding lateral
                  pb: 3, // padding bottom
                  gap: 2, // espaçamento entre elementos internos
                }}
              >
                <Typography gutterBottom variant="h6" component="h2">
                  {card.name}
                </Typography>

                <Box sx={{ mb: 1, display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {card.type && (
                    <Chip
                      label={card.type}
                      size="small"
                      sx={{
                        backgroundColor: getTypeColor(card.type),
                        color: "white",
                        fontWeight: "bold",
                      }}
                    />
                  )}
                  {card.rarity && (
                    <Chip
                      label={card.rarity}
                      size="small"
                      color={getRarityColor(card.rarity) as any}
                    />
                  )}
                </Box>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mb: 2,
                    flexGrow: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {card.description}
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Typography variant="h6" color="primary" fontWeight="bold">
                    R$ {card.price.toFixed(2)}
                  </Typography>
                  <Typography
                    variant="body2"
                    color={card.stock > 0 ? "text.secondary" : "error.main"}
                  >
                    {card.stock > 0
                      ? `Estoque: ${card.stock}`
                      : "Fora de estoque"}
                  </Typography>
                </Box>

                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<ShoppingCart />}
                  onClick={(e) => handleAddToCart(card, e)}
                  disabled={card.stock === 0}
                  size="small"
                >
                  {card.stock === 0 ? "Sem Estoque" : "Adicionar ao Carrinho"}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Paginação */}
      {totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(_, page) => setCurrentPage(page)}
            color="primary"
            size="large"
          />
        </Box>
      )}

      {/* Mensagem quando não há resultados */}
      {filteredCards.length === 0 && (
        <Box sx={{ textAlign: "center", mt: 4, py: 4 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Nenhuma carta encontrada
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Tente ajustar os filtros ou buscar por outros termos
          </Typography>
          <Button variant="outlined" onClick={handleClearFilters}>
            Limpar Filtros
          </Button>
        </Box>
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

export default Catalogo;
