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

  // MUDANÇA 1: useEffect com listener
  useEffect(() => {
    loadOrders();

    const handleOrdersUpdate = () => {
      console.log("🔄 MeusPedidos: Pedidos atualizados, recarregando...");

      // IMPORTANTE: Resetar filtros quando há novos pedidos
      // Isso garante que o usuário verá o pedido novo
      resetFilters();

      loadOrders();
    };

    window.addEventListener("orders:updated", handleOrdersUpdate);

    return () => {
      window.removeEventListener("orders:updated", handleOrdersUpdate);
    };
  }, []);
  // MUDANÇA 2: loadOrders corrigido para usar customerId real
  const loadOrders = async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Obter ID do usuário logado da sessão
      const session = Store.getSession();
      const customerId = session?.user?.id;

      if (!customerId) {
        console.warn("⚠️ Usuário não logado");
        setOrders([]);
        return;
      }

      const allOrders = Store.getOrders();
      // Filtrar APENAS pedidos deste usuário
      const userOrders = allOrders.filter(
        (order: Order) => order.customerId === customerId
      );

      console.log("📊 MeusPedidos - Carregando dados:");
      console.log("  👤 Customer ID:", customerId);
      console.log("  📦 Total de pedidos no sistema:", allOrders.length);
      console.log("  🎯 Pedidos do usuário:", userOrders.length);

      setOrders(userOrders);
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error);
    } finally {
      setLoading(false);
    }
  };
  // Este useEffect CRÍTICO aplica os filtros sempre que:
  // - Os pedidos mudam (orders)
  // - Os filtros mudam (statusFilter, dateFilter)
  // - A aba muda (activeTab)
  useEffect(() => {
    console.log("🔄 useEffect de filtros disparado!");
    console.log(
      "   Motivo: orders, statusFilter, dateFilter ou activeTab mudaram"
    );
    applyFilters();
  }, [orders, statusFilter, dateFilter, activeTab]);

  const applyFilters = () => {
    console.log("🔍 ========== INICIANDO FILTROS ==========");
    console.log("📦 Orders original:", orders.length, orders);

    let filtered = orders;

    // Log do estado inicial
    console.log("📊 Antes de qualquer filtro:", filtered.length);
    console.log("🎯 Status filter atual:", statusFilter || "(vazio)");
    console.log("📅 Date filter atual:", dateFilter || "(vazio)");
    console.log(
      "📑 Active tab atual:",
      activeTab,
      ["Todos", "Últimos 3 meses", "Último ano"][activeTab]
    );

    // Filtro por status
    if (statusFilter) {
      const beforeLength = filtered.length;
      filtered = filtered.filter((order) => order.status === statusFilter);
      console.log(
        `✂️ Filtro de status (${statusFilter}):`,
        beforeLength,
        "→",
        filtered.length
      );
    }

    // Filtro por data
    if (dateFilter) {
      const beforeLength = filtered.length;
      const filterDate = new Date(dateFilter);
      filtered = filtered.filter((order) => {
        const orderDate = new Date(order.createdAt);
        return orderDate.toDateString() === filterDate.toDateString();
      });
      console.log(
        `✂️ Filtro de data (${dateFilter}):`,
        beforeLength,
        "→",
        filtered.length
      );
    }

    // Filtro por aba (período)
    const now = new Date();

    switch (activeTab) {
      case 1: // Últimos 3 meses
        const threeMonthsAgo = new Date(now);
        threeMonthsAgo.setMonth(now.getMonth() - 3);

        console.log("📅 Filtrando por últimos 3 meses...");
        console.log("   Data atual:", now.toISOString());
        console.log("   Data de corte:", threeMonthsAgo.toISOString());

        const beforeLength3 = filtered.length;
        filtered = filtered.filter((order) => {
          const orderDate = new Date(order.createdAt);
          const isRecent = orderDate >= threeMonthsAgo;
          console.log(
            `   Pedido ${order.id.slice(-8)}:`,
            orderDate.toISOString(),
            isRecent ? "✅ INCLUÍDO" : "❌ EXCLUÍDO"
          );
          return isRecent;
        });
        console.log(
          `✂️ Filtro de 3 meses:`,
          beforeLength3,
          "→",
          filtered.length
        );
        break;

      case 2: // Último ano
        const oneYearAgo = new Date(now);
        oneYearAgo.setFullYear(now.getFullYear() - 1);

        console.log("📅 Filtrando por último ano...");
        const beforeLength1 = filtered.length;
        filtered = filtered.filter(
          (order) => new Date(order.createdAt) >= oneYearAgo
        );
        console.log(`✂️ Filtro de 1 ano:`, beforeLength1, "→", filtered.length);
        break;

      default: // Todos (activeTab === 0)
        console.log('📋 Aba "Todos" - sem filtro de período');
        break;
    }

    // Ordenar por data (mais recente primeiro)
    filtered.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    console.log("✅ RESULTADO FINAL:", filtered.length, "pedidos");

    if (filtered.length > 0) {
      console.log("🎯 Pedidos que serão exibidos:");
      filtered.forEach((order, idx) => {
        console.log(
          `   ${idx + 1}. ${order.id.slice(-8)} - ${new Date(
            order.createdAt
          ).toLocaleString("pt-BR")} - R$ ${order.total.toFixed(2)}`
        );
      });
    } else {
      console.log("⚠️ ATENÇÃO: NENHUM PEDIDO PASSOU PELOS FILTROS!");
    }

    console.log("🔍 ========== FIM DOS FILTROS ==========");

    setFilteredOrders(filtered);
  };

  // Função para resetar todos os filtros - útil quando há novos pedidos
  const resetFilters = () => {
    console.log("🔄 Resetando todos os filtros...");
    setStatusFilter("");
    setDateFilter("");
    setActiveTab(0); // Volta para "Todos os Pedidos"
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
