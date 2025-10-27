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
  Stepper,
  Step,
  StepLabel,
  TextField,
} from "@mui/material";
import {
  Visibility,
  Check,
  Close,
  CheckCircle,
  Cancel,
} from "@mui/icons-material";
import * as Store from "../../store/index";
import { Customer, Coupon } from "../../types";
import { CouponService } from "../../services/couponService";
import { StockService } from "../../services/stockService";

interface ExchangeRequest {
  id: string;
  orderId: string;
  customerId: string;
  items: ExchangeItem[];
  reason: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  exchangeCouponCode?: string;
  exchangeCouponValue?: number;
  notes?: string;
}

interface ExchangeItem {
  productId: string;
  productName: string;
  imageUrl?: string;
  quantity: number;
  price: number;
  reason: string;
  condition: string;
}

const AdminTrocas: React.FC = () => {
  const [exchanges, setExchanges] = useState<ExchangeRequest[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredExchanges, setFilteredExchanges] = useState<ExchangeRequest[]>(
    []
  );
  const [selectedExchange, setSelectedExchange] =
    useState<ExchangeRequest | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [exchanges, statusFilter]);

  const loadData = () => {
    // Carregar trocas do localStorage
    const stored = localStorage.getItem("exchange_requests");
    const loadedExchanges: ExchangeRequest[] = stored ? JSON.parse(stored) : [];
    setExchanges(loadedExchanges);

    // Carregar clientes
    const loadedCustomers = Store.getCustomers();
    setCustomers(loadedCustomers);
  };

  const applyFilters = () => {
    let filtered = exchanges;

    if (statusFilter) {
      filtered = filtered.filter((ex) => ex.status === statusFilter);
    }

    // Ordenar por data (mais recente primeiro)
    filtered.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    setFilteredExchanges(filtered);
  };

  const getCustomerName = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    return customer ? customer.name : "Cliente Desconhecido";
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, any> = {
      "Aguardando Aprovação": "warning",
      Aprovada: "info",
      "Produto Recebido": "primary",
      "Troca Enviada": "secondary",
      Concluída: "success",
      Recusada: "error",
    };
    return colors[status] || "default";
  };

  const getStatusStep = (status: string) => {
    const steps = [
      "Aguardando Aprovação",
      "Aprovada",
      "Produto Recebido",
      "Troca Enviada",
      "Concluída",
    ];
    return steps.indexOf(status);
  };

  const showSnackbar = (message: string, severity: "success" | "error") => {
    setSnackbar({ open: true, message, severity });
  };

  const generateExchangeCoupon = (exchange: ExchangeRequest): string => {
    const couponCode = `TROCA${Date.now().toString().slice(-6)}`;

    const coupon: Coupon = {
      id: `exchange_${exchange.id}`,
      code: couponCode,
      discount: exchange.exchangeCouponValue || 0,
      type: "fixed",
      category: "exchange",
      customerId: exchange.customerId,
      isActive: true,
      minOrderValue: 0,
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 dias
    };

    CouponService.addCoupon(coupon);
    console.log("✅ Cupom de troca gerado:", couponCode);

    return couponCode;
  };

  const returnStockToInventory = (exchange: ExchangeRequest) => {
    // Devolver produtos ao estoque
    const itemsToReturn = exchange.items.map((item) => ({
      id: item.productId,
      cardId: item.productId,
      card: {
        id: item.productId,
        name: item.productName,
        price: item.price,
        stock: 0, // Não usado na devolução
      } as any,
      quantity: item.quantity,
      addedAt: new Date().toISOString(),
    }));

    StockService.increaseStock(itemsToReturn);
    console.log("✅ Estoque devolvido:", exchange.items.length, "itens");
  };

  const handleApproveExchange = (exchangeId: string) => {
    const stored = localStorage.getItem("exchange_requests");
    const allExchanges: ExchangeRequest[] = stored ? JSON.parse(stored) : [];
    const exchangeIndex = allExchanges.findIndex((ex) => ex.id === exchangeId);

    if (exchangeIndex === -1) {
      showSnackbar("Troca não encontrada", "error");
      return;
    }

    // Atualizar status
    allExchanges[exchangeIndex].status = "Aprovada";
    allExchanges[exchangeIndex].updatedAt = new Date().toISOString();

    // Salvar
    localStorage.setItem("exchange_requests", JSON.stringify(allExchanges));

    loadData();
    showSnackbar("Troca aprovada com sucesso!", "success");

    // Atualizar exchange selecionada
    if (selectedExchange?.id === exchangeId) {
      setSelectedExchange(allExchanges[exchangeIndex]);
    }
  };

  const handleRejectExchange = (exchangeId: string) => {
    const stored = localStorage.getItem("exchange_requests");
    const allExchanges: ExchangeRequest[] = stored ? JSON.parse(stored) : [];
    const exchangeIndex = allExchanges.findIndex((ex) => ex.id === exchangeId);

    if (exchangeIndex === -1) {
      showSnackbar("Troca não encontrada", "error");
      return;
    }

    // Atualizar status
    allExchanges[exchangeIndex].status = "Recusada";
    allExchanges[exchangeIndex].updatedAt = new Date().toISOString();

    // Salvar
    localStorage.setItem("exchange_requests", JSON.stringify(allExchanges));

    loadData();
    showSnackbar("Troca recusada", "success");
    setDetailsOpen(false);
  };

  const handleConfirmReceipt = (exchangeId: string) => {
    const stored = localStorage.getItem("exchange_requests");
    const allExchanges: ExchangeRequest[] = stored ? JSON.parse(stored) : [];
    const exchangeIndex = allExchanges.findIndex((ex) => ex.id === exchangeId);

    if (exchangeIndex === -1) {
      showSnackbar("Troca não encontrada", "error");
      return;
    }

    const exchange = allExchanges[exchangeIndex];

    // 1. Devolver produtos ao estoque
    returnStockToInventory(exchange);

    // 2. Gerar cupom de troca
    const couponCode = generateExchangeCoupon(exchange);

    // 3. Atualizar status e salvar cupom gerado
    allExchanges[exchangeIndex].status = "Produto Recebido";
    allExchanges[exchangeIndex].exchangeCouponCode = couponCode;
    allExchanges[exchangeIndex].updatedAt = new Date().toISOString();

    // Salvar
    localStorage.setItem("exchange_requests", JSON.stringify(allExchanges));

    loadData();
    showSnackbar(
      `Produto recebido! Cupom ${couponCode} gerado para o cliente.`,
      "success"
    );

    // Atualizar exchange selecionada
    if (selectedExchange?.id === exchangeId) {
      setSelectedExchange(allExchanges[exchangeIndex]);
    }
  };

  const handleCompleteExchange = (exchangeId: string) => {
    const stored = localStorage.getItem("exchange_requests");
    const allExchanges: ExchangeRequest[] = stored ? JSON.parse(stored) : [];
    const exchangeIndex = allExchanges.findIndex((ex) => ex.id === exchangeId);

    if (exchangeIndex === -1) {
      showSnackbar("Troca não encontrada", "error");
      return;
    }

    // Atualizar status
    allExchanges[exchangeIndex].status = "Concluída";
    allExchanges[exchangeIndex].updatedAt = new Date().toISOString();

    // Salvar
    localStorage.setItem("exchange_requests", JSON.stringify(allExchanges));

    loadData();
    showSnackbar("Troca concluída!", "success");

    // Atualizar exchange selecionada
    if (selectedExchange?.id === exchangeId) {
      setSelectedExchange(allExchanges[exchangeIndex]);
    }
  };

  const handleViewDetails = (exchange: ExchangeRequest) => {
    setSelectedExchange(exchange);
    setDetailsOpen(true);
  };

  const calculateStats = () => {
    return {
      total: exchanges.length,
      pending: exchanges.filter((e) => e.status === "Aguardando Aprovação")
        .length,
      approved: exchanges.filter((e) => e.status === "Aprovada").length,
      received: exchanges.filter((e) => e.status === "Produto Recebido").length,
      completed: exchanges.filter((e) => e.status === "Concluída").length,
    };
  };

  const stats = calculateStats();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Gerenciamento de Trocas e Devoluções
      </Typography>

      {/* Estatísticas */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" variant="body2">
                Total
              </Typography>
              <Typography variant="h4">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: "warning.light" }}>
            <CardContent>
              <Typography color="textSecondary" variant="body2">
                Aguardando Aprovação
              </Typography>
              <Typography variant="h4">{stats.pending}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: "info.light" }}>
            <CardContent>
              <Typography color="textSecondary" variant="body2">
                Aprovadas
              </Typography>
              <Typography variant="h4">{stats.approved}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: "primary.light" }}>
            <CardContent>
              <Typography color="textSecondary" variant="body2">
                Produto Recebido
              </Typography>
              <Typography variant="h4">{stats.received}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: "success.light" }}>
            <CardContent>
              <Typography color="textSecondary" variant="body2">
                Concluídas
              </Typography>
              <Typography variant="h4">{stats.completed}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Alertas */}
      {stats.pending > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Você tem {stats.pending} solicitação(ões) de troca aguardando
          aprovação!
        </Alert>
      )}

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="Aguardando Aprovação">
                  Aguardando Aprovação
                </MenuItem>
                <MenuItem value="Aprovada">Aprovada</MenuItem>
                <MenuItem value="Produto Recebido">Produto Recebido</MenuItem>
                <MenuItem value="Troca Enviada">Troca Enviada</MenuItem>
                <MenuItem value="Concluída">Concluída</MenuItem>
                <MenuItem value="Recusada">Recusada</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => setStatusFilter("")}
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
              <TableCell>Pedido</TableCell>
              <TableCell>Itens</TableCell>
              <TableCell>Valor</TableCell>
              <TableCell>Data</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredExchanges.map((exchange) => (
              <TableRow key={exchange.id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    #{exchange.id.slice(-8).toUpperCase()}
                  </Typography>
                </TableCell>
                <TableCell>{getCustomerName(exchange.customerId)}</TableCell>
                <TableCell>
                  #{exchange.orderId.slice(-8).toUpperCase()}
                </TableCell>
                <TableCell>{exchange.items.length} item(s)</TableCell>
                <TableCell>
                  R$ {exchange.exchangeCouponValue?.toFixed(2) || "0.00"}
                </TableCell>
                <TableCell>
                  {new Date(exchange.createdAt).toLocaleDateString("pt-BR")}
                </TableCell>
                <TableCell>
                  <Chip
                    label={exchange.status}
                    size="small"
                    color={getStatusColor(exchange.status)}
                  />
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    size="small"
                    onClick={() => handleViewDetails(exchange)}
                  >
                    <Visibility />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {filteredExchanges.length === 0 && (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography color="text.secondary">
            Nenhuma troca encontrada
          </Typography>
        </Box>
      )}

      {/* Dialog de Detalhes */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Troca #{selectedExchange?.id.slice(-8).toUpperCase()}
        </DialogTitle>
        <DialogContent>
          {selectedExchange && (
            <Box sx={{ mt: 2 }}>
              {/* Stepper */}
              {selectedExchange.status !== "Recusada" && (
                <Stepper
                  activeStep={getStatusStep(selectedExchange.status)}
                  sx={{ mb: 4 }}
                >
                  <Step>
                    <StepLabel>Aguardando Aprovação</StepLabel>
                  </Step>
                  <Step>
                    <StepLabel>Aprovada</StepLabel>
                  </Step>
                  <Step>
                    <StepLabel>Produto Recebido</StepLabel>
                  </Step>
                  <Step>
                    <StepLabel>Troca Enviada</StepLabel>
                  </Step>
                  <Step>
                    <StepLabel>Concluída</StepLabel>
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
                    {getCustomerName(selectedExchange.customerId)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Pedido Original
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    #{selectedExchange.orderId.slice(-8).toUpperCase()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Valor do Cupom
                  </Typography>
                  <Typography variant="h6" color="primary">
                    R$ {selectedExchange.exchangeCouponValue?.toFixed(2)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={selectedExchange.status}
                    color={getStatusColor(selectedExchange.status)}
                  />
                </Grid>
              </Grid>

              {/* Cupom gerado */}
              {selectedExchange.exchangeCouponCode && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  <Typography variant="body2" fontWeight="bold">
                    Cupom gerado: {selectedExchange.exchangeCouponCode}
                  </Typography>
                  <Typography variant="caption">
                    O cliente pode usar este cupom em futuras compras
                  </Typography>
                </Alert>
              )}

              {/* Itens */}
              <Typography variant="h6" gutterBottom>
                Produtos para Troca
              </Typography>
              <TableContainer component={Paper} variant="outlined">
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
                    {selectedExchange.items.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{item.reason}</TableCell>
                        <TableCell>{item.condition}</TableCell>
                        <TableCell align="right">
                          R$ {(item.price * item.quantity).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Observações */}
              {selectedExchange.notes && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2">Observações:</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedExchange.notes}
                  </Typography>
                </Box>
              )}

              {/* Ações Administrativas */}
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Ações Administrativas
                </Typography>

                {selectedExchange.status === "Aguardando Aprovação" && (
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<Check />}
                      onClick={() => handleApproveExchange(selectedExchange.id)}
                    >
                      Aprovar Troca
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<Close />}
                      onClick={() => handleRejectExchange(selectedExchange.id)}
                    >
                      Recusar Troca
                    </Button>
                  </Box>
                )}

                {selectedExchange.status === "Aprovada" && (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<CheckCircle />}
                    onClick={() => handleConfirmReceipt(selectedExchange.id)}
                  >
                    Confirmar Recebimento do Produto
                  </Button>
                )}

                {selectedExchange.status === "Produto Recebido" && (
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<CheckCircle />}
                    onClick={() => handleCompleteExchange(selectedExchange.id)}
                  >
                    Marcar como Concluída
                  </Button>
                )}

                {selectedExchange.status === "Concluída" && (
                  <Alert severity="success">Troca concluída com sucesso!</Alert>
                )}

                {selectedExchange.status === "Recusada" && (
                  <Alert severity="error">Esta troca foi recusada.</Alert>
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

export default AdminTrocas;
