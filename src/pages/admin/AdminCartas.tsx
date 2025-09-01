import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Snackbar,
  Grid,
  Card,
  CardContent,
  Avatar,
  Pagination,
} from "@mui/material";
import { Add, Edit, Delete, Search } from "@mui/icons-material";
import * as Store from "../../store/index";
import { Card as CardType } from "../../types";

const ITEMS_PER_PAGE = 10;

const AdminCartas: React.FC = () => {
  const [cards, setCards] = useState<CardType[]>([]);
  const [filteredCards, setFilteredCards] = useState<CardType[]>([]);
  const [page, setPage] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCard, setEditingCard] = useState<CardType | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [rarityFilter, setRarityFilter] = useState("");

  // Formulário
  const [formData, setFormData] = useState<Partial<CardType>>({
    name: "",
    type: "",
    rarity: "Common",
    price: 0,
    stock: 0,
    description: "",
    image: "",
  });

  useEffect(() => {
    loadCards();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [cards, searchTerm, typeFilter, rarityFilter]);

  const loadCards = () => {
    const loadedCards = Store.getCards();
    setCards(loadedCards);
  };

  const applyFilters = () => {
    let filtered = cards;

    if (searchTerm) {
      filtered = filtered.filter(
        (card) =>
          card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          card.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter) {
      filtered = filtered.filter((card) => card.type === typeFilter);
    }

    if (rarityFilter) {
      filtered = filtered.filter((card) => card.rarity === rarityFilter);
    }

    setFilteredCards(filtered);
    setPage(0);
  };

  const handleOpenDialog = (card?: CardType) => {
    if (card) {
      setEditingCard(card);
      setFormData(card);
    } else {
      setEditingCard(null);
      setFormData({
        name: "",
        type: "",
        rarity: "Common",
        price: 0,
        stock: 0,
        description: "",
        image: "",
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCard(null);
    setFormData({});
  };

  const handleSaveCard = () => {
    if (!formData.name || !formData.type || !formData.rarity) {
      setSnackbar({
        open: true,
        message: "Por favor, preencha todos os campos obrigatórios",
        severity: "error",
      });
      return;
    }

    const updatedCards = [...cards];

    if (editingCard) {
      // Editar carta existente
      const index = updatedCards.findIndex((c) => c.id === editingCard.id);
      if (index >= 0) {
        updatedCards[index] = { ...editingCard, ...formData } as CardType;
      }
    } else {
      // Adicionar nova carta
      const newCard: CardType = {
        id: Date.now().toString(),
        name: formData.name!,
        type: formData.type!,
        rarity: formData.rarity!,
        price: formData.price || 0,
        stock: formData.stock || 0,
        description: formData.description || "",
        image: formData.image || "",
      };
      updatedCards.push(newCard);
    }

    setCards(updatedCards);
    Store.writeStore(Store.STORE_KEYS.cards, updatedCards);
    handleCloseDialog();

    setSnackbar({
      open: true,
      message: editingCard
        ? "Carta atualizada com sucesso!"
        : "Carta adicionada com sucesso!",
      severity: "success",
    });
  };

  const handleDeleteCard = (cardId: string) => {
    setCardToDelete(cardId);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (cardToDelete) {
      const updatedCards = cards.filter((c) => c.id !== cardToDelete);
      setCards(updatedCards);
      Store.writeStore(Store.STORE_KEYS.cards, updatedCards);

      setSnackbar({
        open: true,
        message: "Carta removida com sucesso!",
        severity: "success",
      });
    }
    setDeleteConfirmOpen(false);
    setCardToDelete(null);
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

  const getUniqueValues = (key: keyof CardType) => {
    return Array.from(new Set(cards.map((card) => card[key]))).filter(Boolean);
  };

  const paginatedCards = filteredCards.slice(
    page * ITEMS_PER_PAGE,
    (page + 1) * ITEMS_PER_PAGE
  );

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1">
          Gerenciar Cartas
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Adicionar Carta
        </Button>
      </Box>

      {/* Estatísticas */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total de Cartas
              </Typography>
              <Typography variant="h5">{cards.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Em Estoque
              </Typography>
              <Typography variant="h5">
                {cards.filter((card) => card.stock > 0).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Sem Estoque
              </Typography>
              <Typography variant="h5" color="error">
                {cards.filter((card) => card.stock === 0).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Valor Total
              </Typography>
              <Typography variant="h5" color="primary">
                R${" "}
                {cards
                  .reduce((total, card) => total + card.price * card.stock, 0)
                  .toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Buscar cartas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <Search sx={{ mr: 1, color: "text.secondary" }} />
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
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
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
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
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                setSearchTerm("");
                setTypeFilter("");
                setRarityFilter("");
              }}
            >
              Limpar
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabela */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Imagem</TableCell>
              <TableCell>Nome</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Raridade</TableCell>
              <TableCell align="right">Preço</TableCell>
              <TableCell align="right">Estoque</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedCards.map((card) => (
              <TableRow key={card.id} hover>
                <TableCell>
                  <Avatar
                    src={card.image}
                    variant="rounded"
                    sx={{ width: 50, height: 70 }}
                  >
                    {card.name.slice(0, 2)}
                  </Avatar>
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle2" fontWeight="bold">
                    {card.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {card.description}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip label={card.type} size="small" />
                </TableCell>
                <TableCell>
                  <Chip
                    label={card.rarity}
                    size="small"
                    color={getRarityColor(card.rarity) as any}
                  />
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontWeight="bold">
                    R$ {card.price.toFixed(2)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography
                    variant="body2"
                    color={card.stock === 0 ? "error" : "text.primary"}
                  >
                    {card.stock}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(card)}
                    title="Editar"
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteCard(card.id)}
                    title="Excluir"
                    color="error"
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Paginação */}
      <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
        <Pagination
          count={Math.ceil(filteredCards.length / ITEMS_PER_PAGE)}
          page={page + 1}
          onChange={(_, newPage) => setPage(newPage - 1)}
          color="primary"
        />
      </Box>

      {/* Dialog de Adicionar/Editar */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingCard ? "Editar Carta" : "Adicionar Nova Carta"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome da Carta"
                value={formData.name || ""}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Tipo"
                value={formData.type || ""}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Raridade</InputLabel>
                <Select
                  value={formData.rarity || "Common"}
                  label="Raridade"
                  onChange={(e) =>
                    setFormData({ ...formData, rarity: e.target.value })
                  }
                >
                  <MenuItem value="Common">Common</MenuItem>
                  <MenuItem value="Uncommon">Uncommon</MenuItem>
                  <MenuItem value="Rare">Rare</MenuItem>
                  <MenuItem value="Epic">Epic</MenuItem>
                  <MenuItem value="Legendary">Legendary</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Preço"
                type="number"
                value={formData.price || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    price: parseFloat(e.target.value) || 0,
                  })
                }
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Estoque"
                type="number"
                value={formData.stock || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    stock: parseInt(e.target.value) || 0,
                  })
                }
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="URL da Imagem"
                value={formData.image || ""}
                onChange={(e) =>
                  setFormData({ ...formData, image: e.target.value })
                }
                placeholder="https://exemplo.com/imagem.jpg"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descrição"
                multiline
                rows={3}
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSaveCard} variant="contained">
            {editingCard ? "Atualizar" : "Adicionar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza de que deseja excluir esta carta? Esta ação não pode ser
            desfeita.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancelar</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Excluir
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminCartas;
