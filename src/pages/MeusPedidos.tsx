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
  Checkbox,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  Stepper,
  Step,
  StepLabel,
  Snackbar,
  Radio,
  RadioGroup,
  Badge,
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
  SwapHoriz,
  Info,
  MoneyOff,
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

const exchangeReasons = [
  "Produto com defeito",
  "Produto danificado no transporte",
  "Recebi produto errado",
  "Outro motivo",
];

const productConditions = [
  "Lacrado/Sem uso",
  "Aberto mas não usado",
  "Usado poucas vezes",
  "Com avarias/defeitos",
];

interface ExchangeItemSelection {
  productId: string;
  productName: string;
  imageUrl?: string;
  quantity: number;
  maxQuantity: number;
  price: number;
  reason: string;
  condition: string;
  selected: boolean;
}

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

  // Estados para o sistema de trocas/devoluções
  const [exchangeDialogOpen, setExchangeDialogOpen] = useState(false);
  const [exchangeStep, setExchangeStep] = useState(0);
  const [exchangeItems, setExchangeItems] = useState<ExchangeItemSelection[]>(
    []
  );
  const [exchangeNotes, setExchangeNotes] = useState("");

  // NOVO: Tipo de solicitação (troca ou devolução)
  const [requestType, setRequestType] = useState<"exchange" | "refund">(
    "exchange"
  );

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "info",
  });

  // NOVO: Estado para armazenar solicitações de troca/devolução
  const [exchangeRequests, setExchangeRequests] = useState<any[]>([]);

  useEffect(() => {
    loadOrders();
    loadExchangeRequests();

    const handleOrdersUpdate = () => {
      console.log("🔄 MeusPedidos: Pedidos atualizados, recarregando...");
      resetFilters();
      loadOrders();
    };

    const handleExchangesUpdate = () => {
      console.log("🔄 MeusPedidos: Trocas atualizadas, recarregando...");
      loadExchangeRequests();
    };

    window.addEventListener("orders:updated", handleOrdersUpdate);
    window.addEventListener("exchanges:updated", handleExchangesUpdate);

    return () => {
      window.removeEventListener("orders:updated", handleOrdersUpdate);
      window.removeEventListener("exchanges:updated", handleExchangesUpdate);
    };
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const session = Store.getSession();
      const customerId = session?.user?.id;

      if (!customerId) {
        console.warn("⚠️ Usuário não logado");
        setOrders([]);
        return;
      }

      const allOrders = Store.getOrders();
      const userOrders = allOrders.filter(
        (order: Order) => order.customerId === customerId
      );

      setOrders(userOrders);
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error);
    } finally {
      setLoading(false);
    }
  };

  // NOVA FUNÇÃO: Carrega solicitações de troca/devolução
  const loadExchangeRequests = () => {
    const session = Store.getSession();
    const customerId = session?.user?.id;

    if (!customerId) return;

    const stored = localStorage.getItem("exchange_requests");
    if (stored) {
      const allRequests = JSON.parse(stored);
      const userRequests = allRequests.filter(
        (req: any) => req.customerId === customerId
      );
      setExchangeRequests(userRequests);
    }
  };

  // NOVA FUNÇÃO: Verifica se um pedido tem troca/devolução em andamento
  const getOrderExchangeStatus = (orderId: string) => {
    const request = exchangeRequests.find(
      (req) =>
        req.orderId === orderId &&
        req.status !== "Concluída" &&
        req.status !== "Recusada"
    );
    return request;
  };

  useEffect(() => {
    applyFilters();
  }, [orders, statusFilter, dateFilter, activeTab]);

  const applyFilters = () => {
    let filtered = orders;

    if (statusFilter) {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      filtered = filtered.filter((order) => {
        const orderDate = new Date(order.createdAt);
        return orderDate.toDateString() === filterDate.toDateString();
      });
    }

    const now = new Date();

    switch (activeTab) {
      case 1:
        const threeMonthsAgo = new Date(now);
        threeMonthsAgo.setMonth(now.getMonth() - 3);
        filtered = filtered.filter(
          (order) => new Date(order.createdAt) >= threeMonthsAgo
        );
        break;

      case 2:
        const oneYearAgo = new Date(now);
        oneYearAgo.setFullYear(now.getFullYear() - 1);
        filtered = filtered.filter(
          (order) => new Date(order.createdAt) >= oneYearAgo
        );
        break;
    }

    filtered.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    setFilteredOrders(filtered);
  };

  const resetFilters = () => {
    setStatusFilter("");
    setDateFilter("");
    setActiveTab(0);
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
  };

  const canRequestExchange = (order: Order): boolean => {
    if (order.status !== "delivered") {
      return false;
    }

    const deliveryDate = new Date(order.createdAt);
    const now = new Date();
    const daysSinceDelivery = Math.floor(
      (now.getTime() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    return daysSinceDelivery <= 30;
  };

  const handleOpenExchangeDialog = (order: Order) => {
    const items: ExchangeItemSelection[] = order.items
      .filter((item) => item.card)
      .map((item) => ({
        productId: item.cardId,
        productName: item.card.name,
        quantity: 0,
        maxQuantity: item.quantity,
        price: item.card.price,
        reason: "",
        condition: "",
        selected: false,
      }));

    setExchangeItems(items);
    setExchangeNotes("");
    setExchangeStep(0);
    setRequestType("exchange"); // Começa com troca por padrão
    setSelectedOrder(order);
    setExchangeDialogOpen(true);
  };

  const handleToggleExchangeItem = (index: number) => {
    const updatedItems = [...exchangeItems];
    updatedItems[index].selected = !updatedItems[index].selected;

    if (updatedItems[index].selected && updatedItems[index].quantity === 0) {
      updatedItems[index].quantity = 1;
    }

    setExchangeItems(updatedItems);
  };

  const handleUpdateExchangeQuantity = (index: number, quantity: number) => {
    const updatedItems = [...exchangeItems];
    const validQuantity = Math.max(
      1,
      Math.min(quantity, updatedItems[index].maxQuantity)
    );
    updatedItems[index].quantity = validQuantity;
    setExchangeItems(updatedItems);
  };

  const handleUpdateExchangeReason = (index: number, reason: string) => {
    const updatedItems = [...exchangeItems];
    updatedItems[index].reason = reason;
    setExchangeItems(updatedItems);
  };

  const handleUpdateExchangeCondition = (index: number, condition: string) => {
    const updatedItems = [...exchangeItems];
    updatedItems[index].condition = condition;
    setExchangeItems(updatedItems);
  };

  const canProceedToNextStep = (): boolean => {
    const selectedItems = exchangeItems.filter((item) => item.selected);

    if (selectedItems.length === 0) {
      return false;
    }

    if (exchangeStep === 0) {
      return true;
    }

    if (exchangeStep === 1) {
      return selectedItems.every(
        (item) => item.reason && item.condition && item.quantity > 0
      );
    }

    return true;
  };

  const calculateExchangeValue = (): number => {
    return exchangeItems
      .filter((item) => item.selected)
      .reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const handleSubmitExchange = () => {
    if (!selectedOrder) return;

    const selectedItems = exchangeItems.filter((item) => item.selected);

    if (selectedItems.length === 0) {
      showSnackbar("Selecione pelo menos um item para trocar", "error");
      return;
    }

    const exchangeRequest = {
      id: `exchange_${Date.now()}`,
      orderId: selectedOrder.id,
      customerId: selectedOrder.customerId,
      // NOVO: Adiciona o tipo de solicitação
      type: requestType,
      items: selectedItems.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        imageUrl: item.imageUrl,
        quantity: item.quantity,
        price: item.price,
        reason: item.reason,
        condition: item.condition,
      })),
      reason: selectedItems[0].reason,
      status: "Aguardando Aprovação",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      exchangeCouponValue: calculateExchangeValue(),
      notes: exchangeNotes,
    };

    try {
      const existingExchanges = localStorage.getItem("exchange_requests");
      const exchanges = existingExchanges ? JSON.parse(existingExchanges) : [];

      exchanges.push(exchangeRequest);

      localStorage.setItem("exchange_requests", JSON.stringify(exchanges));

      console.log("✅ Solicitação criada:", exchangeRequest);

      window.dispatchEvent(new CustomEvent("exchanges:updated"));

      setExchangeDialogOpen(false);

      const message =
        requestType === "exchange"
          ? "Solicitação de troca enviada com sucesso! Você receberá um cupom após aprovação."
          : "Solicitação de devolução enviada com sucesso! Você receberá reembolso após aprovação.";

      showSnackbar(message, "success");

      loadOrders();
      loadExchangeRequests();
    } catch (error) {
      console.error("Erro ao criar solicitação:", error);
      showSnackbar("Erro ao enviar solicitação. Tente novamente.", "error");
    }
  };

  const showSnackbar = (
    message: string,
    severity: "success" | "error" | "info"
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleDownloadInvoice = (order: Order) => {
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
          {filteredOrders.map((order) => {
            // NOVO: Verifica se há troca/devolução em andamento
            const exchangeStatus = getOrderExchangeStatus(order.id);

            return (
              <Grid item xs={12} key={order.id}>
                <Badge
                  badgeContent={
                    exchangeStatus
                      ? exchangeStatus.type === "exchange"
                        ? "Troca em Andamento"
                        : "Devolução em Andamento"
                      : null
                  }
                  color={
                    exchangeStatus?.type === "exchange" ? "info" : "warning"
                  }
                  sx={{
                    width: "100%",
                    "& .MuiBadge-badge": {
                      right: 20,
                      top: 20,
                    },
                  }}
                >
                  <Card sx={{ width: "100%" }}>
                    <CardContent>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={3}>
                          <Typography variant="h6" gutterBottom>
                            Pedido #{order.id}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(order.createdAt).toLocaleDateString(
                              "pt-BR",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
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

                            {canRequestExchange(order) && !exchangeStatus && (
                              <Tooltip title="Solicitar Troca/Devolução">
                                <IconButton
                                  onClick={() =>
                                    handleOpenExchangeDialog(order)
                                  }
                                  color="info"
                                >
                                  <SwapHoriz />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </Grid>
                      </Grid>

                      <Accordion sx={{ mt: 2 }}>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                          <Typography>
                            {order.items.length} item(s) - Ver detalhes
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <List>
                            {order.items.map((item, index) => {
                              if (!item.card) {
                                return (
                                  <ListItem key={index} sx={{ px: 0 }}>
                                    <ListItemText
                                      primary={
                                        <Typography color="text.secondary">
                                          Produto não disponível ×{" "}
                                          {item.quantity}
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
                                      <Box
                                        sx={{ display: "flex", gap: 1, mt: 1 }}
                                      >
                                        <Chip
                                          label={item.card.type}
                                          size="small"
                                        />
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

                      {/* ATUALIZADO: Alerta mostrando status da troca/devolução */}
                      {exchangeStatus && (
                        <Alert
                          severity={
                            exchangeStatus.type === "exchange"
                              ? "info"
                              : "warning"
                          }
                          sx={{ mt: 2 }}
                          icon={
                            exchangeStatus.type === "exchange" ? (
                              <SwapHoriz />
                            ) : (
                              <MoneyOff />
                            )
                          }
                        >
                          <Typography variant="body2" fontWeight="bold">
                            {exchangeStatus.type === "exchange"
                              ? "Troca em Andamento"
                              : "Devolução em Andamento"}
                          </Typography>
                          <Typography variant="caption">
                            Status: {exchangeStatus.status}
                          </Typography>
                        </Alert>
                      )}

                      {canRequestExchange(order) && !exchangeStatus && (
                        <Alert severity="info" sx={{ mt: 2 }} icon={<Info />}>
                          Você pode solicitar troca ou devolução até{" "}
                          {new Date(
                            new Date(order.createdAt).getTime() +
                              30 * 24 * 60 * 60 * 1000
                          ).toLocaleDateString("pt-BR")}
                          .{" "}
                          <Button
                            size="small"
                            onClick={() => handleOpenExchangeDialog(order)}
                            sx={{ ml: 1 }}
                          >
                            Solicitar
                          </Button>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                </Badge>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Dialog de Detalhes (mantém o código original) */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Detalhes do Pedido #{selectedOrder?.id}</DialogTitle>
        <DialogContent>
          {/* Conteúdo completo do dialog de detalhes aqui */}
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

      {/* ATUALIZADO: Dialog de Solicitação com Escolha entre Troca e Devolução */}
      <Dialog
        open={exchangeDialogOpen}
        onClose={() => setExchangeDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Solicitar Troca ou Devolução - Pedido #{selectedOrder?.id}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Stepper activeStep={exchangeStep} sx={{ mb: 4 }}>
              <Step>
                <StepLabel>Tipo e Itens</StepLabel>
              </Step>
              <Step>
                <StepLabel>Informar Motivos</StepLabel>
              </Step>
              <Step>
                <StepLabel>Revisar e Enviar</StepLabel>
              </Step>
            </Stepper>

            {/* PASSO 0: NOVO - Escolha entre Troca e Devolução + Seleção de Itens */}
            {exchangeStep === 0 && (
              <Box>
                {/* Escolha do tipo de solicitação */}
                <Alert severity="info" sx={{ mb: 3 }}>
                  Escolha se deseja trocar o produto por outro (recebe cupom) ou
                  devolver e receber reembolso (recebe o dinheiro de volta).
                </Alert>

                <FormControl component="fieldset" sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    O que você deseja fazer?
                  </Typography>
                  <RadioGroup
                    value={requestType}
                    onChange={(e) =>
                      setRequestType(e.target.value as "exchange" | "refund")
                    }
                  >
                    <FormControlLabel
                      value="exchange"
                      control={<Radio />}
                      label={
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <SwapHoriz color="info" />
                          <Box>
                            <Typography variant="body1" fontWeight="bold">
                              Trocar Produto
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Você receberá um cupom para usar em novas compras
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                    <FormControlLabel
                      value="refund"
                      control={<Radio />}
                      label={
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <MoneyOff color="warning" />
                          <Box>
                            <Typography variant="body1" fontWeight="bold">
                              Devolver e Receber Reembolso
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Você receberá o dinheiro de volta no método de
                              pagamento original
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                  </RadioGroup>
                </FormControl>

                <Alert severity="info" sx={{ mb: 3 }}>
                  Selecione os itens que deseja{" "}
                  {requestType === "exchange" ? "trocar" : "devolver"}e a
                  quantidade de cada um.
                </Alert>

                <List>
                  {exchangeItems.map((item, index) => (
                    <ListItem
                      key={index}
                      sx={{
                        border: 1,
                        borderColor: "divider",
                        borderRadius: 1,
                        mb: 2,
                      }}
                    >
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={item.selected}
                            onChange={() => handleToggleExchangeItem(index)}
                          />
                        }
                        label=""
                      />
                      <ListItemText
                        primary={
                          <Typography variant="subtitle1">
                            {item.productName}
                          </Typography>
                        }
                        secondary={`Preço unitário: R$ ${item.price.toFixed(
                          2
                        )}`}
                      />
                      {item.selected && (
                        <TextField
                          type="number"
                          label="Quantidade"
                          value={item.quantity}
                          onChange={(e) =>
                            handleUpdateExchangeQuantity(
                              index,
                              parseInt(e.target.value) || 1
                            )
                          }
                          inputProps={{
                            min: 1,
                            max: item.maxQuantity,
                          }}
                          sx={{ width: 100 }}
                          size="small"
                        />
                      )}
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ ml: 2 }}
                      >
                        Máx: {item.maxQuantity}
                      </Typography>
                    </ListItem>
                  ))}
                </List>

                <Alert severity="warning">
                  <Typography variant="body2">
                    <strong>Atenção:</strong> O prazo para trocas e devoluções é
                    de 30 dias após a entrega. Produtos devem estar em bom
                    estado.
                  </Typography>
                </Alert>
              </Box>
            )}

            {/* Passo 1: Informar Motivos e Condição (igual ao anterior) */}
            {exchangeStep === 1 && (
              <Box>
                <Alert severity="info" sx={{ mb: 3 }}>
                  Para cada item, informe o motivo da{" "}
                  {requestType === "exchange" ? "troca" : "devolução"}e a
                  condição atual do produto.
                </Alert>

                {exchangeItems
                  .filter((item) => item.selected)
                  .map((item, index) => {
                    const originalIndex = exchangeItems.findIndex(
                      (i) => i.productId === item.productId
                    );
                    return (
                      <Card key={index} sx={{ mb: 3, p: 2 }}>
                        <Typography variant="subtitle1" gutterBottom>
                          {item.productName} × {item.quantity}
                        </Typography>

                        <Grid container spacing={2} sx={{ mt: 1 }}>
                          <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                              <InputLabel>Motivo</InputLabel>
                              <Select
                                value={item.reason}
                                label="Motivo"
                                onChange={(e) =>
                                  handleUpdateExchangeReason(
                                    originalIndex,
                                    e.target.value
                                  )
                                }
                              >
                                {exchangeReasons.map((reason) => (
                                  <MenuItem key={reason} value={reason}>
                                    {reason}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Grid>

                          <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                              <InputLabel>Condição do Produto</InputLabel>
                              <Select
                                value={item.condition}
                                label="Condição do Produto"
                                onChange={(e) =>
                                  handleUpdateExchangeCondition(
                                    originalIndex,
                                    e.target.value
                                  )
                                }
                              >
                                {productConditions.map((condition) => (
                                  <MenuItem key={condition} value={condition}>
                                    {condition}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Grid>
                        </Grid>
                      </Card>
                    );
                  })}
              </Box>
            )}

            {/* PASSO 2: ATUALIZADO - Revisão mostrando se é troca ou devolução */}
            {exchangeStep === 2 && (
              <Box>
                <Alert
                  severity={requestType === "exchange" ? "success" : "warning"}
                  sx={{ mb: 3 }}
                >
                  Revise as informações da sua solicitação de{" "}
                  {requestType === "exchange" ? "troca" : "devolução"}.
                </Alert>

                <Typography variant="h6" gutterBottom>
                  Itens para{" "}
                  {requestType === "exchange" ? "Troca" : "Devolução"}
                </Typography>

                <TableContainer component={Paper} sx={{ mb: 3 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Produto</TableCell>
                        <TableCell>Qtd</TableCell>
                        <TableCell>Motivo</TableCell>
                        <TableCell>Condição</TableCell>
                        <TableCell align="right">Valor</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {exchangeItems
                        .filter((item) => item.selected)
                        .map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.productName}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>{item.reason}</TableCell>
                            <TableCell>{item.condition}</TableCell>
                            <TableCell align="right">
                              R$ {(item.price * item.quantity).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      <TableRow>
                        <TableCell colSpan={4}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {requestType === "exchange"
                              ? "Valor Total do Cupom"
                              : "Valor Total do Reembolso"}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="h6" color="primary">
                            R$ {calculateExchangeValue().toFixed(2)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>

                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Observações (opcional)"
                  placeholder="Adicione informações adicionais..."
                  value={exchangeNotes}
                  onChange={(e) => setExchangeNotes(e.target.value)}
                  sx={{ mb: 2 }}
                />

                <Alert severity="info">
                  <Typography variant="body2">
                    {requestType === "exchange"
                      ? `Após a aprovação e recebimento dos produtos, você receberá
                        um cupom no valor de R$ ${calculateExchangeValue().toFixed(
                          2
                        )}
                        para usar em futuras compras. O cupom terá validade de 90 dias.`
                      : `Após a aprovação e recebimento dos produtos, você receberá
                        reembolso de R$ ${calculateExchangeValue().toFixed(2)}
                        no método de pagamento original em até 7 dias úteis.`}
                  </Typography>
                </Alert>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExchangeDialogOpen(false)}>Cancelar</Button>

          {exchangeStep > 0 && (
            <Button onClick={() => setExchangeStep(exchangeStep - 1)}>
              Voltar
            </Button>
          )}

          {exchangeStep < 2 ? (
            <Button
              variant="contained"
              onClick={() => setExchangeStep(exchangeStep + 1)}
              disabled={!canProceedToNextStep()}
            >
              Próximo
            </Button>
          ) : (
            <Button
              variant="contained"
              color="success"
              onClick={handleSubmitExchange}
              disabled={!canProceedToNextStep()}
            >
              Enviar Solicitação
            </Button>
          )}
        </DialogActions>
      </Dialog>

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

export default MeusPedidos;
