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
  Visibility,
  Email,
  Phone,
  Add,
  Edit,
  Delete,
} from '@mui/icons-material';
import { getOrders, getCustomers, writeStore, STORE_KEYS } from '../../store';
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
  
  // CRUD states
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Form data
  const [formData, setFormData] = useState<Partial<Customer>>({
    name: '',
    email: '',
    phone: '',
    address: '',
    cpf: '',
  });

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

  // CRUD Functions
  const handleOpenDialog = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        name: customer.name,
        email: customer.email,
        phone: customer.phone || '',
        address: customer.address || '',
        cpf: customer.cpf || '',
      });
    } else {
      setEditingCustomer(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        cpf: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCustomer(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      cpf: '',
    });
  };

  const handleSaveCustomer = () => {
    if (!formData.name || !formData.email) {
      setSnackbar({
        open: true,
        message: 'Nome e email são obrigatórios!',
        severity: 'error'
      });
      return;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setSnackbar({
        open: true,
        message: 'Email inválido!',
        severity: 'error'
      });
      return;
    }

    // Validar CPF (formato básico)
    if (formData.cpf && !/^\d{11}$/.test(formData.cpf.replace(/\D/g, ''))) {
      setSnackbar({
        open: true,
        message: 'CPF deve ter 11 dígitos!',
        severity: 'error'
      });
      return;
    }

    const allCustomers = getCustomers();
    
    if (editingCustomer) {
      // Editar cliente existente
      const updatedCustomer: Customer = {
        ...editingCustomer,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        cpf: formData.cpf,
      };

      const updatedCustomers = allCustomers.map(customer =>
        customer.id === editingCustomer.id ? updatedCustomer : customer
      );

      writeStore(STORE_KEYS.customers, updatedCustomers);
      setSnackbar({
        open: true,
        message: 'Cliente atualizado com sucesso!',
        severity: 'success'
      });
    } else {
      // Criar novo cliente
      const newCustomer: Customer = {
        id: Date.now().toString(),
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        cpf: formData.cpf,
        createdAt: new Date().toISOString(),
      };

      const updatedCustomers = [...allCustomers, newCustomer];
      writeStore(STORE_KEYS.customers, updatedCustomers);
      setSnackbar({
        open: true,
        message: 'Cliente criado com sucesso!',
        severity: 'success'
      });
    }

    loadData();
    handleCloseDialog();
  };

  const handleDeleteCustomer = (customerId: string) => {
    setCustomerToDelete(customerId);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteCustomer = () => {
    if (customerToDelete) {
      const allCustomers = getCustomers();
      const updatedCustomers = allCustomers.filter(customer => customer.id !== customerToDelete);
      writeStore(STORE_KEYS.customers, updatedCustomers);
      
      setSnackbar({
        open: true,
        message: 'Cliente excluído com sucesso!',
        severity: 'success'
      });
      
      loadData();
    }
    setDeleteConfirmOpen(false);
    setCustomerToDelete(null);
  };

  const formatCPF = (cpf: string) => {
    const cleaned = cpf.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{3})(\d{2})$/);
    if (match) {
      return `${match[1]}.${match[2]}.${match[3]}-${match[4]}`;
    }
    return cpf;
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Gerenciar Clientes
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Novo Cliente
        </Button>
      </Box>

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
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(customer)}
                      title="Editar Cliente"
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteCustomer(customer.id)}
                      title="Excluir Cliente"
                      color="error"
                    >
                      <Delete />
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

      {/* Dialog de Criar/Editar Cliente */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCustomer ? 'Editar Cliente' : 'Novo Cliente'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome Completo"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Telefone"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(11) 99999-9999"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="CPF"
                value={formData.cpf || ''}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\D/g, '');
                  setFormData({ ...formData, cpf: cleaned });
                }}
                placeholder="000.000.000-00"
                inputProps={{ maxLength: 11 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Endereço"
                multiline
                rows={2}
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Rua, número, bairro, cidade, estado"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button 
            onClick={handleSaveCustomer} 
            variant="contained"
          >
            {editingCustomer ? 'Atualizar' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancelar</Button>
          <Button onClick={confirmDeleteCustomer} color="error" variant="contained">
            Excluir
          </Button>
        </DialogActions>
      </Dialog>

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
                        {selectedCustomer.cpf && (
                          <Typography><strong>CPF:</strong> {formatCPF(selectedCustomer.cpf)}</Typography>
                        )}
                        {selectedCustomer.address && (
                          <Typography><strong>Endereço:</strong> {selectedCustomer.address}</Typography>
                        )}
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

      {/* Snackbar para Feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminClientes;
