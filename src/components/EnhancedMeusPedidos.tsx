import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  List,
  ListItem,
  ListItemText,
  Divider,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from "@mui/material";
import {
  Receipt,
  LocalShipping,
  CheckCircle,
  Cancel,
  Search,
  Visibility,
  Print,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import * as Store from "../store/index";
import { Order, OrderStatus } from "../types";

const EnhancedMeusPedidos: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const customerId = "current-user"; // Substituir pela ID do usuário logado

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [orders, searchTerm, statusFilter]);

  const loadOrders = () => {
    const customerOrders = Store.getOrdersByCustomer(customerId);
    // Ordenar por data mais recente
    customerOrders.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    setOrders(customerOrders);
  };

  const applyFilters = () => {
    let filtered = [...orders];

    // Filtro por termo de busca (ID do pedido ou produto)
    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.items.some((item) =>
            item.card.name.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }

    // Filtro por status
    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  };

  const getStatusLabel = (status: OrderStatus) => {
    const statusMap = {
      pending: "Em Aberto",
      processing: "Processando",
      shipped: "Enviado",
      delivered: "Entregue",
      cancelled: "Cancelado",
    };
    return statusMap[status];
  };

  const getStatusColor = (status: OrderStatus) => {
    const colorMap = {
      pending: "warning" as const,
      processing: "info" as const,
      shipped: "primary" as const,
      delivered: "success" as const,
      cancelled: "error" as const,
    };
    return colorMap[status];
  };

  const getStatusIcon = (status: OrderStatus) => {
    const iconMap = {
      pending: <Receipt />,
      processing: <LocalShipping />,
      shipped: <LocalShipping />,
      delivered: <CheckCircle />,
      cancelled: <Cancel />,
    };
    return iconMap[status];
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsDialogOpen(true);
  };

  const handleCancelOrder = (orderId: string) => {
    if (window.confirm("Tem certeza que deseja cancelar este pedido?")) {
      if (Store.cancelOrder(orderId)) {
        loadOrders();
        alert("Pedido cancelado com sucesso!");
      } else {
        alert("Não foi possível cancelar o pedido. Verifique o status.");
      }
    }
  };

  const canCancelOrder = (order: Order): boolean => {
    return order.status === "pending" || order.status === "processing";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getOrderSummary = () => {
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, order) => {
      return order.status !== "cancelled" ? sum + order.total : sum;
    }, 0);

    const statusCounts = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<OrderStatus, number>);

    return { totalOrders, totalSpent, statusCounts };
  };

  const summary = getOrderSummary();

  if (orders.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <Receipt sx={{ fontSize: 80, color: "text.secondary", mb: 2 }} />
        <Typography variant="h4" component="h1" gutterBottom>
          Meus Pedidos
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
          Você ainda não fez nenhum pedido
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={() => navigate("/catalogo")}
        >
          Começar a Comprar
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Meus Pedidos
      </Typography>

      {/* Resumo */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h4" color="primary">
                {summary.totalOrders}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total de Pedidos
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h4" color="success.main">
                R$ {summary.totalSpent.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Gasto
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h4" color="info.main">
                {summary.statusCounts.delivered || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pedidos Entregues
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h4" color="warning.main">
                {(summary.statusCounts.pending || 0) +
                  (summary.statusCounts.processing || 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pedidos em Andamento
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Buscar por ID do pedido ou produto"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <Search sx={{ mr: 1, color: "text.secondary" }} />
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) =>
                    setStatusFilter(e.target.value as OrderStatus | "all")
                  }
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="pending">Em Aberto</MenuItem>
                  <MenuItem value="processing">Processando</MenuItem>
                  <MenuItem value="shipped">Enviado</MenuItem>
                  <MenuItem value="delivered">Entregue</MenuItem>
                  <MenuItem value="cancelled">Cancelado</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={12} md={5}>
              <Typography variant="body2" color="text.secondary">
                {filteredOrders.length} de {orders.length} pedidos
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Lista de pedidos */}
      {filteredOrders.length === 0 ? (
        <Alert severity="info">
          Nenhum pedido encontrado com os filtros aplicados.
        </Alert>
      ) : (
        <Grid container spacing={2}>
          {filteredOrders.map((order) => (
            <Grid item xs={12} key={order.id}>
              <Card>
                <CardContent>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6} md={3}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        {getStatusIcon(order.status)}
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {order.id}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(order.createdAt)}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={6} md={2}>
                      <Chip
                        label={getStatusLabel(order.status)}
                        color={getStatusColor(order.status)}
                        size="small"
                      />
                    </Grid>

                    <Grid item xs={12} sm={6} md={2}>
                      <Typography variant="body2" color="text.secondary">
                        {order.items.length} item(s)
                      </Typography>
                      <Typography variant="subtitle1" fontWeight="bold">
                        R$ {order.total.toFixed(2)}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="body2" color="text.secondary">
                        {order.items
                          .slice(0, 2)
                          .map((item) => item.card.name)
                          .join(", ")}
                        {order.items.length > 2 &&
                          ` +${order.items.length - 2} mais`}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={12} md={2}>
                      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Visibility />}
                          onClick={() => handleViewOrder(order)}
                        >
                          Ver
                        </Button>
                        {canCancelOrder(order) && (
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<Cancel />}
                            onClick={() => handleCancelOrder(order.id)}
                          >
                            Cancelar
                          </Button>
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Dialog de detalhes do pedido */}
      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedOrder && (
          <>
            <DialogTitle>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography variant="h6">Pedido {selectedOrder.id}</Typography>
                <Chip
                  label={getStatusLabel(selectedOrder.status)}
                  color={getStatusColor(selectedOrder.status)}
                />
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Informações do Pedido
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary="Data do Pedido"
                        secondary={formatDate(selectedOrder.createdAt)}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Status"
                        secondary={getStatusLabel(selectedOrder.status)}
                      />
                    </ListItem>
                    {selectedOrder.estimatedDelivery && (
                      <ListItem>
                        <ListItemText
                          primary="Previsão de Entrega"
                          secondary={formatDate(
                            selectedOrder.estimatedDelivery
                          )}
                        />
                      </ListItem>
                    )}
                  </List>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Endereço de Entrega
                  </Typography>
                  <Typography variant="body2">
                    {selectedOrder.shippingAddress.firstName}{" "}
                    {selectedOrder.shippingAddress.lastName}
                    <br />
                    {selectedOrder.shippingAddress.address}
                    <br />
                    {selectedOrder.shippingAddress.city},{" "}
                    {selectedOrder.shippingAddress.state}
                    <br />
                    {selectedOrder.shippingAddress.zipCode}
                    <br />
                    {selectedOrder.shippingAddress.phone}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    Itens do Pedido
                  </Typography>
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Produto</TableCell>
                          <TableCell align="center">Quantidade</TableCell>
                          <TableCell align="right">Preço Unit.</TableCell>
                          <TableCell align="right">Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedOrder.items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Box>
                                <Typography variant="body2" fontWeight="bold">
                                  {item.card.name}
                                </Typography>
                                <Box
                                  sx={{ display: "flex", gap: 0.5, mt: 0.5 }}
                                >
                                  <Chip label={item.card.type} size="small" />
                                  <Chip label={item.card.rarity} size="small" />
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell align="center">
                              {item.quantity}
                            </TableCell>
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
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Typography>Subtotal:</Typography>
                    <Typography>
                      R$ {selectedOrder.subtotal.toFixed(2)}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Typography>Frete:</Typography>
                    <Typography>
                      R$ {selectedOrder.shippingCost.toFixed(2)}
                    </Typography>
                  </Box>
                  {selectedOrder.discountAmount > 0 && (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Typography color="success.main">Desconto:</Typography>
                      <Typography color="success.main">
                        -R$ {selectedOrder.discountAmount.toFixed(2)}
                      </Typography>
                    </Box>
                  )}
                  <Divider sx={{ my: 1 }} />
                  <Box
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Typography variant="h6" fontWeight="bold">
                      Total:
                    </Typography>
                    <Typography variant="h6" fontWeight="bold" color="primary">
                      R$ {selectedOrder.total.toFixed(2)}
                    </Typography>
                  </Box>

                  {selectedOrder.appliedCoupons &&
                    selectedOrder.appliedCoupons.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Cupons Utilizados:
                        </Typography>
                        {selectedOrder.appliedCoupons.map((coupon) => (
                          <Chip
                            key={coupon.couponId}
                            label={`${
                              coupon.code
                            } (-R$ ${coupon.discount.toFixed(2)})`}
                            size="small"
                            sx={{ mr: 1, mb: 1 }}
                          />
                        ))}
                      </Box>
                    )}
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button startIcon={<Print />} onClick={() => window.print()}>
                Imprimir
              </Button>
              <Button onClick={() => setIsDialogOpen(false)}>Fechar</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default EnhancedMeusPedidos;
