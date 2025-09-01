import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  Grid,
  Card,
  CardContent,
  Avatar,
  Pagination,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Search,
  Edit,
  Warning,
  TrendingDown,
  Inventory,
  AttachMoney,
} from '@mui/icons-material';
import { getCards, writeStore, STORE_KEYS } from '../../store';
import { Card as CardType } from '../../types';

const ITEMS_PER_PAGE = 10;

const AdminEstoque: React.FC = () => {
  const [cards, setCards] = useState<CardType[]>([]);
  const [filteredCards, setFilteredCards] = useState<CardType[]>([]);
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newStock, setNewStock] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => {
    loadCards();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [cards, searchTerm, stockFilter, typeFilter]);

  const loadCards = () => {
    const loadedCards = getCards();
    setCards(loadedCards);
  };

  const applyFilters = () => {
    let filtered = cards;

    if (searchTerm) {
      filtered = filtered.filter(card =>
        card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (stockFilter === 'low') {
      filtered = filtered.filter(card => card.stock <= 5 && card.stock > 0);
    } else if (stockFilter === 'out') {
      filtered = filtered.filter(card => card.stock === 0);
    } else if (stockFilter === 'available') {
      filtered = filtered.filter(card => card.stock > 5);
    }

    if (typeFilter) {
      filtered = filtered.filter(card => card.type === typeFilter);
    }

    setFilteredCards(filtered);
    setPage(0);
  };

  const handleEditStock = (card: CardType) => {
    setSelectedCard(card);
    setNewStock(card.stock);
    setEditDialogOpen(true);
  };

  const handleSaveStock = () => {
    if (selectedCard && newStock >= 0) {
      const updatedCards = cards.map(card =>
        card.id === selectedCard.id ? { ...card, stock: newStock } : card
      );
      setCards(updatedCards);
      writeStore(STORE_KEYS.cards, updatedCards);
      setEditDialogOpen(false);
      setSnackbar({
        open: true,
        message: 'Estoque atualizado com sucesso!',
        severity: 'success'
      });
    }
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: 'Sem Estoque', color: 'error' as const, icon: <Warning /> };
    if (stock <= 5) return { label: 'Estoque Baixo', color: 'warning' as const, icon: <TrendingDown /> };
    return { label: 'Em Estoque', color: 'success' as const, icon: <Inventory /> };
  };

  const getUniqueTypes = () => {
    return Array.from(new Set(cards.map(card => card.type))).filter(Boolean);
  };

  const calculateStats = () => {
    const totalItems = cards.length;
    const totalValue = cards.reduce((sum, card) => sum + (card.price * card.stock), 0);
    const lowStockItems = cards.filter(card => card.stock <= 5 && card.stock > 0).length;
    const outOfStockItems = cards.filter(card => card.stock === 0).length;
    const totalUnits = cards.reduce((sum, card) => sum + card.stock, 0);

    return {
      totalItems,
      totalValue,
      lowStockItems,
      outOfStockItems,
      totalUnits
    };
  };

  const stats = calculateStats();
  const paginatedCards = filteredCards.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Gerenciar Estoque
      </Typography>

      {/* Estatísticas */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total de Produtos
                  </Typography>
                  <Typography variant="h5">
                    {stats.totalItems}
                  </Typography>
                </Box>
                <Inventory color="primary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Valor Total do Estoque
                  </Typography>
                  <Typography variant="h5" color="primary">
                    R$ {stats.totalValue.toFixed(2)}
                  </Typography>
                </Box>
                <AttachMoney color="primary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Estoque Baixo
                  </Typography>
                  <Typography variant="h5" color="warning.main">
                    {stats.lowStockItems}
                  </Typography>
                </Box>
                <TrendingDown color="warning" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Sem Estoque
                  </Typography>
                  <Typography variant="h5" color="error">
                    {stats.outOfStockItems}
                  </Typography>
                </Box>
                <Warning color="error" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Alertas */}
      {stats.outOfStockItems > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Atenção! {stats.outOfStockItems} produto(s) estão sem estoque.
        </Alert>
      )}
      {stats.lowStockItems > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Cuidado! {stats.lowStockItems} produto(s) com estoque baixo (≤ 5 unidades).
        </Alert>
      )}

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status do Estoque</InputLabel>
              <Select
                value={stockFilter}
                label="Status do Estoque"
                onChange={(e) => setStockFilter(e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="available">Em Estoque (&gt;5)</MenuItem>
                <MenuItem value="low">Estoque Baixo (≤5)</MenuItem>
                <MenuItem value="out">Sem Estoque</MenuItem>
              </Select>
            </FormControl>
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
                {getUniqueTypes().map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
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
                setSearchTerm('');
                setStockFilter('');
                setTypeFilter('');
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
              <TableCell>Produto</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Raridade</TableCell>
              <TableCell align="right">Preço</TableCell>
              <TableCell align="right">Estoque</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Valor Total</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedCards.map((card) => {
              const status = getStockStatus(card.stock);
              return (
                <TableRow key={card.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        src={card.image}
                        variant="rounded"
                        sx={{ width: 40, height: 56 }}
                      >
                        {card.name.slice(0, 2)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {card.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          ID: {card.id}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip label={card.type} size="small" />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={card.rarity} 
                      size="small" 
                      color={card.rarity === 'Legendary' ? 'warning' : 'default'}
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
                      fontWeight="bold"
                      color={card.stock === 0 ? 'error' : card.stock <= 5 ? 'warning.main' : 'text.primary'}
                    >
                      {card.stock}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={status.label} 
                      size="small" 
                      color={status.color}
                      icon={status.icon}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="bold" color="primary">
                      R$ {(card.price * card.stock).toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => handleEditStock(card)}
                      title="Editar Estoque"
                    >
                      <Edit />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Paginação */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        <Pagination
          count={Math.ceil(filteredCards.length / ITEMS_PER_PAGE)}
          page={page + 1}
          onChange={(_, newPage) => setPage(newPage - 1)}
          color="primary"
        />
      </Box>

      {/* Dialog de Editar Estoque */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Atualizar Estoque
        </DialogTitle>
        <DialogContent>
          {selectedCard && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                {selectedCard.name}
              </Typography>
              <Typography color="text.secondary" gutterBottom>
                Estoque atual: {selectedCard.stock} unidades
              </Typography>
              <TextField
                fullWidth
                label="Novo Estoque"
                type="number"
                value={newStock}
                onChange={(e) => setNewStock(parseInt(e.target.value) || 0)}
                inputProps={{ min: 0 }}
                sx={{ mt: 2 }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Valor total: R$ {(selectedCard.price * newStock).toFixed(2)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleSaveStock} variant="contained">
            Atualizar
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

export default AdminEstoque;
