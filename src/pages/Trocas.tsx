import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Chip,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Radio,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { SwapHoriz, ExpandMore, Info } from "@mui/icons-material";
import * as Store from "../store/index";
import { Order, Customer } from "../types";

interface ExchangeRequest {
  id: string;
  orderId: string;
  customerId: string;
  items: ExchangeItem[];
  reason: string;
  status:
    | "Aguardando Aprovação"
    | "Aprovada"
    | "Produto Recebido"
    | "Troca Enviada"
    | "Concluída"
    | "Recusada";
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

const EXCHANGE_REASONS = [
  "Produto com defeito",
  "Produto diferente do anunciado",
  "Produto danificado na entrega",
  "Arrependimento da compra",
  "Outro motivo",
];

const PRODUCT_CONDITIONS = [
  "Novo, nunca usado",
  "Usado 1-2 vezes",
  "Embalagem aberta",
  "Com defeito",
];

const Trocas: React.FC = () => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [exchanges, setExchanges] = useState<ExchangeRequest[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [openNewExchange, setOpenNewExchange] = useState(false);
  const [openExchangeDetails, setOpenExchangeDetails] = useState(false);
  const [selectedExchange, setSelectedExchange] =
    useState<ExchangeRequest | null>(null);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Formulário de nova troca
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [itemReasons, setItemReasons] = useState<{ [key: string]: string }>({});
  const [itemConditions, setItemConditions] = useState<{
    [key: string]: string;
  }>({});
  const [additionalNotes, setAdditionalNotes] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const session = Store.getSession();
    if (session?.user) {
      const currentCustomer = session.user as Customer;
      setCustomer(currentCustomer);

      // Carregar pedidos entregues (elegíveis para troca)
      const customerOrders = Store.getOrdersByCustomer(currentCustomer.id);
      const deliveredOrders = customerOrders.filter(
        (order) => order.status === "delivered" || order.status === "shipped"
      );
      setOrders(deliveredOrders);

      // Carregar solicitações de troca
      loadExchanges(currentCustomer.id);
    }
  };

  const loadExchanges = (customerId: string) => {
    const stored = localStorage.getItem("exchange_requests");
    if (stored) {
      const allExchanges: ExchangeRequest[] = JSON.parse(stored);
      const customerExchanges = allExchanges.filter(
        (ex) => ex.customerId === customerId
      );
      setExchanges(customerExchanges);
    }
  };

  const handleOpenNewExchange = (order: Order) => {
    setSelectedOrder(order);
    setSelectedItems([]);
    setItemReasons({});
    setItemConditions({});
    setAdditionalNotes("");
    setError("");
    setOpenNewExchange(true);
  };

  const handleToggleItem = (itemIndex: number) => {
    const itemId = `${selectedOrder?.id}_${itemIndex}`;
    if (selectedItems.includes(itemId)) {
      setSelectedItems((prev) => prev.filter((id) => id !== itemId));
      const newReasons = { ...itemReasons };
      const newConditions = { ...itemConditions };
      delete newReasons[itemId];
      delete newConditions[itemId];
      setItemReasons(newReasons);
      setItemConditions(newConditions);
    } else {
      setSelectedItems((prev) => [...prev, itemId]);
    }
  };

  const handleSubmitExchange = () => {
    try {
      setError("");

      // Validações
      if (selectedItems.length === 0) {
        setError("Selecione pelo menos um produto para trocar");
        return;
      }

      // Verificar se todos os itens selecionados têm motivo e condição
      for (const itemId of selectedItems) {
        if (!itemReasons[itemId]) {
          setError(
            "Informe o motivo da troca para todos os itens selecionados"
          );
          return;
        }
        if (!itemConditions[itemId]) {
          setError(
            "Informe a condição do produto para todos os itens selecionados"
          );
          return;
        }
      }

      if (!selectedOrder) return;

      // Criar itens de troca
      const exchangeItems: ExchangeItem[] = selectedItems.map((itemId) => {
        const itemIndex = parseInt(itemId.split("_")[1]);
        const orderItem = selectedOrder.items[itemIndex];
        return {
          productId: orderItem.card.id,
          productName: orderItem.card.name,
          imageUrl: orderItem.card.image || "",
          quantity: orderItem.quantity,
          price: orderItem.card.price,
          reason: itemReasons[itemId],
          condition: itemConditions[itemId],
        };
      });

      // Calcular valor do cupom (soma dos itens)
      const couponValue = exchangeItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      // Criar solicitação de troca
      const newExchange: ExchangeRequest = {
        id: `EX${Date.now()}`,
        orderId: selectedOrder.id,
        customerId: customer?.id || "",
        items: exchangeItems,
        reason: itemReasons[selectedItems[0]], // Motivo principal
        status: "Aguardando Aprovação",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        exchangeCouponValue: couponValue,
        notes: additionalNotes,
      };

      // Salvar no localStorage
      const stored = localStorage.getItem("exchange_requests");
      const allExchanges: ExchangeRequest[] = stored ? JSON.parse(stored) : [];
      allExchanges.push(newExchange);
      localStorage.setItem("exchange_requests", JSON.stringify(allExchanges));

      // Atualizar lista
      loadExchanges(customer?.id || "");

      setSuccess(
        "Solicitação de troca criada com sucesso! Aguarde a aprovação."
      );
      setOpenNewExchange(false);
      setSelectedOrder(null);
    } catch (err) {
      setError("Erro ao criar solicitação de troca");
    }
  };

  const handleViewExchange = (exchange: ExchangeRequest) => {
    setSelectedExchange(exchange);
    setOpenExchangeDetails(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Aguardando Aprovação":
        return "warning";
      case "Aprovada":
      case "Produto Recebido":
      case "Troca Enviada":
        return "info";
      case "Concluída":
        return "success";
      case "Recusada":
        return "error";
      default:
        return "default";
    }
  };

  const getStatusSteps = (status: string) => {
    const steps = [
      "Aguardando Aprovação",
      "Aprovada",
      "Produto Recebido",
      "Troca Enviada",
      "Concluída",
    ];
    return steps.indexOf(status);
  };

  if (!customer) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          Você precisa estar logado para gerenciar trocas.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1">
          <SwapHoriz sx={{ mr: 1, verticalAlign: "middle" }} />
          Trocas e Devoluções
        </Typography>
      </Box>

      {/* Mensagens */}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* Informações sobre política de trocas */}
      <Paper
        sx={{ p: 3, mb: 3, bgcolor: "info.light", color: "info.contrastText" }}
      >
        <Typography variant="h6" gutterBottom>
          <Info sx={{ mr: 1, verticalAlign: "middle" }} />
          Política de Trocas
        </Typography>
        <Typography variant="body2" paragraph>
          • Você tem até 30 dias após o recebimento para solicitar troca
        </Typography>
        <Typography variant="body2" paragraph>
          • O produto deve estar em perfeitas condições
        </Typography>
        <Typography variant="body2" paragraph>
          • Após aprovação, você receberá um cupom de troca para usar em novas
          compras
        </Typography>
        <Typography variant="body2">
          • O valor do cupom corresponde ao valor pago pelos produtos trocados
        </Typography>
      </Paper>

      {/* Minhas Solicitações de Troca */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Minhas Solicitações de Troca
        </Typography>

        {exchanges.length === 0 ? (
          <Alert severity="info">
            Você ainda não tem solicitações de troca.
          </Alert>
        ) : (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {exchanges.map((exchange) => (
              <Grid item xs={12} key={exchange.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 2,
                      }}
                    >
                      <Box>
                        <Typography variant="h6">
                          Troca #{exchange.id}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Pedido #{exchange.orderId.slice(-8).toUpperCase()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Solicitado em{" "}
                          {new Date(exchange.createdAt).toLocaleDateString(
                            "pt-BR"
                          )}
                        </Typography>
                      </Box>
                      <Chip
                        label={exchange.status}
                        color={getStatusColor(exchange.status) as any}
                        sx={{ fontWeight: "bold" }}
                      />
                    </Box>

                    <Typography variant="body2" gutterBottom>
                      <strong>Itens:</strong> {exchange.items.length} produto(s)
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Valor do cupom:</strong> R${" "}
                      {exchange.exchangeCouponValue?.toFixed(2)}
                    </Typography>
                    {exchange.exchangeCouponCode && (
                      <Typography variant="body2" gutterBottom>
                        <strong>Cupom gerado:</strong>{" "}
                        <Chip
                          label={exchange.exchangeCouponCode}
                          size="small"
                          color="success"
                        />
                      </Typography>
                    )}

                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleViewExchange(exchange)}
                      sx={{ mt: 1 }}
                    >
                      Ver Detalhes
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      {/* Pedidos Elegíveis para Troca */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Pedidos Elegíveis para Troca
        </Typography>

        {orders.length === 0 ? (
          <Alert severity="info">
            Nenhum pedido elegível para troca no momento.
          </Alert>
        ) : (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {orders.map((order) => (
              <Grid item xs={12} md={6} key={order.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Pedido #{order.id.slice(-8).toUpperCase()}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Realizado em{" "}
                      {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                    </Typography>
                    <Chip
                      label={order.status}
                      size="small"
                      color={
                        order.status === "delivered" ? "success" : "primary"
                      }
                      sx={{ mb: 2 }}
                    />
                    <Typography variant="body2" gutterBottom>
                      {order.items.length}{" "}
                      {order.items.length === 1 ? "item" : "itens"}
                    </Typography>
                    <Typography variant="body1" fontWeight="bold" gutterBottom>
                      Total: R$ {order.total.toFixed(2)}
                    </Typography>
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={<SwapHoriz />}
                      onClick={() => handleOpenNewExchange(order)}
                      disabled={order.status !== "delivered"}
                    >
                      Solicitar Troca
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      {/* Dialog: Nova Solicitação de Troca */}
      <Dialog
        open={openNewExchange}
        onClose={() => setOpenNewExchange(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <SwapHoriz sx={{ mr: 1 }} />
            Nova Solicitação de Troca
          </Box>
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
              {error}
            </Alert>
          )}

          <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
            Pedido #{selectedOrder?.id.slice(-8).toUpperCase()}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            gutterBottom
            sx={{ mb: 3 }}
          >
            Selecione os produtos que deseja trocar e informe o motivo:
          </Typography>

          {selectedOrder?.items.map((item, index) => {
            const itemId = `${selectedOrder.id}_${index}`;
            const isSelected = selectedItems.includes(itemId);

            return (
              <Accordion
                key={index}
                expanded={isSelected}
                onChange={() => handleToggleItem(index)}
                sx={{ mb: 2 }}
              >
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      width: "100%",
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Radio
                          checked={isSelected}
                          onClick={(e) => e.stopPropagation()}
                        />
                      }
                      label=""
                      sx={{ m: 0 }}
                    />
                    {item.card.image && (
                      <Box
                        component="img"
                        src={item.card.image}
                        alt={item.card.name}
                        sx={{
                          width: 50,
                          height: 50,
                          objectFit: "cover",
                          borderRadius: 1,
                        }}
                      />
                    )}
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2">
                        {item.card.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Quantidade: {item.quantity} • R${" "}
                        {item.card.price.toFixed(2)}
                      </Typography>
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        select
                        label="Motivo da Troca"
                        value={itemReasons[itemId] || ""}
                        onChange={(e) =>
                          setItemReasons((prev) => ({
                            ...prev,
                            [itemId]: e.target.value,
                          }))
                        }
                        required
                      >
                        {EXCHANGE_REASONS.map((reason) => (
                          <MenuItem key={reason} value={reason}>
                            {reason}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        select
                        label="Condição do Produto"
                        value={itemConditions[itemId] || ""}
                        onChange={(e) =>
                          setItemConditions((prev) => ({
                            ...prev,
                            [itemId]: e.target.value,
                          }))
                        }
                        required
                      >
                        {PRODUCT_CONDITIONS.map((condition) => (
                          <MenuItem key={condition} value={condition}>
                            {condition}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            );
          })}

          <TextField
            fullWidth
            label="Observações Adicionais (opcional)"
            multiline
            rows={3}
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            sx={{ mt: 2 }}
            placeholder="Descreva mais detalhes sobre a troca, se necessário"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNewExchange(false)}>Cancelar</Button>
          <Button
            onClick={handleSubmitExchange}
            variant="contained"
            disabled={selectedItems.length === 0}
          >
            Solicitar Troca
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Detalhes da Troca */}
      <Dialog
        open={openExchangeDetails}
        onClose={() => setOpenExchangeDetails(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Detalhes da Troca #{selectedExchange?.id}</DialogTitle>
        <DialogContent>
          {selectedExchange && (
            <Box>
              {/* Status */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Status Atual
                </Typography>
                <Chip
                  label={selectedExchange.status}
                  color={getStatusColor(selectedExchange.status) as any}
                  sx={{ fontWeight: "bold" }}
                />
              </Box>

              {/* Stepper */}
              {selectedExchange.status !== "Recusada" && (
                <Box sx={{ mb: 3 }}>
                  <Stepper
                    activeStep={getStatusSteps(selectedExchange.status)}
                    alternativeLabel
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
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              {/* Informações */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Pedido Original
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    #{selectedExchange.orderId.slice(-8).toUpperCase()}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Data da Solicitação
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {new Date(selectedExchange.createdAt).toLocaleDateString(
                      "pt-BR"
                    )}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Valor do Cupom
                  </Typography>
                  <Typography
                    variant="body1"
                    fontWeight="bold"
                    color="success.main"
                  >
                    R$ {selectedExchange.exchangeCouponValue?.toFixed(2)}
                  </Typography>
                </Grid>
                {selectedExchange.exchangeCouponCode && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Código do Cupom
                    </Typography>
                    <Chip
                      label={selectedExchange.exchangeCouponCode}
                      color="success"
                      sx={{ fontWeight: "bold" }}
                    />
                  </Grid>
                )}
              </Grid>

              <Divider sx={{ my: 2 }} />

              {/* Produtos */}
              <Typography variant="subtitle2" gutterBottom>
                Produtos para Troca
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Produto</TableCell>
                      <TableCell>Motivo</TableCell>
                      <TableCell>Condição</TableCell>
                      <TableCell align="right">Valor</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedExchange.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            {item.imageUrl && (
                              <Box
                                component="img"
                                src={item.imageUrl}
                                alt={item.productName}
                                sx={{
                                  width: 40,
                                  height: 40,
                                  objectFit: "cover",
                                  borderRadius: 1,
                                }}
                              />
                            )}
                            <Box>
                              <Typography variant="body2">
                                {item.productName}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Qtd: {item.quantity}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{item.reason}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {item.condition}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="bold">
                            R$ {(item.price * item.quantity).toFixed(2)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Observações */}
              {selectedExchange.notes && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" gutterBottom>
                    Observações
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedExchange.notes}
                  </Typography>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenExchangeDetails(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Trocas;
