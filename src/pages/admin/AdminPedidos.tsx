import React, { useState, useEffect } from "react";
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
  Button,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  TextField,
  Stepper,
  Step,
  StepLabel,
} from "@mui/material";
import {
  Visibility,
  CheckCircle,
  LocalShipping,
  Payment,
  Cancel,
  Search,
} from "@mui/icons-material";
import * as Store from "../../store/index";
import { Order, Customer } from "../../types";

const AdminPedidos: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  // MUDANÇA 1: useEffect com listener
  useEffect(() => {
    loadData();

    const handleOrdersUpdate = () => {
      console.log("🔄 AdminPedidos: Pedidos atualizados, recarregando...");
      loadData();
    };

    window.addEventListener("orders:updated", handleOrdersUpdate);

    return () => {
      window.removeEventListener("orders:updated", handleOrdersUpdate);
    };
  }, []);

  // MUDANÇA 2: loadData com logs
  const loadData = () => {
    const loadedOrders = Store.getOrders();
    const loadedCustomers = Store.getCustomers();

    console.log("📊 AdminPedidos - Carregando dados:");
    console.log("  📦 Total de pedidos:", loadedOrders.length);
    console.log("  👥 Total de clientes:", loadedCustomers.length);

    if (loadedOrders.length > 0) {
      console.log("  🔍 Último pedido:", {
        id: loadedOrders[loadedOrders.length - 1].id,
        customerId: loadedOrders[loadedOrders.length - 1].customerId,
        status: loadedOrders[loadedOrders.length - 1].status,
      });
    }

    setOrders(loadedOrders);
    setCustomers(loadedCustomers);
  };

  const applyFilters = () => {
    let filtered = orders;

    if (searchTerm) {
      filtered = filtered.filter((order) => {
        const customer = customers.find((c) => c.id === order.customerId);
        return (
          order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer?.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    if (statusFilter) {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    // Ordenar por data (mais recente primeiro)
    filtered.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    setFilteredOrders(filtered);
  };

  const getCustomerName = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    return customer ? customer.name : "Cliente Desconhecido";
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, any> = {
      pending: "warning",
      processing: "info",
      shipped: "primary",
      delivered: "success",
      cancelled: "error",
    };
    return colors[status] || "default";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Aguardando Pagamento",
      processing: "Em Processamento",
      shipped: "Enviado",
      delivered: "Entregue",
      cancelled: "Cancelado",
    };
    return labels[status] || status;
  };

  const getStatusStep = (status: string) => {
    const steps = ["pending", "processing", "shipped", "delivered"];
    return steps.indexOf(status);
  };

  const showSnackbar = (message: string, severity: "success" | "error") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleUpdateOrderStatus = (orderId: string, newStatus: string) => {
    // Buscar todos os pedidos do sistema
    const allOrders = Store.getOrders();

    // Encontrar o índice do pedido que queremos atualizar
    const orderIndex = allOrders.findIndex((o) => o.id === orderId);

    if (orderIndex === -1) {
      showSnackbar("Pedido não encontrado", "error");
      return;
    }

    console.log(`🔄 Mudando status do pedido ${orderId}:`);
    console.log(`   De: ${allOrders[orderIndex].status}`);
    console.log(`   Para: ${newStatus}`);

    // Atualizar o status do pedido
    allOrders[orderIndex].status = newStatus as Order["status"];

    // Salvar no localStorage
    Store.writeStore(Store.STORE_KEYS.orders, allOrders);

    // Disparar evento para outros componentes saberem da mudança
    console.log("📢 Disparando evento orders:updated...");
    window.dispatchEvent(new CustomEvent("orders:updated"));

    // Recarregar dados locais
    loadData();

    showSnackbar(
      `Pedido ${getStatusLabel(newStatus).toLowerCase()} com sucesso!`,
      "success"
    );

    // Se o diálogo de detalhes estiver aberto, atualizar o pedido selecionado
    if (selectedOrder?.id === orderId) {
      setSelectedOrder(allOrders[orderIndex]);
    }
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
  };

  const calculateStats = () => {
    return {
      total: orders.length,
      pending: orders.filter((o) => o.status === "pending").length,
      processing: orders.filter((o) => o.status === "processing").length,
      shipped: orders.filter((o) => o.status === "shipped").length,
      delivered: orders.filter((o) => o.status === "delivered").length,
    };
  };

  const stats = calculateStats();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Gerenciamento de Pedidos
      </Typography>

      {/* Estatísticas */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" variant="body2">
                Total de Pedidos
              </Typography>
              <Typography variant="h4">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: "warning.light" }}>
            <CardContent>
              <Typography color="textSecondary" variant="body2">
                Aguardando Pagamento
              </Typography>
              <Typography variant="h4">{stats.pending}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: "info.light" }}>
            <CardContent>
              <Typography color="textSecondary" variant="body2">
                Em Processamento
              </Typography>
              <Typography variant="h4">{stats.processing}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: "primary.light" }}>
            <CardContent>
              <Typography color="textSecondary" variant="body2">
                Enviados
              </Typography>
              <Typography variant="h4">{stats.shipped}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: "success.light" }}>
            <CardContent>
              <Typography color="textSecondary" variant="body2">
                Entregues
              </Typography>
              <Typography variant="h4">{stats.delivered}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Alertas */}
      {stats.pending > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Você tem {stats.pending} pedido(s) aguardando confirmação de
          pagamento!
        </Alert>
      )}

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Buscar por ID do pedido ou nome do cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <Search sx={{ mr: 1, color: "text.secondary" }} />
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="pending">Aguardando Pagamento</MenuItem>
                <MenuItem value="processing">Em Processamento</MenuItem>
                <MenuItem value="shipped">Enviado</MenuItem>
                <MenuItem value="delivered">Entregue</MenuItem>
                <MenuItem value="cancelled">Cancelado</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("");
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
              <TableCell>ID</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Data</TableCell>
              <TableCell>Itens</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredOrders.map((order) => (
              <TableRow key={order.id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    #{order.id.slice(-8).toUpperCase()}
                  </Typography>
                </TableCell>
                <TableCell>{getCustomerName(order.customerId)}</TableCell>
                <TableCell>
                  {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                </TableCell>
                <TableCell>{order.items.length} itens</TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    R$ {order.total.toFixed(2)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={getStatusLabel(order.status)}
                    size="small"
                    color={getStatusColor(order.status)}
                  />
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    size="small"
                    onClick={() => handleViewDetails(order)}
                  >
                    <Visibility />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog de Detalhes */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Pedido #{selectedOrder?.id.slice(-8).toUpperCase()}
        </DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box sx={{ mt: 2 }}>
              {/* Stepper de Status */}
              {selectedOrder.status !== "cancelled" && (
                <Stepper
                  activeStep={getStatusStep(selectedOrder.status)}
                  sx={{ mb: 4 }}
                >
                  <Step>
                    <StepLabel>Aguardando Pagamento</StepLabel>
                  </Step>
                  <Step>
                    <StepLabel>Em Processamento</StepLabel>
                  </Step>
                  <Step>
                    <StepLabel>Enviado</StepLabel>
                  </Step>
                  <Step>
                    <StepLabel>Entregue</StepLabel>
                  </Step>
                </Stepper>
              )}

              {/* Informações */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Cliente
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {getCustomerName(selectedOrder.customerId)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Data do Pedido
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {new Date(selectedOrder.createdAt).toLocaleString("pt-BR")}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Total
                  </Typography>
                  <Typography variant="h6" color="primary">
                    R$ {selectedOrder.total.toFixed(2)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Status Atual
                  </Typography>
                  <Chip
                    label={getStatusLabel(selectedOrder.status)}
                    color={getStatusColor(selectedOrder.status)}
                  />
                </Grid>
              </Grid>

              {/* Endereço */}
              {selectedOrder.shippingAddress && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Endereço de Entrega
                  </Typography>
                  <Typography>
                    {selectedOrder.shippingAddress.firstName}{" "}
                    {selectedOrder.shippingAddress.lastName}
                  </Typography>
                  <Typography>
                    {selectedOrder.shippingAddress.address}
                  </Typography>
                  <Typography>
                    {selectedOrder.shippingAddress.city},{" "}
                    {selectedOrder.shippingAddress.state} -{" "}
                    {selectedOrder.shippingAddress.zipCode}
                  </Typography>
                  <Typography>{selectedOrder.shippingAddress.phone}</Typography>
                </Box>
              )}

              {/* Itens */}
              <Typography variant="h6" gutterBottom>
                Itens do Pedido
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Produto</TableCell>
                      <TableCell>Qtd</TableCell>
                      <TableCell align="right">Preço Unit.</TableCell>
                      <TableCell align="right">Subtotal</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedOrder.items.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{item.card.name}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell align="right">
                          R$ {item.card.price.toFixed(2)}
                        </TableCell>
                        <TableCell align="right">
                          R$ {(item.card.price * item.quantity).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Ações Administrativas */}
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Ações Administrativas
                </Typography>

                {selectedOrder.status === "pending" && (
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<Payment />}
                      onClick={() =>
                        handleUpdateOrderStatus(selectedOrder.id, "processing")
                      }
                    >
                      Confirmar Pagamento
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<Cancel />}
                      onClick={() =>
                        handleUpdateOrderStatus(selectedOrder.id, "cancelled")
                      }
                    >
                      Cancelar Pedido
                    </Button>
                  </Box>
                )}

                {selectedOrder.status === "processing" && (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<LocalShipping />}
                    onClick={() =>
                      handleUpdateOrderStatus(selectedOrder.id, "shipped")
                    }
                  >
                    Marcar como Enviado
                  </Button>
                )}

                {selectedOrder.status === "shipped" && (
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<CheckCircle />}
                    onClick={() =>
                      handleUpdateOrderStatus(selectedOrder.id, "delivered")
                    }
                  >
                    Confirmar Entrega
                  </Button>
                )}

                {selectedOrder.status === "delivered" && (
                  <Alert severity="success">Pedido entregue com sucesso!</Alert>
                )}

                {selectedOrder.status === "cancelled" && (
                  <Alert severity="error">Este pedido foi cancelado.</Alert>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminPedidos;
