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
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Pagination,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Visibility,
  GetApp,
  TrendingUp,
  TrendingDown,
  Timeline,
} from '@mui/icons-material';
import { getOrders, getCards, getCustomers } from '../../store';
import { Order, Card as CardType, Customer } from '../../types';

const ITEMS_PER_PAGE = 10;

const AdminVendas: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [cards, setCards] = useState<CardType[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [orders, statusFilter, periodFilter]);

  const loadData = () => {
    const loadedOrders = getOrders();
    const loadedCards = getCards();
    const loadedCustomers = getCustomers();
    setOrders(loadedOrders);
    setCards(loadedCards);
    setCustomers(loadedCustomers);
  };

  const applyFilters = () => {
    let filtered = orders;

    if (statusFilter) {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    if (periodFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();

      switch (periodFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          filterDate.setMonth(now.getMonth() - 3);
          break;
        case 'year':
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      filtered = filtered.filter(order => 
        new Date(order.createdAt) >= filterDate
      );
    }

    setFilteredOrders(filtered);
    setPage(0);
  };

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.name : 'Cliente Desconhecido';
  };

  const getOrderStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'warning';
      case 'confirmed': return 'info';
      case 'processing': return 'primary';
      case 'shipped': return 'secondary';
      case 'delivered': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getOrderStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      pending: 'Pendente',
      confirmed: 'Confirmado',
      processing: 'Processando',
      shipped: 'Enviado',
      delivered: 'Entregue',
      cancelled: 'Cancelado'
    };
    return labels[status.toLowerCase()] || status;
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
  };

  const calculateStats = () => {
    const totalOrders = filteredOrders.length;
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const completedOrders = filteredOrders.filter(order => order.status === 'delivered').length;
    const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

    // Calcular crescimento comparado ao período anterior
    const currentPeriodStart = new Date();
    if (periodFilter === 'month') {
      currentPeriodStart.setMonth(currentPeriodStart.getMonth() - 1);
    } else if (periodFilter === 'week') {
      currentPeriodStart.setDate(currentPeriodStart.getDate() - 7);
    } else {
      currentPeriodStart.setDate(currentPeriodStart.getDate() - 30);
    }

    const previousPeriodOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      const prevStart = new Date(currentPeriodStart);
      const prevEnd = new Date(currentPeriodStart);
      
      if (periodFilter === 'month') {
        prevStart.setMonth(prevStart.getMonth() - 1);
      } else if (periodFilter === 'week') {
        prevStart.setDate(prevStart.getDate() - 7);
        prevEnd.setDate(prevEnd.getDate() - 7);
      } else {
        prevStart.setDate(prevStart.getDate() - 30);
        prevEnd.setDate(prevEnd.getDate() - 30);
      }

      return orderDate >= prevStart && orderDate <= prevEnd;
    });

    const previousRevenue = previousPeriodOrders.reduce((sum, order) => sum + order.total, 0);
    const revenueGrowth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    return {
      totalOrders,
      totalRevenue,
      averageOrderValue,
      completionRate,
      revenueGrowth
    };
  };

  const exportData = () => {
    const csvContent = [
      ['ID', 'Data', 'Cliente', 'Status', 'Total'].join(','),
      ...filteredOrders.map(order => [
        order.id,
        new Date(order.createdAt).toLocaleDateString(),
        getCustomerName(order.customerId),
        getOrderStatusLabel(order.status),
        order.total.toFixed(2)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vendas_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const stats = calculateStats();
  const paginatedOrders = filteredOrders.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Relatório de Vendas
        </Typography>
        <Button
          variant="outlined"
          startIcon={<GetApp />}
          onClick={exportData}
        >
          Exportar CSV
        </Button>
      </Box>

      {/* Estatísticas */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total de Pedidos
                  </Typography>
                  <Typography variant="h5">
                    {stats.totalOrders}
                  </Typography>
                </Box>
                <Timeline color="primary" />
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
                    Receita Total
                  </Typography>
                  <Typography variant="h5" color="primary">
                    R$ {stats.totalRevenue.toFixed(2)}
                  </Typography>
                  <Typography variant="body2" color={stats.revenueGrowth >= 0 ? 'success.main' : 'error.main'}>
                    {stats.revenueGrowth >= 0 ? '+' : ''}{stats.revenueGrowth.toFixed(1)}% vs período anterior
                  </Typography>
                </Box>
                {stats.revenueGrowth >= 0 ? 
                  <TrendingUp color="success" /> : 
                  <TrendingDown color="error" />
                }
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Ticket Médio
              </Typography>
              <Typography variant="h5">
                R$ {stats.averageOrderValue.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Taxa de Conversão
              </Typography>
              <Typography variant="h5">
                {stats.completionRate.toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Período</InputLabel>
              <Select
                value={periodFilter}
                label="Período"
                onChange={(e) => setPeriodFilter(e.target.value)}
              >
                <MenuItem value="all">Todos os tempos</MenuItem>
                <MenuItem value="today">Hoje</MenuItem>
                <MenuItem value="week">Última semana</MenuItem>
                <MenuItem value="month">Último mês</MenuItem>
                <MenuItem value="quarter">Últimos 3 meses</MenuItem>
                <MenuItem value="year">Último ano</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="pending">Pendente</MenuItem>
                <MenuItem value="confirmed">Confirmado</MenuItem>
                <MenuItem value="processing">Processando</MenuItem>
                <MenuItem value="shipped">Enviado</MenuItem>
                <MenuItem value="delivered">Entregue</MenuItem>
                <MenuItem value="cancelled">Cancelado</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                setStatusFilter('');
                setPeriodFilter('all');
              }}
            >
              Limpar Filtros
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabela */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID do Pedido</TableCell>
              <TableCell>Data</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Itens</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedOrders.map((order) => (
              <TableRow key={order.id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    #{order.id}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(order.createdAt).toLocaleTimeString()}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {getCustomerName(order.customerId)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {order.items.length} {order.items.length === 1 ? 'item' : 'itens'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={getOrderStatusLabel(order.status)} 
                    size="small" 
                    color={getOrderStatusColor(order.status) as any}
                  />
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontWeight="bold" color="primary">
                    R$ {order.total.toFixed(2)}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    size="small"
                    onClick={() => handleViewDetails(order)}
                    title="Ver Detalhes"
                  >
                    <Visibility />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Paginação */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        <Pagination
          count={Math.ceil(filteredOrders.length / ITEMS_PER_PAGE)}
          page={page + 1}
          onChange={(_, newPage) => setPage(newPage - 1)}
          color="primary"
        />
      </Box>

      {/* Dialog de Detalhes do Pedido */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Detalhes do Pedido #{selectedOrder?.id}
        </DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Informações do Pedido
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <Typography><strong>Data:</strong> {new Date(selectedOrder.createdAt).toLocaleString()}</Typography>
                        <Typography><strong>Cliente:</strong> {getCustomerName(selectedOrder.customerId)}</Typography>
                        <Typography><strong>Status:</strong> {getOrderStatusLabel(selectedOrder.status)}</Typography>
                        <Typography><strong>Total:</strong> R$ {selectedOrder.total.toFixed(2)}</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Endereço de Entrega
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        {selectedOrder.shippingAddress && (
                          <>
                            <Typography>{selectedOrder.shippingAddress.address}</Typography>
                            <Typography>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state}</Typography>
                            <Typography>{selectedOrder.shippingAddress.zipCode}</Typography>
                          </>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Itens do Pedido
                </Typography>
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Item</TableCell>
                        <TableCell align="right">Quantidade</TableCell>
                        <TableCell align="right">Preço Unitário</TableCell>
                        <TableCell align="right">Subtotal</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedOrder.items.map((item, index) => {
                        const card = cards.find(c => c.id === item.cardId);
                        return (
                          <TableRow key={index}>
                            <TableCell>{card ? card.name : 'Produto Desconhecido'}</TableCell>
                            <TableCell align="right">{item.quantity}</TableCell>
                            <TableCell align="right">R$ {item.card.price.toFixed(2)}</TableCell>
                            <TableCell align="right">R$ {(item.card.price * item.quantity).toFixed(2)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminVendas;
