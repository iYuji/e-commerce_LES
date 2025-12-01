import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  Collapse,
  List,
  ListItem,
  ListItemText,
  Divider,
  Tooltip,
} from "@mui/material";
import {
  Visibility,
  Edit,
  CheckCircle,
  Cancel,
  LocalShipping,
  Receipt,
  FilterList,
  ExpandMore,
  ExpandLess,
  Refresh,
} from "@mui/icons-material";
import * as Store from "../../store/index";
import { Order, OrderStatus, Customer } from "../../types";

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

const AdminVendas: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // NOVO: Estado para armazenar os clientes
  // Isso é essencial para podermos buscar o nome do cliente pelo ID
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Estados para os filtros de busca
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("");
  const [searchTerm, setSearchTerm] = useState("");

  // Estados para controle dos diálogos
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editStatusOpen, setEditStatusOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<OrderStatus>("pending");

  // Estado para controlar expansão de linhas na tabela
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Estado para mensagens de feedback ao usuário
  const [alert, setAlert] = useState<{
    show: boolean;
    message: string;
    severity: "success" | "error" | "info";
  }>({ show: false, message: "", severity: "info" });

  // ============================================================================
  // EFEITO DE CARREGAMENTO INICIAL
  // Este useEffect executa quando o componente é montado pela primeira vez
  // ============================================================================

  useEffect(() => {
    loadOrders();

    // Listener para atualizar automaticamente quando houver novos pedidos
    // Este evento é disparado quando um novo pedido é criado no checkout
    const handleOrdersUpdate = () => {
      console.log("📦 Pedidos atualizados, recarregando lista...");
      loadOrders();
    };

    window.addEventListener("orders:updated", handleOrdersUpdate);

    // Cleanup: remove o listener quando o componente é desmontado
    // Isso previne memory leaks e múltiplos listeners acumulados
    return () => {
      window.removeEventListener("orders:updated", handleOrdersUpdate);
    };
  }, []);

  // ============================================================================
  // EFEITO DE APLICAÇÃO DE FILTROS
  // Sempre que os pedidos ou filtros mudarem, reaplica a filtragem
  // ============================================================================

  useEffect(() => {
    applyFilters();
  }, [orders, statusFilter, searchTerm]);

  // ============================================================================
  // FUNÇÃO DE CARREGAMENTO PRINCIPAL
  // Esta função busca os pedidos do Store e os ordena com os mais novos primeiro
  // AGORA TAMBÉM CARREGA OS CLIENTES para podermos exibir os nomes
  // ============================================================================

  const loadOrders = async () => {
    setLoading(true);

    try {
      // Simula um pequeno delay para dar feedback visual ao usuário
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Busca todos os pedidos do Store (localStorage)
      const allOrders = Store.getOrders();

      // IMPORTANTE: Carrega também todos os clientes do sistema
      // Precisamos deles para poder converter customerId em nome do cliente
      const allCustomers = Store.getCustomers();
      setCustomers(allCustomers);

      console.log(
        `📋 ${allCustomers.length} clientes carregados para referência`
      );

      // Cria uma cópia do array de pedidos para não modificar o original
      const ordersToSort = [...allOrders];

      // ORDENAÇÃO REVERSA: Pedidos mais novos aparecem primeiro!
      // Isso é muito importante para a usabilidade do admin
      // Os pedidos mais recentes geralmente precisam de atenção imediata
      ordersToSort.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();

        // Subtração invertida: dateB - dateA
        // Se B é mais recente (número maior em milissegundos), resultado é positivo
        // Isso coloca B antes de A na lista ordenada
        return dateB - dateA;
      });

      console.log(
        `✅ ${ordersToSort.length} pedidos carregados e ordenados (mais novos primeiro)`
      );

      setOrders(ordersToSort);
      setFilteredOrders(ordersToSort);
    } catch (error) {
      console.error("❌ Erro ao carregar pedidos:", error);
      showAlert("Erro ao carregar pedidos", "error");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // NOVA FUNÇÃO: Busca o nome do cliente pelo ID
  // Esta é a função chave que resolve o problema do nome do cliente!
  // ============================================================================

  /**
   * Busca e retorna o nome de um cliente baseado no seu ID
   *
   * Como funciona:
   * 1. Recebe o customerId (ex: "customer_1761578700457")
   * 2. Procura esse ID na lista de clientes carregada
   * 3. Se encontrar, retorna o nome completo do cliente
   * 4. Se não encontrar, retorna uma versão legível do ID
   *
   * Por que fazemos isso?
   * - Os pedidos guardam apenas o ID do cliente, não todos os dados
   * - Isso evita duplicação de informações
   * - Garante que sempre mostramos dados atualizados do cliente
   * - Se o cliente mudar o nome, a mudança aparece em todos os pedidos
   */
  const getCustomerName = (customerId: string): string => {
    // Procura o cliente na lista de clientes carregada
    const customer = customers.find((c) => c.id === customerId);

    if (customer) {
      // Se encontrou o cliente, retorna o nome completo dele
      return customer.name;
    }

    // Se não encontrou (caso raro, mas pode acontecer se o cliente foi deletado)
    // Retorna uma versão encurtada e legível do ID
    // Pega apenas os últimos 6 caracteres para ficar mais compacto
    return `Cliente #${customerId.slice(-6)}`;
  };

  // ============================================================================
  // FUNÇÃO DE APLICAÇÃO DE FILTROS
  // Filtra a lista de pedidos baseado nos critérios selecionados pelo usuário
  // ============================================================================

  const applyFilters = () => {
    // Começa com todos os pedidos já ordenados
    let filtered = [...orders];

    // Aplica filtro por status se algum foi selecionado
    if (statusFilter) {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    // Aplica filtro por termo de busca
    // Busca tanto no ID do pedido quanto no nome do cliente
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((order) => {
        // Busca no ID do pedido
        const matchesOrderId = order.id.toLowerCase().includes(searchLower);

        // NOVO: Busca também no nome do cliente
        // Isso permite que o admin procure por "João" e encontre todos os pedidos do João
        const customerName = getCustomerName(order.customerId).toLowerCase();
        const matchesCustomerName = customerName.includes(searchLower);

        // Retorna true se encontrou em qualquer um dos dois
        return matchesOrderId || matchesCustomerName;
      });
    }

    // A ordenação reversa (mais novos primeiro) é mantida automaticamente
    // porque já ordenamos no loadOrders e o filter não altera a ordem
    setFilteredOrders(filtered);
  };

  // ============================================================================
  // FUNÇÕES DE CONTROLE DE DIÁLOGOS
  // ============================================================================

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
  };

  const handleOpenEditStatus = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setEditStatusOpen(true);
  };

  const handleUpdateStatus = () => {
    if (!selectedOrder) return;

    const success = Store.updateOrderStatus(selectedOrder.id, newStatus);

    if (success) {
      showAlert(
        `Status do pedido ${selectedOrder.id} atualizado com sucesso!`,
        "success"
      );
      setEditStatusOpen(false);
      loadOrders();

      // Notifica outros componentes sobre a mudança
      window.dispatchEvent(new CustomEvent("orders:updated"));
    } else {
      showAlert("Erro ao atualizar status do pedido", "error");
    }
  };

  const handleCancelOrder = (orderId: string) => {
    if (
      window.confirm(
        "Tem certeza que deseja cancelar este pedido? O estoque será restaurado."
      )
    ) {
      const success = Store.cancelOrder(orderId);

      if (success) {
        showAlert(
          "Pedido cancelado com sucesso! Estoque restaurado.",
          "success"
        );
        loadOrders();
        window.dispatchEvent(new CustomEvent("orders:updated"));
      } else {
        showAlert(
          "Não foi possível cancelar este pedido. Verifique se ele já foi enviado ou entregue.",
          "error"
        );
      }
    }
  };

  const showAlert = (
    message: string,
    severity: "success" | "error" | "info"
  ) => {
    setAlert({ show: true, message, severity });
    setTimeout(() => {
      setAlert({ show: false, message: "", severity: "info" });
    }, 5000);
  };

  const handleToggleRow = (orderId: string) => {
    setExpandedRow(expandedRow === orderId ? null : orderId);
  };

  const clearFilters = () => {
    setStatusFilter("");
    setSearchTerm("");
  };

  // ============================================================================
  // FUNÇÕES AUXILIARES
  // ============================================================================

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

  const calculateTotalRevenue = () => {
    return filteredOrders
      .filter((order) => order.status !== "cancelled")
      .reduce((sum, order) => sum + order.total, 0);
  };

  const getOrdersByStatus = (status: OrderStatus) => {
    return orders.filter((order) => order.status === status).length;
  };

  // ============================================================================
  // RENDERIZAÇÃO - LOADING STATE
  // ============================================================================

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Gerenciamento de Vendas
        </Typography>
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <Typography>Carregando pedidos...</Typography>
        </Box>
      </Box>
    );
  }

  // ============================================================================
  // RENDERIZAÇÃO PRINCIPAL
  // ============================================================================

  return (
    <Box>
      {/* Header com título e botão de atualização */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1">
          Gerenciamento de Vendas
        </Typography>
        <Button variant="outlined" startIcon={<Refresh />} onClick={loadOrders}>
          Atualizar
        </Button>
      </Box>

      {/* Alert de feedback para o usuário */}
      {alert.show && (
        <Alert
          severity={alert.severity}
          sx={{ mb: 3 }}
          onClose={() => setAlert({ ...alert, show: false })}
        >
          {alert.message}
        </Alert>
      )}

      {/* Cards de resumo com estatísticas gerais */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total de Pedidos
              </Typography>
              <Typography variant="h4">{orders.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Receita Total
              </Typography>
              <Typography variant="h4" color="primary">
                R$ {calculateTotalRevenue().toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Pendentes
              </Typography>
              <Typography variant="h4" color="warning.main">
                {getOrdersByStatus("pending")}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Entregues
              </Typography>
              <Typography variant="h4" color="success.main">
                {getOrdersByStatus("delivered")}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Seção de filtros */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <FilterList />
          <Typography variant="h6">Filtros</Typography>
          <Button size="small" onClick={clearFilters}>
            Limpar Filtros
          </Button>
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Buscar por ID do Pedido ou Nome do Cliente"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              placeholder="Ex: João Silva ou ORD-123"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
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
        </Grid>
      </Card>

      {/* Tabela principal de pedidos */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Lista de Pedidos (Mais Recentes Primeiro)
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {filteredOrders.length} pedido(s) encontrado(s)
          </Typography>

          {filteredOrders.length === 0 ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              Nenhum pedido encontrado com os filtros selecionados.
            </Alert>
          ) : (
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell width="50px"></TableCell>
                    <TableCell>ID do Pedido</TableCell>
                    <TableCell>Data</TableCell>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Itens</TableCell>
                    <TableCell>Total</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <React.Fragment key={order.id}>
                      {/* Linha principal do pedido */}
                      <TableRow
                        hover
                        sx={{
                          backgroundColor:
                            expandedRow === order.id
                              ? "action.hover"
                              : "inherit",
                        }}
                      >
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleToggleRow(order.id)}
                          >
                            {expandedRow === order.id ? (
                              <ExpandLess />
                            ) : (
                              <ExpandMore />
                            )}
                          </IconButton>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            #{order.id.slice(-8).toUpperCase()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(order.createdAt).toLocaleDateString(
                              "pt-BR",
                              {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </Typography>
                        </TableCell>
                        {/* AQUI ESTÁ A MUDANÇA PRINCIPAL! */}
                        {/* Agora exibimos o nome real do cliente usando nossa função */}
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {getCustomerName(order.customerId)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {order.customerId.slice(-8)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                          {order.items?.length || 0} item(s)
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            fontWeight="bold"
                            color="primary"
                          >
                            R$ {order.total.toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getStatusIcon(order.status)}
                            label={statusLabels[order.status]}
                            color={statusColors[order.status]}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Box
                            sx={{
                              display: "flex",
                              gap: 0.5,
                              justifyContent: "center",
                            }}
                          >
                            <Tooltip title="Ver Detalhes">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleViewDetails(order)}
                              >
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Editar Status">
                              <IconButton
                                size="small"
                                color="info"
                                onClick={() => handleOpenEditStatus(order)}
                              >
                                <Edit />
                              </IconButton>
                            </Tooltip>
                            {(order.status === "pending" ||
                              order.status === "processing") && (
                              <Tooltip title="Cancelar Pedido">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleCancelOrder(order.id)}
                                >
                                  <Cancel />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>

                      {/* Linha expandida com detalhes dos itens do pedido */}
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          sx={{
                            p: 0,
                            borderBottom:
                              expandedRow === order.id ? undefined : 0,
                          }}
                        >
                          <Collapse
                            in={expandedRow === order.id}
                            timeout="auto"
                            unmountOnExit
                          >
                            <Box
                              sx={{
                                p: 2,
                                backgroundColor: "background.default",
                              }}
                            >
                              <Typography variant="subtitle2" gutterBottom>
                                Itens do Pedido:
                              </Typography>
                              <List dense>
                                {order.items.map((item, index) => (
                                  <ListItem key={index}>
                                    <ListItemText
                                      primary={
                                        <Box
                                          sx={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                          }}
                                        >
                                          <Typography variant="body2">
                                            {item.card?.name ||
                                              "Produto não encontrado"}{" "}
                                            × {item.quantity}
                                          </Typography>
                                          <Typography
                                            variant="body2"
                                            fontWeight="bold"
                                          >
                                            R${" "}
                                            {(
                                              (item.card?.price || 0) *
                                              item.quantity
                                            ).toFixed(2)}
                                          </Typography>
                                        </Box>
                                      }
                                      secondary={
                                        <Box
                                          sx={{
                                            display: "flex",
                                            gap: 1,
                                            mt: 0.5,
                                          }}
                                        >
                                          {item.card?.type && (
                                            <Chip
                                              label={item.card.type}
                                              size="small"
                                            />
                                          )}
                                          {item.card?.rarity && (
                                            <Chip
                                              label={item.card.rarity}
                                              size="small"
                                            />
                                          )}
                                        </Box>
                                      }
                                    />
                                  </ListItem>
                                ))}
                              </List>
                              <Divider sx={{ my: 1 }} />
                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  px: 2,
                                }}
                              >
                                <Typography variant="body2">
                                  <strong>Endereço:</strong>{" "}
                                  {order.shippingAddress?.address ||
                                    "Não informado"}
                                </Typography>
                                <Typography variant="body2">
                                  <strong>Frete:</strong> R${" "}
                                  {order.shippingCost?.toFixed(2) || "0.00"}
                                </Typography>
                              </Box>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Detalhes do Pedido */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Detalhes do Pedido #{selectedOrder?.id.slice(-8).toUpperCase()}
        </DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Data do Pedido
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {new Date(selectedOrder.createdAt).toLocaleString("pt-BR")}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    icon={getStatusIcon(selectedOrder.status)}
                    label={statusLabels[selectedOrder.status]}
                    color={statusColors[selectedOrder.status]}
                  />
                </Grid>
                {/* NOVO: Exibe o nome do cliente no dialog de detalhes */}
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Cliente
                  </Typography>
                  <Typography variant="body1" gutterBottom fontWeight="medium">
                    {getCustomerName(selectedOrder.customerId)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ID: {selectedOrder.customerId}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Endereço de Entrega
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedOrder.shippingAddress?.address || "Não informado"}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Itens do Pedido
                  </Typography>
                  <List>
                    {selectedOrder.items.map((item, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={`${item.card?.name || "Produto"} × ${
                            item.quantity
                          }`}
                          secondary={
                            <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
                              {item.card?.type && (
                                <Chip label={item.card.type} size="small" />
                              )}
                              {item.card?.rarity && (
                                <Chip label={item.card.rarity} size="small" />
                              )}
                              <Typography
                                variant="body2"
                                sx={{ ml: "auto", fontWeight: "bold" }}
                              >
                                R${" "}
                                {(
                                  (item.card?.price || 0) * item.quantity
                                ).toFixed(2)}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
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
                      R$ {selectedOrder.subtotal?.toFixed(2) || "0.00"}
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
                      R$ {selectedOrder.shippingCost?.toFixed(2) || "0.00"}
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
                    <Typography variant="h6">Total:</Typography>
                    <Typography variant="h6" color="primary">
                      R$ {selectedOrder.total.toFixed(2)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Edição de Status */}
      <Dialog
        open={editStatusOpen}
        onClose={() => setEditStatusOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Alterar Status do Pedido #{selectedOrder?.id.slice(-8).toUpperCase()}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Cliente:{" "}
              {selectedOrder && getCustomerName(selectedOrder.customerId)}
            </Typography>
            <TextField
              fullWidth
              select
              label="Novo Status"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
              sx={{ mt: 2 }}
            >
              {Object.entries(statusLabels).map(([status, label]) => (
                <MenuItem key={status} value={status}>
                  {label}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditStatusOpen(false)}>Cancelar</Button>
          <Button onClick={handleUpdateStatus} variant="contained">
            Atualizar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminVendas;
