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
} from '@mui/material';
import {
  Search,
  Visibility,
  Email,
  Phone,
} from '@mui/icons-material';
import { getOrders, getCustomers } from '../../store';
import { Customer, Order } from '../../types';

const ITEMS_PER_PAGE = 10;

const AdminClientes: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [customers, searchTerm, statusFilter]);

  const loadData = () => {
    const loadedCustomers = getCustomers();
    const loadedOrders = getOrders();
    setCustomers(loadedCustomers);
    setOrders(loadedOrders);
  };

  const applyFilters = () => {
    let filtered = customers;

    if (searchTerm) {
      filtered = filtered.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.includes(searchTerm)
      );
    }

    if (statusFilter === 'active') {
      filtered = filtered.filter(customer => 
        orders.some(order => order.customerId === customer.id)
      );
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(customer => 
        !orders.some(order => order.customerId === customer.id)
      );
    }

    setFilteredCustomers(filtered);
    setPage(0);
  };

  const getCustomerStats = (customerId: string) => {
    const customerOrders = orders.filter(order => order.customerId === customerId);
    const totalSpent = customerOrders.reduce((total, order) => total + order.total, 0);
    const lastOrder = customerOrders.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];

    return {
      totalOrders: customerOrders.length,
      totalSpent,
      lastOrderDate: lastOrder ? new Date(lastOrder.createdAt).toLocaleDateString() : 'Nunca',
      isActive: customerOrders.length > 0
    };
  };

  const handleViewDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
    const customerOrdersList = orders.filter(order => order.customerId === customer.id);
    setCustomerOrders(customerOrdersList);
    setDetailsOpen(true);
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'success' : 'default';
  };

  const getStatusLabel = (isActive: boolean) => {
    return isActive ? 'Ativo' : 'Inativo';
  };

  const paginatedCustomers = filteredCustomers.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(customer => 
    orders.some(order => order.customerId === customer.id)
  ).length;
  const totalRevenue = orders.reduce((total, order) => total + order.total, 0);
  const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Gerenciar Clientes
      </Typography>

      {/* Estatísticas */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total de Clientes
              </Typography>
              <Typography variant="h5">
                {totalCustomers}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Clientes Ativos
              </Typography>
              <Typography variant="h5" color="primary">
                {activeCustomers}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Receita Total
              </Typography>
              <Typography variant="h5" color="success.main">
                R$ {totalRevenue.toFixed(2)}
              </Typography>
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
                R$ {averageOrderValue.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Buscar clientes por nome, email ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
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
                <MenuItem value="active">Ativos</MenuItem>
                <MenuItem value="inactive">Inativos</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
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
              <TableCell>Cliente</TableCell>
              <TableCell>Contato</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Pedidos</TableCell>
              <TableCell align="right">Total Gasto</TableCell>
              <TableCell>Último Pedido</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedCustomers.map((customer) => {
              const stats = getCustomerStats(customer.id);
              return (
                <TableRow key={customer.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar>
                        {customer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {customer.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          ID: {customer.id}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Email fontSize="small" />
                        {customer.email}
                      </Typography>
                      {customer.phone && (
                        <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                          <Phone fontSize="small" />
                          {customer.phone}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={getStatusLabel(stats.isActive)} 
                      size="small" 
                      color={getStatusColor(stats.isActive) as any}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="bold">
                      {stats.totalOrders}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="bold" color="primary">
                      R$ {stats.totalSpent.toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {stats.lastOrderDate}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => handleViewDetails(customer)}
                      title="Ver Detalhes"
                    >
                      <Visibility />
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
          count={Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE)}
          page={page + 1}
          onChange={(_, newPage) => setPage(newPage - 1)}
          color="primary"
        />
      </Box>

      {/* Dialog de Detalhes do Cliente */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Detalhes do Cliente
        </DialogTitle>
        <DialogContent>
          {selectedCustomer && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Informações Pessoais
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <Typography><strong>Nome:</strong> {selectedCustomer.name}</Typography>
                        <Typography><strong>Email:</strong> {selectedCustomer.email}</Typography>
                        {selectedCustomer.phone && (
                          <Typography><strong>Telefone:</strong> {selectedCustomer.phone}</Typography>
                        )}
                        <Typography><strong>CPF:</strong> {selectedCustomer.cpf}</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Estatísticas
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <Typography><strong>Total de Pedidos:</strong> {customerOrders.length}</Typography>
                        <Typography><strong>Total Gasto:</strong> R$ {customerOrders.reduce((total, order) => total + order.total, 0).toFixed(2)}</Typography>
                        <Typography><strong>Ticket Médio:</strong> R$ {customerOrders.length > 0 ? (customerOrders.reduce((total, order) => total + order.total, 0) / customerOrders.length).toFixed(2) : '0.00'}</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {customerOrders.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Histórico de Pedidos
                  </Typography>
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>ID</TableCell>
                          <TableCell>Data</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell align="right">Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {customerOrders.slice(0, 5).map((order) => (
                          <TableRow key={order.id}>
                            <TableCell>#{order.id}</TableCell>
                            <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Chip label={order.status} size="small" />
                            </TableCell>
                            <TableCell align="right">R$ {order.total.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  {customerOrders.length > 5 && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Mostrando os 5 pedidos mais recentes
                    </Typography>
                  )}
                </Box>
              )}
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

export default AdminClientes;
