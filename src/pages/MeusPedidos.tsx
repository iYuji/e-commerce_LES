import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Alert,
  LinearProgress,
  TextField,
  MenuItem,
  Tabs,
  Tab,
} from "@mui/material";
import {
  ExpandMore,
  Receipt,
  LocalShipping,
  CheckCircle,
  Cancel,
  Visibility,
  Download,
  Refresh,
  FilterList,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import * as Store from "../store/index";
import { Order, OrderStatus } from "../types";

const statusColors: Record<
  OrderStatus,
  "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"
> = {
  pending: "warning",
  processing: "info",
  shipped: "primary",
  delivered: "success",
  cancelled: "error",
};

const statusLabels: Record<OrderStatus, string> = {
  pending: "Pendente",
  processing: "Processando",
  shipped: "Enviado",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

const MeusPedidos: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("");
  const [dateFilter, setDateFilter] = useState("");
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [orders, statusFilter, dateFilter, activeTab]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      // Simular delay de carregamento
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Obter pedidos do usuário atual (simulado)
      const allOrders = Store.getOrders();
      const userOrders = allOrders.filter(
        (order: Order) => order.customerId === "current-user"
      );

      setOrders(userOrders);
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = orders;

    // Filtro por status
    if (statusFilter) {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    // Filtro por data
    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      filtered = filtered.filter((order) => {
        const orderDate = new Date(order.createdAt);
        return orderDate.toDateString() === filterDate.toDateString();
      });
    }

    // Filtro por aba
    const now = new Date();
    const threeMonthsAgo = new Date(now.setMonth(now.getMonth() - 3));
    const oneYearAgo = new Date(now.setFullYear(now.getFullYear() - 1));

    switch (activeTab) {
      case 1: // Últimos 3 meses
        filtered = filtered.filter(
          (order) => new Date(order.createdAt) >= threeMonthsAgo
        );
        break;
      case 2: // Último ano
        filtered = filtered.filter(
          (order) => new Date(order.createdAt) >= oneYearAgo
        );
        break;
      default: // Todos
        break;
    }

    // Ordenar por data (mais recente primeiro)
    filtered.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    setFilteredOrders(filtered);
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
  };

  const handleDownloadInvoice = (order: Order) => {
    // Simular download da nota fiscal
    const invoice = `
      NOTA FISCAL - Pedido #${order.id}
      
      Data: ${new Date(order.createdAt).toLocaleDateString("pt-BR")}
      
      Itens:
      ${order.items
        .map(
          (item) =>
            `- ${item.card.name} x${item.quantity} - R$ ${(
              item.card.price * item.quantity
            ).toFixed(2)}`
        )
        .join("\n")}
      
      Total: R$ ${order.total.toFixed(2)}
      Status: ${statusLabels[order.status]}
      
      Endereço de Entrega:
      ${
        order.shippingAddress
          ? `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}
      ${order.shippingAddress.address}
      ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.zipCode}`
          : "Não disponível"
      }
    `;

    const blob = new Blob([invoice], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nota-fiscal-${order.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case "delivered":
        return <CheckCircle />;
      case "shipped":
        return <LocalShipping />;
      case "cancelled":
        return <Cancel />;
      default:
        return <Receipt />;
    }
  };

  const getDeliveryProgress = (order: Order) => {
    const statusOrder = ["pending", "processing", "shipped", "delivered"];
    const currentIndex = statusOrder.indexOf(order.status);
    return order.status === "cancelled"
      ? 0
      : ((currentIndex + 1) / statusOrder.length) * 100;
  };

  const clearFilters = () => {
    setStatusFilter("");
    setDateFilter("");
    setActiveTab(0);
  };

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Meus Pedidos
        </Typography>
        <LinearProgress sx={{ mt: 2 }} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Carregando seus pedidos...
        </Typography>
      </Box>
    );
  }

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
          Meus Pedidos
        </Typography>
        <Button startIcon={<Refresh />} onClick={loadOrders} variant="outlined">
          Atualizar
        </Button>
      </Box>

      {/* Tabs de Período */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
        >
          <Tab label="Todos os Pedidos" />
          <Tab label="Últimos 3 Meses" />
          <Tab label="Último Ano" />
        </Tabs>
      </Paper>

      {/* Filtros */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <FilterList />
          <Typography variant="h6">Filtros</Typography>
          <Button size="small" onClick={clearFilters}>
            Limpar Filtros
          </Button>
        </Box>

        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              select
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as OrderStatus)}
              size="small"
            >
              <MenuItem value="">Todos</MenuItem>
              {Object.entries(statusLabels).map(([status, label]) => (
                <MenuItem key={status} value={status}>
                  {label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              type="date"
              label="Data do Pedido"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
          </Grid>
        </Grid>
      </Card>

      {/* Lista de Pedidos */}
      {filteredOrders.length === 0 ? (
        <Alert severity="info" sx={{ mt: 3 }}>
          {orders.length === 0
            ? "Você ainda não fez nenhum pedido."
            : "Nenhum pedido encontrado com os filtros selecionados."}
          <Button
            variant="outlined"
            sx={{ ml: 2 }}
            onClick={() => navigate("/catalogo")}
          >
            Começar a Comprar
          </Button>
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {filteredOrders.map((order) => (
            <Grid item xs={12} key={order.id}>
              <Card>
                <CardContent>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={3}>
                      <Typography variant="h6" gutterBottom>
                        Pedido #{order.id}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(order.createdAt).toLocaleDateString("pt-BR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={2}>
                      <Chip
                        icon={getStatusIcon(order.status)}
                        label={statusLabels[order.status]}
                        color={statusColors[order.status]}
                        variant="outlined"
                      />
                    </Grid>

                    <Grid item xs={12} sm={2}>
                      <Typography variant="body2" color="text.secondary">
                        Total
                      </Typography>
                      <Typography variant="h6" color="primary">
                        R$ {order.total.toFixed(2)}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={3}>
                      {order.status !== "cancelled" &&
                        order.status !== "delivered" && (
                          <Box>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              gutterBottom
                            >
                              Progresso da Entrega
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={getDeliveryProgress(order)}
                              sx={{ height: 8, borderRadius: 4 }}
                            />
                          </Box>
                        )}
                      {order.estimatedDelivery &&
                        order.status !== "delivered" &&
                        order.status !== "cancelled" && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 1 }}
                          >
                            Previsão:{" "}
                            {new Date(
                              order.estimatedDelivery
                            ).toLocaleDateString("pt-BR")}
                          </Typography>
                        )}
                    </Grid>

                    <Grid item xs={12} sm={2}>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 1,
                        }}
                      >
                        <Tooltip title="Ver Detalhes">
                          <IconButton
                            onClick={() => handleViewDetails(order)}
                            color="primary"
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Baixar Nota Fiscal">
                          <IconButton
                            onClick={() => handleDownloadInvoice(order)}
                            color="secondary"
                          >
                            <Download />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Grid>
                  </Grid>

                  {/* Accordion com itens do pedido */}
                  <Accordion sx={{ mt: 2 }}>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography>
                        {order.items.length} item(s) - Ver detalhes
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List>
                        {order.items.map((item, index) => {
                          // Verificar se o card existe
                          if (!item.card) {
                            return (
                              <ListItem key={index} sx={{ px: 0 }}>
                                <ListItemText
                                  primary={
                                    <Typography color="text.secondary">
                                      Produto não disponível × {item.quantity}
                                    </Typography>
                                  }
                                />
                              </ListItem>
                            );
                          }

                          return (
                            <ListItem key={index} sx={{ px: 0 }}>
                              <ListItemText
                                primary={
                                  <Box
                                    sx={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                    }}
                                  >
                                    <Typography>
                                      {item.card.name} × {item.quantity}
                                    </Typography>
                                    <Typography fontWeight="bold">
                                      R${" "}
                                      {(
                                        item.card.price * item.quantity
                                      ).toFixed(2)}
                                    </Typography>
                                  </Box>
                                }
                                secondary={
                                  <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                                    <Chip label={item.card.type} size="small" />
                                    <Chip
                                      label={item.card.rarity}
                                      size="small"
                                    />
                                  </Box>
                                }
                              />
                            </ListItem>
                          );
                        })}
                      </List>
                    </AccordionDetails>
                  </Accordion>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Dialog de Detalhes do Pedido */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Detalhes do Pedido #{selectedOrder?.id}</DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Informações do Pedido
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Data:</strong>{" "}
                  {new Date(selectedOrder.createdAt).toLocaleDateString(
                    "pt-BR"
                  )}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Status:</strong>
                  <Chip
                    label={statusLabels[selectedOrder.status]}
                    color={statusColors[selectedOrder.status]}
                    size="small"
                    sx={{ ml: 1 }}
                  />
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Método de Pagamento:</strong>{" "}
                  {selectedOrder.paymentInfo?.method ||
                    (selectedOrder as any).paymentMethod ||
                    "Não informado"}
                </Typography>
                {selectedOrder.estimatedDelivery && (
                  <Typography variant="body2" gutterBottom>
                    <strong>Previsão de Entrega:</strong>{" "}
                    {new Date(
                      selectedOrder.estimatedDelivery
                    ).toLocaleDateString("pt-BR")}
                  </Typography>
                )}
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Endereço de Entrega
                </Typography>
                {selectedOrder.shippingAddress ? (
                  <Typography variant="body2">
                    {selectedOrder.shippingAddress.firstName}{" "}
                    {selectedOrder.shippingAddress.lastName}
                    <br />
                    {selectedOrder.shippingAddress.address}
                    <br />
                    {selectedOrder.shippingAddress.city},{" "}
                    {selectedOrder.shippingAddress.state} -{" "}
                    {selectedOrder.shippingAddress.zipCode}
                    <br />
                    {selectedOrder.shippingAddress.phone}
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Endereço não disponível
                  </Typography>
                )}
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Itens do Pedido
                </Typography>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Produto</TableCell>
                        <TableCell>Tipo</TableCell>
                        <TableCell>Raridade</TableCell>
                        <TableCell align="center">Quantidade</TableCell>
                        <TableCell align="right">Preço Unit.</TableCell>
                        <TableCell align="right">Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedOrder.items.map((item, index) => {
                        // Verificar se o card existe
                        if (!item.card) {
                          return (
                            <TableRow key={index}>
                              <TableCell colSpan={6}>
                                <Typography color="text.secondary">
                                  Produto não disponível (Quantidade:{" "}
                                  {item.quantity})
                                </Typography>
                              </TableCell>
                            </TableRow>
                          );
                        }

                        return (
                          <TableRow key={index}>
                            <TableCell>{item.card.name}</TableCell>
                            <TableCell>
                              <Chip label={item.card.type} size="small" />
                            </TableCell>
                            <TableCell>
                              <Chip label={item.card.rarity} size="small" />
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
                        );
                      })}
                      <TableRow>
                        <TableCell colSpan={5}>
                          <Typography variant="h6">Total do Pedido</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="h6" color="primary">
                            R$ {selectedOrder.total.toFixed(2)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Fechar</Button>
          {selectedOrder && (
            <Button
              onClick={() => handleDownloadInvoice(selectedOrder)}
              variant="contained"
              startIcon={<Download />}
            >
              Baixar Nota Fiscal
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MeusPedidos;
