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
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Pagination,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from "@mui/material";
import {
  Visibility,
  GetApp,
  TrendingUp,
  TrendingDown,
  Timeline,
  CheckCircle,
  LocalShipping,
  Payment,
  Cancel,
} from "@mui/icons-material";
import * as Store from "../../store/index";
import { Order, Card as CardType, Customer } from "../../types";

const ITEMS_PER_PAGE = 10;

const AdminVendas: React.FC = () => {
  // ============================================
  // ESTADOS DO COMPONENTE
  // ============================================

  // Estados para armazenar os dados carregados do sistema
  const [orders, setOrders] = useState<Order[]>([]);
  const [cards, setCards] = useState<CardType[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Estados para controle de filtros e paginação
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [periodFilter, setPeriodFilter] = useState("all");

  // Estados para controle do dialog de detalhes
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // ============================================
  // EFEITOS E CARREGAMENTO DE DADOS
  // ============================================

  /**
   * Este useEffect é executado apenas uma vez quando o componente é montado.
   * Ele carrega os dados iniciais e configura um listener para escutar
   * atualizações em tempo real quando pedidos são criados/modificados
   * em outras partes do sistema.
   */
  useEffect(() => {
    loadData();

    // Listener para recarregar quando houver novos pedidos
    // Isso garante que o painel se atualiza automaticamente quando:
    // - Um novo pedido é criado na área do cliente
    // - Um pedido é atualizado no AdminPedidos
    const handleOrdersUpdate = () => {
      console.log("🔄 AdminVendas: Pedidos atualizados, recarregando...");
      loadData();
    };

    // Registrar o listener no sistema de eventos do navegador
    window.addEventListener("orders:updated", handleOrdersUpdate);

    // Cleanup: remover listener quando componente desmontar
    // Isso previne memory leaks e erros quando o componente é destruído
    return () => {
      window.removeEventListener("orders:updated", handleOrdersUpdate);
    };
  }, []); // Array vazio = executa apenas uma vez na montagem

  /**
   * Este useEffect aplica os filtros sempre que os dados ou
   * configurações de filtro mudam. É como um "processador automático"
   * que reage a mudanças e atualiza a lista filtrada.
   */
  useEffect(() => {
    applyFilters();
  }, [orders, statusFilter, periodFilter]);

  /**
   * Função que carrega todos os dados necessários do localStorage.
   * Usamos logs detalhados para facilitar o debug e entender
   * o que está acontecendo no sistema.
   */
  const loadData = () => {
    const loadedOrders = Store.getOrders();
    const loadedCards = Store.getCards();
    const loadedCustomers = Store.getCustomers();

    console.log("📊 AdminVendas - Carregando dados:");
    console.log("  📦 Total de pedidos:", loadedOrders.length);
    console.log("  🎴 Total de cartas:", loadedCards.length);
    console.log("  👥 Total de clientes:", loadedCustomers.length);

    // Log dos últimos 3 pedidos para debug
    if (loadedOrders.length > 0) {
      console.log(
        "  🔍 Últimos 3 pedidos:",
        loadedOrders.slice(-3).map((o) => ({
          id: o.id,
          customerId: o.customerId,
          total: o.total,
          status: o.status,
        }))
      );
    }

    setOrders(loadedOrders);
    setCards(loadedCards);
    setCustomers(loadedCustomers);
  };

  /**
   * Aplica os filtros de status e período aos pedidos.
   * Esta função implementa uma lógica de filtragem em múltiplas etapas:
   * 1. Filtra por status (se selecionado)
   * 2. Filtra por período de tempo (se selecionado)
   * 3. Ordena por data (mais recentes primeiro)
   */
  const applyFilters = () => {
    let filtered = orders;

    // Filtro de status
    if (statusFilter) {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    // Filtro de período
    if (periodFilter !== "all") {
      const now = new Date();
      const filterDate = new Date();

      // Calcula a data de corte baseada no período selecionado
      switch (periodFilter) {
        case "today":
          filterDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          filterDate.setDate(now.getDate() - 7);
          break;
        case "month":
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case "quarter":
          filterDate.setMonth(now.getMonth() - 3);
          break;
        case "year":
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      // Filtra pedidos que são mais recentes que a data de corte
      filtered = filtered.filter(
        (order) => new Date(order.createdAt) >= filterDate
      );
    }

    setFilteredOrders(filtered);
    setPage(0); // Resetar para primeira página quando filtros mudam
  };

  // ============================================
  // FUNÇÕES AUXILIARES
  // ============================================

  /**
   * Busca o nome do cliente pelo ID.
   * Retorna "Cliente Desconhecido" se não encontrar (dados inconsistentes).
   */
  const getCustomerName = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    return customer ? customer.name : "Cliente Desconhecido";
  };

  /**
   * Retorna a cor do chip baseada no status do pedido.
   * Usamos cores semânticas do Material-UI para facilitar
   * a identificação visual rápida do status.
   */
  const getOrderStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "warning"; // Amarelo - precisa atenção
      case "confirmed":
        return "info"; // Azul - informativo
      case "processing":
        return "primary"; // Azul primário - em andamento
      case "shipped":
        return "secondary"; // Roxo - aguardando entrega
      case "delivered":
        return "success"; // Verde - sucesso
      case "cancelled":
        return "error"; // Vermelho - problema
      default:
        return "default"; // Cinza - desconhecido
    }
  };

  /**
   * Converte o status técnico (em inglês) para um label
   * amigável em português para exibir ao usuário.
   */
  const getOrderStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      pending: "Pendente",
      confirmed: "Confirmado",
      processing: "Processando",
      shipped: "Enviado",
      delivered: "Entregue",
      cancelled: "Cancelado",
    };
    return labels[status.toLowerCase()] || status;
  };

  /**
   * NOVA FUNÇÃO: Atualiza o status de um pedido.
   * Esta função é crucial para o gerenciamento de pedidos e liberação de trocas.
   * Ela faz várias coisas importantes:
   * 1. Busca o pedido no localStorage
   * 2. Atualiza seu status
   * 3. Salva de volta no localStorage
   * 4. Notifica outros componentes da mudança
   * 5. Atualiza a UI local
   */
  const handleUpdateOrderStatus = (orderId: string, newStatus: string) => {
    const allOrders = Store.getOrders();
    const orderIndex = allOrders.findIndex((o) => o.id === orderId);

    if (orderIndex === -1) {
      console.error("❌ Pedido não encontrado");
      return;
    }

    console.log(`📝 Atualizando status do pedido ${orderId}:`);
    console.log(`   De: ${allOrders[orderIndex].status}`);
    console.log(`   Para: ${newStatus}`);

    // Atualizar o status do pedido
    allOrders[orderIndex].status = newStatus as Order["status"];

    // Salvar no localStorage
    Store.writeStore(Store.STORE_KEYS.orders, allOrders);

    // Disparar evento para outros componentes saberem da mudança
    // Isso garante que AdminPedidos, AdminTrocas, etc. sejam atualizados
    console.log("📢 Disparando evento orders:updated...");
    window.dispatchEvent(new CustomEvent("orders:updated"));

    // Recarregar dados locais
    loadData();

    // Se o dialog de detalhes estiver aberto, atualizar o pedido selecionado
    if (selectedOrder?.id === orderId) {
      setSelectedOrder(allOrders[orderIndex]);
    }

    console.log("✅ Status atualizado com sucesso!");
  };

  /**
   * Abre o dialog de detalhes com o pedido selecionado.
   */
  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
  };

  /**
   * Calcula estatísticas agregadas dos pedidos filtrados.
   * Estas métricas ajudam a ter uma visão geral rápida do negócio.
   */
  const calculateStats = () => {
    const totalOrders = filteredOrders.length;
    const totalRevenue = filteredOrders.reduce(
      (sum, order) => sum + order.total,
      0
    );
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const completedOrders = filteredOrders.filter(
      (order) => order.status === "delivered"
    ).length;
    const completionRate =
      totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

    // Calcular crescimento comparado ao período anterior
    // Isso ajuda a entender se as vendas estão crescendo ou caindo
    const currentPeriodStart = new Date();
    if (periodFilter === "month") {
      currentPeriodStart.setMonth(currentPeriodStart.getMonth() - 1);
    } else if (periodFilter === "week") {
      currentPeriodStart.setDate(currentPeriodStart.getDate() - 7);
    } else {
      currentPeriodStart.setDate(currentPeriodStart.getDate() - 30);
    }

    const previousPeriodOrders = orders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      const prevStart = new Date(currentPeriodStart);
      const prevEnd = new Date(currentPeriodStart);

      if (periodFilter === "month") {
        prevStart.setMonth(prevStart.getMonth() - 1);
      } else if (periodFilter === "week") {
        prevStart.setDate(prevStart.getDate() - 7);
        prevEnd.setDate(prevEnd.getDate() - 7);
      } else {
        prevStart.setDate(prevStart.getDate() - 30);
        prevEnd.setDate(prevEnd.getDate() - 30);
      }

      return orderDate >= prevStart && orderDate <= prevEnd;
    });

    const previousRevenue = previousPeriodOrders.reduce(
      (sum, order) => sum + order.total,
      0
    );
    const revenueGrowth =
      previousRevenue > 0
        ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
        : 0;

    return {
      totalOrders,
      totalRevenue,
      averageOrderValue,
      completionRate,
      revenueGrowth,
    };
  };

  /**
   * Exporta os dados filtrados para um arquivo CSV.
   * Útil para análises externas ou relatórios.
   */
  const exportData = () => {
    const csvContent = [
      ["ID", "Data", "Cliente", "Status", "Total"].join(","),
      ...filteredOrders.map((order) =>
        [
          order.id,
          new Date(order.createdAt).toLocaleDateString(),
          getCustomerName(order.customerId),
          getOrderStatusLabel(order.status),
          order.total.toFixed(2),
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vendas_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  // ============================================
  // PREPARAÇÃO DE DADOS PARA RENDERIZAÇÃO
  // ============================================

  const stats = calculateStats();
  const paginatedOrders = filteredOrders.slice(
    page * ITEMS_PER_PAGE,
    (page + 1) * ITEMS_PER_PAGE
  );

  // ============================================
  // RENDERIZAÇÃO DO COMPONENTE
  // ============================================

  return (
    <Box>
      {/* Cabeçalho com título e botão de exportação */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1">
          Relatório de Vendas
        </Typography>
        <Button variant="outlined" startIcon={<GetApp />} onClick={exportData}>
          Exportar CSV
        </Button>
      </Box>

      {/* Cards de Estatísticas */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total de Pedidos
                  </Typography>
                  <Typography variant="h5">{stats.totalOrders}</Typography>
                </Box>
                <Timeline color="primary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Receita Total
                  </Typography>
                  <Typography variant="h5" color="primary">
                    R$ {stats.totalRevenue.toFixed(2)}
                  </Typography>
                  <Typography
                    variant="body2"
                    color={
                      stats.revenueGrowth >= 0 ? "success.main" : "error.main"
                    }
                  >
                    {stats.revenueGrowth >= 0 ? "+" : ""}
                    {stats.revenueGrowth.toFixed(1)}% vs período anterior
                  </Typography>
                </Box>
                {stats.revenueGrowth >= 0 ? (
                  <TrendingUp color="success" />
                ) : (
                  <TrendingDown color="error" />
                )}
              </Box>
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
                R$ {stats.averageOrderValue.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Taxa de Conversão
              </Typography>
              <Typography variant="h5">
                {stats.completionRate.toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Período</InputLabel>
              <Select
                value={periodFilter}
                label="Período"
                onChange={(e) => setPeriodFilter(e.target.value)}
              >
                <MenuItem value="all">Todos os tempos</MenuItem>
                <MenuItem value="today">Hoje</MenuItem>
                <MenuItem value="week">Última semana</MenuItem>
                <MenuItem value="month">Último mês</MenuItem>
                <MenuItem value="quarter">Últimos 3 meses</MenuItem>
                <MenuItem value="year">Último ano</MenuItem>
              </Select>
            </FormControl>
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
                <MenuItem value="pending">Pendente</MenuItem>
                <MenuItem value="confirmed">Confirmado</MenuItem>
                <MenuItem value="processing">Processando</MenuItem>
                <MenuItem value="shipped">Enviado</MenuItem>
                <MenuItem value="delivered">Entregue</MenuItem>
                <MenuItem value="cancelled">Cancelado</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                setStatusFilter("");
                setPeriodFilter("all");
              }}
            >
              Limpar Filtros
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabela de Pedidos */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID do Pedido</TableCell>
              <TableCell>Data</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Itens</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedOrders.map((order) => (
              <TableRow key={order.id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    #{order.id}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(order.createdAt).toLocaleTimeString()}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {getCustomerName(order.customerId)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {order.items.length}{" "}
                    {order.items.length === 1 ? "item" : "itens"}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={getOrderStatusLabel(order.status)}
                    size="small"
                    color={getOrderStatusColor(order.status) as any}
                  />
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontWeight="bold" color="primary">
                    R$ {order.total.toFixed(2)}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    size="small"
                    onClick={() => handleViewDetails(order)}
                    title="Ver Detalhes"
                  >
                    <Visibility />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Paginação */}
      <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
        <Pagination
          count={Math.ceil(filteredOrders.length / ITEMS_PER_PAGE)}
          page={page + 1}
          onChange={(_, newPage) => setPage(newPage - 1)}
          color="primary"
        />
      </Box>

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
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Informações do Pedido
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <Typography>
                          <strong>Data:</strong>{" "}
                          {new Date(selectedOrder.createdAt).toLocaleString()}
                        </Typography>
                        <Typography>
                          <strong>Cliente:</strong>{" "}
                          {getCustomerName(selectedOrder.customerId)}
                        </Typography>
                        <Typography sx={{ mt: 1 }}>
                          <strong>Status:</strong>
                        </Typography>
                        <Chip
                          label={getOrderStatusLabel(selectedOrder.status)}
                          color={
                            getOrderStatusColor(selectedOrder.status) as any
                          }
                          sx={{ mt: 0.5 }}
                        />
                        <Typography sx={{ mt: 2 }}>
                          <strong>Total:</strong> R${" "}
                          {selectedOrder.total.toFixed(2)}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Endereço de Entrega
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        {selectedOrder.shippingAddress ? (
                          <>
                            <Typography>
                              {selectedOrder.shippingAddress.address}
                            </Typography>
                            <Typography>
                              {selectedOrder.shippingAddress.city},{" "}
                              {selectedOrder.shippingAddress.state}
                            </Typography>
                            <Typography>
                              {selectedOrder.shippingAddress.zipCode}
                            </Typography>
                          </>
                        ) : (
                          <Typography color="text.secondary">
                            Endereço não disponível
                          </Typography>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Itens do Pedido
                </Typography>
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Item</TableCell>
                        <TableCell align="right">Quantidade</TableCell>
                        <TableCell align="right">Preço Unitário</TableCell>
                        <TableCell align="right">Subtotal</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedOrder.items.map((item, index) => {
                        /**
                         * PROTEÇÃO CONTRA DADOS INCONSISTENTES
                         * Aqui implementamos uma estratégia de fallback em cascata:
                         * 1. Tenta usar item.card (dados salvos no pedido)
                         * 2. Se não existir, busca no array de cards
                         * 3. Se ainda não encontrar, usa valores padrão
                         *
                         * Isso garante que o código NUNCA vai quebrar por tentar
                         * acessar propriedades de undefined.
                         */
                        const card = cards.find((c) => c.id === item.cardId);
                        const cardData = item.card ||
                          card || {
                            name: "Produto Desconhecido",
                            price: 0,
                          };
                        const unitPrice = cardData.price || 0;
                        const subtotal = unitPrice * (item.quantity || 1);

                        return (
                          <TableRow key={index}>
                            <TableCell>
                              {cardData.name || "Produto Desconhecido"}
                            </TableCell>
                            <TableCell align="right">
                              {item.quantity || 1}
                            </TableCell>
                            <TableCell align="right">
                              R$ {unitPrice.toFixed(2)}
                            </TableCell>
                            <TableCell align="right">
                              R$ {subtotal.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>

              {/* Seção de Gerenciamento de Status */}
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Gerenciar Status do Pedido
                </Typography>

                <Alert severity="info" sx={{ mb: 2 }}>
                  Para que o cliente possa solicitar trocas, o pedido precisa
                  estar com status "Entregue".
                </Alert>

                {/* Botões de ação baseados no status atual */}
                {selectedOrder.status === "pending" && (
                  <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
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

                {selectedOrder.status === ("confirmed" as Order["status"]) && (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<LocalShipping />}
                    onClick={() =>
                      handleUpdateOrderStatus(selectedOrder.id, "processing")
                    }
                  >
                    Iniciar Processamento
                  </Button>
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
                  <Alert severity="success">
                    ✅ Pedido entregue! O cliente já pode solicitar trocas se
                    necessário.
                  </Alert>
                )}

                {selectedOrder.status === "cancelled" && (
                  <Alert severity="error">❌ Este pedido foi cancelado.</Alert>
                )}
              </Box>
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

export default AdminVendas;
