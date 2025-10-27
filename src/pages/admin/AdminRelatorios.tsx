import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  LinearProgress,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
  Divider,
} from "@mui/material";
import {
  TrendingUp,
  TrendingDown,
  People,
  ShoppingCart,
  AttachMoney,
  Inventory,
  Assessment,
  GetApp,
  ShowChart,
  CalendarToday,
} from "@mui/icons-material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import * as Store from "../../store/index";
import { Order, Card as CardType, Customer, Exchange } from "../../types";

const AdminRelatorios: React.FC = () => {
  // ============================================================================
  // ESTADOS PRINCIPAIS - Armazenam os dados carregados do sistema
  // ============================================================================

  const [orders, setOrders] = useState<Order[]>([]);
  const [cards, setCards] = useState<CardType[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [period, setPeriod] = useState("month");

  // ============================================================================
  // NOVOS ESTADOS - Controles para análise de vendas com período customizado
  // ============================================================================

  // Controla se usa período pré-definido ou período customizado
  const [useCustomPeriod, setUseCustomPeriod] = useState(false);

  // Datas inicial e final para o período customizado
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Define se analisa por produto individual ou por categoria de produtos
  const [analysisType, setAnalysisType] = useState<"product" | "category">(
    "product"
  );

  // IDs selecionados para filtro (ou "all" para todos)
  const [selectedProductId, setSelectedProductId] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Define como agrupar os dados: por dia, semana ou mês
  const [chartGranularity, setChartGranularity] = useState<
    "day" | "week" | "month"
  >("day");

  // ============================================================================
  // CARREGAMENTO INICIAL - Busca todos os dados do Store (localStorage)
  // ============================================================================

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setOrders(Store.getOrders());
    setCards(Store.getCards());
    setCustomers(Store.getCustomers());
    setExchanges(Store.getExchanges());
  };

  // ============================================================================
  // FUNÇÃO DE FILTRO POR PERÍODO PRÉ-DEFINIDO
  // Esta função mantém a funcionalidade original do componente
  // ============================================================================

  const filterOrdersByPeriod = (orders: Order[], periodType: string) => {
    const now = new Date();
    const filterDate = new Date();

    switch (periodType) {
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
      default:
        return orders;
    }

    return orders.filter((order) => new Date(order.createdAt) >= filterDate);
  };

  // ============================================================================
  // NOVA FUNÇÃO - Filtro por período customizado com validações robustas
  // Permite ao admin escolher qualquer intervalo de datas
  // ============================================================================

  const filterOrdersByCustomPeriod = (orders: Order[]) => {
    // Se não houver datas definidas, retorna todos os pedidos
    if (!startDate || !endDate) {
      console.warn("Datas não definidas, retornando todos os pedidos");
      return orders;
    }

    // Converte as strings de data em objetos Date
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Valida se as datas são válidas (não NaN)
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.error("Datas inválidas:", { startDate, endDate });
      return orders;
    }

    // Verifica se a data inicial é menor que a data final
    // Se não for, inverte automaticamente para evitar erro
    if (start > end) {
      console.warn("Data inicial é maior que data final");
      // Não invertemos aqui, apenas avisamos - deixamos o usuário corrigir
    }

    // Ajusta o horário final para incluir todo o último dia (23:59:59.999)
    end.setHours(23, 59, 59, 999);

    // Filtra os pedidos que estão dentro do intervalo
    const filtered = orders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= start && orderDate <= end;
    });

    console.log(
      `Filtrados ${filtered.length} de ${orders.length} pedidos entre ${startDate} e ${endDate}`
    );

    return filtered;
  };

  // ============================================================================
  // NOVA FUNÇÃO - Extrai todas as categorias únicas dos produtos
  // Permite filtrar o gráfico por categoria específica
  // ============================================================================

  const getCategories = () => {
    const categories = new Set<string>();
    cards.forEach((card) => {
      if (card.category) {
        categories.add(card.category);
      }
    });
    return Array.from(categories);
  };

  // ============================================================================
  // NOVA FUNÇÃO - Formata datas para exibição no gráfico
  // Torna as datas mais legíveis e compactas para o eixo X
  // ============================================================================

  const formatDateForDisplay = (dateKey: string, granularity: string) => {
    if (granularity === "day") {
      // Para dias: mostra DD/MM
      const [year, month, day] = dateKey.split("-");
      return `${day}/${month}`;
    } else if (granularity === "week") {
      // Para semanas: mostra "Sem DD/MM" (início da semana)
      const [year, month, day] = dateKey.split("-");
      return `Sem ${day}/${month}`;
    } else if (granularity === "month") {
      // Para meses: mostra "MMM/YYYY" (ex: Jan/2025)
      const [year, month] = dateKey.split("-");
      const monthNames = [
        "Jan",
        "Fev",
        "Mar",
        "Abr",
        "Mai",
        "Jun",
        "Jul",
        "Ago",
        "Set",
        "Out",
        "Nov",
        "Dez",
      ];
      return `${monthNames[parseInt(month) - 1]}/${year}`;
    }
    return dateKey;
  };

  // ============================================================================
  // FUNÇÃO PRINCIPAL - Prepara os dados para o gráfico de linhas
  // Esta é a função mais importante da implementação!
  // ============================================================================

  const prepareSalesChartData = () => {
    // PASSO 1: Determina qual conjunto de pedidos usar baseado no filtro de período
    const filteredOrders = useCustomPeriod
      ? filterOrdersByCustomPeriod(orders)
      : filterOrdersByPeriod(orders, period);

    // PASSO 2: Aplica filtro adicional por produto ou categoria específica
    let relevantOrders = filteredOrders;

    if (analysisType === "product" && selectedProductId !== "all") {
      // Filtra apenas pedidos que contêm o produto específico selecionado
      relevantOrders = filteredOrders.filter((order) =>
        order.items.some((item) => item.cardId === selectedProductId)
      );
    } else if (analysisType === "category" && selectedCategory !== "all") {
      // Filtra apenas pedidos que contêm produtos da categoria selecionada
      // CORREÇÃO: Verifica se item.card existe antes de acessar category
      relevantOrders = filteredOrders.filter((order) =>
        order.items.some(
          (item) => item.card && item.card.category === selectedCategory
        )
      );
    }

    // PASSO 3: Agrupa as vendas por data de acordo com a granularidade escolhida
    // Criamos um objeto onde a chave é a data e o valor é a quantidade total vendida naquela data
    const salesByDate: { [key: string]: number } = {};

    relevantOrders.forEach((order) => {
      const date = new Date(order.createdAt);
      let dateKey = "";

      // Define a chave de agrupamento baseada na granularidade selecionada
      if (chartGranularity === "day") {
        // Para dia: usa a data completa YYYY-MM-DD
        dateKey = date.toISOString().split("T")[0];
      } else if (chartGranularity === "week") {
        // Para semana: calcula o início da semana (domingo)
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        dateKey = weekStart.toISOString().split("T")[0];
      } else if (chartGranularity === "month") {
        // Para mês: usa apenas ano e mês YYYY-MM
        dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
          2,
          "0"
        )}`;
      }

      // Calcula a quantidade total vendida neste pedido
      let quantity = 0;
      order.items.forEach((item) => {
        // CORREÇÃO CRÍTICA: Verifica se item.card existe antes de processar
        // Isso previne o erro "Cannot read properties of undefined"
        if (!item.card) {
          console.warn(`Item sem card no pedido ${order.id}:`, item);
          return; // Pula este item e continua com o próximo
        }

        // Verifica se este item deve ser contado baseado nos filtros ativos
        const shouldCount =
          (analysisType === "product" &&
            (selectedProductId === "all" ||
              item.cardId === selectedProductId)) ||
          (analysisType === "category" &&
            (selectedCategory === "all" ||
              item.card.category === selectedCategory));

        if (shouldCount) {
          quantity += item.quantity;
        }
      });

      // Acumula a quantidade vendida nesta data
      // Se a data ainda não existe no objeto, inicializa com 0
      salesByDate[dateKey] = (salesByDate[dateKey] || 0) + quantity;
    });

    // PASSO 4: Converte o objeto em array e prepara para o gráfico
    const chartData = Object.entries(salesByDate)
      .map(([date, quantity]) => ({
        date,
        quantidade: quantity,
        dataFormatada: formatDateForDisplay(date, chartGranularity),
      }))
      .sort((a, b) => a.date.localeCompare(b.date)); // Ordena por data crescente

    return chartData;
  };

  // ============================================================================
  // FUNÇÃO DE CÁLCULO - Métricas financeiras com suporte a período customizado
  // ============================================================================

  const calculateFinancialMetrics = () => {
    const periodOrders = useCustomPeriod
      ? filterOrdersByCustomPeriod(orders)
      : filterOrdersByPeriod(orders, period);

    const totalRevenue = periodOrders.reduce(
      (sum, order) => sum + order.total,
      0
    );
    const totalOrders = periodOrders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Calcula crescimento comparado ao período anterior
    const previousPeriodOrders = filterOrdersByPeriod(orders, period).filter(
      (order) => {
        const orderDate = new Date(order.createdAt);
        const periodStart = new Date();
        const periodEnd = new Date();

        switch (period) {
          case "week":
            periodStart.setDate(periodStart.getDate() - 14);
            periodEnd.setDate(periodEnd.getDate() - 7);
            break;
          case "month":
            periodStart.setMonth(periodStart.getMonth() - 2);
            periodEnd.setMonth(periodEnd.getMonth() - 1);
            break;
          case "quarter":
            periodStart.setMonth(periodStart.getMonth() - 6);
            periodEnd.setMonth(periodEnd.getMonth() - 3);
            break;
          case "year":
            periodStart.setFullYear(periodStart.getFullYear() - 2);
            periodEnd.setFullYear(periodEnd.getFullYear() - 1);
            break;
        }

        return orderDate >= periodStart && orderDate <= periodEnd;
      }
    );

    const previousRevenue = previousPeriodOrders.reduce(
      (sum, order) => sum + order.total,
      0
    );
    const revenueGrowth =
      previousRevenue > 0
        ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
        : 0;

    return {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      revenueGrowth,
      previousRevenue,
    };
  };

  // ============================================================================
  // FUNÇÃO DE CÁLCULO - Métricas de produtos com validação robusta
  // CORRIGIDA para evitar erros quando item.card é undefined
  // ============================================================================

  const calculateProductMetrics = () => {
    const periodOrders = useCustomPeriod
      ? filterOrdersByCustomPeriod(orders)
      : filterOrdersByPeriod(orders, period);

    const productSales: {
      [key: string]: { quantity: number; revenue: number; name: string };
    } = {};

    periodOrders.forEach((order) => {
      order.items.forEach((item) => {
        // CORREÇÃO CRÍTICA: Verifica se o card existe antes de acessar suas propriedades
        if (!item.card) {
          console.warn(`Item sem card no pedido ${order.id}:`, item);
          return; // Pula este item
        }

        const card = cards.find((c) => c.id === item.cardId);
        if (card) {
          if (!productSales[item.cardId]) {
            productSales[item.cardId] = {
              quantity: 0,
              revenue: 0,
              name: card.name,
            };
          }
          productSales[item.cardId].quantity += item.quantity;
          // Usa o preço do card encontrado, não do item (que pode estar undefined)
          productSales[item.cardId].revenue += card.price * item.quantity;
        }
      });
    });

    const topProducts = Object.entries(productSales)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    return { productSales, topProducts };
  };

  // ============================================================================
  // FUNÇÃO DE CÁLCULO - Métricas de clientes
  // ============================================================================

  const calculateCustomerMetrics = () => {
    const periodOrders = useCustomPeriod
      ? filterOrdersByCustomPeriod(orders)
      : filterOrdersByPeriod(orders, period);

    const customerStats: {
      [key: string]: { orders: number; revenue: number; name: string };
    } = {};

    periodOrders.forEach((order) => {
      const customer = customers.find((c) => c.id === order.customerId);
      if (customer) {
        if (!customerStats[order.customerId]) {
          customerStats[order.customerId] = {
            orders: 0,
            revenue: 0,
            name: customer.name,
          };
        }
        customerStats[order.customerId].orders += 1;
        customerStats[order.customerId].revenue += order.total;
      }
    });

    const topCustomers = Object.entries(customerStats)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return { customerStats, topCustomers };
  };

  // ============================================================================
  // FUNÇÃO DE CÁLCULO - Métricas de estoque
  // ============================================================================

  const calculateInventoryMetrics = () => {
    const totalProducts = cards.length;
    const totalValue = cards.reduce(
      (sum, card) => sum + card.price * card.stock,
      0
    );
    const lowStockItems = cards.filter(
      (card) => card.stock <= 5 && card.stock > 0
    ).length;
    const outOfStockItems = cards.filter((card) => card.stock === 0).length;

    return {
      totalProducts,
      totalValue,
      lowStockItems,
      outOfStockItems,
    };
  };

  // ============================================================================
  // FUNÇÃO DE EXPORTAÇÃO - Gera arquivo CSV com relatório completo
  // ============================================================================

  const exportReport = () => {
    const financial = calculateFinancialMetrics();
    const { topProducts } = calculateProductMetrics();
    const { topCustomers } = calculateCustomerMetrics();

    const reportData = [
      ["RELATÓRIO FINANCEIRO"],
      ["Período", useCustomPeriod ? `${startDate} a ${endDate}` : period],
      ["Receita Total", `R$ ${financial.totalRevenue.toFixed(2)}`],
      ["Total de Pedidos", financial.totalOrders.toString()],
      ["Ticket Médio", `R$ ${financial.averageOrderValue.toFixed(2)}`],
      ["Crescimento", `${financial.revenueGrowth.toFixed(1)}%`],
      [""],
      ["TOP 5 PRODUTOS"],
      ["Produto", "Quantidade Vendida", "Receita"],
      ...topProducts.map((p) => [
        p.name,
        p.quantity.toString(),
        `R$ ${p.revenue.toFixed(2)}`,
      ]),
      [""],
      ["TOP 5 CLIENTES"],
      ["Cliente", "Pedidos", "Total Gasto"],
      ...topCustomers.map((c) => [
        c.name,
        c.orders.toString(),
        `R$ ${c.revenue.toFixed(2)}`,
      ]),
    ];

    const csvContent = reportData.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  // ============================================================================
  // PREPARAÇÃO DOS DADOS - Calcula todas as métricas antes de renderizar
  // ============================================================================

  const financial = calculateFinancialMetrics();
  const { topProducts } = calculateProductMetrics();
  const { topCustomers } = calculateCustomerMetrics();
  const inventory = calculateInventoryMetrics();
  const salesChartData = prepareSalesChartData();

  // ============================================================================
  // RENDERIZAÇÃO DO COMPONENTE
  // ============================================================================

  return (
    <Box>
      {/* Header com título e botão de exportação */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1">
          Relatórios e Analytics
        </Typography>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <Button
            variant="outlined"
            startIcon={<GetApp />}
            onClick={exportReport}
          >
            Exportar CSV
          </Button>
        </Box>
      </Box>

      {/* ========================================================================
          SEÇÃO NOVA: ANÁLISE DE VENDAS COM GRÁFICO DE LINHAS
          Esta seção contém todos os controles de filtro e o gráfico interativo
          ======================================================================== */}

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
            <ShowChart color="primary" />
            <Typography variant="h5">Análise de Volume de Vendas</Typography>
          </Box>

          {/* Controles de Filtro organizados em grid responsivo */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {/* Toggle para escolher entre período pré-definido ou customizado */}
            <Grid item xs={12}>
              <ToggleButtonGroup
                value={useCustomPeriod ? "custom" : "preset"}
                exclusive
                onChange={(e, value) => {
                  if (value !== null) {
                    setUseCustomPeriod(value === "custom");
                  }
                }}
                size="small"
              >
                <ToggleButton value="preset">
                  <Assessment sx={{ mr: 1 }} />
                  Período Pré-definido
                </ToggleButton>
                <ToggleButton value="custom">
                  <CalendarToday sx={{ mr: 1 }} />
                  Período Customizado
                </ToggleButton>
              </ToggleButtonGroup>
            </Grid>

            {/* Seletor de período pré-definido (mostra apenas quando não é customizado) */}
            {!useCustomPeriod && (
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Período</InputLabel>
                  <Select
                    value={period}
                    label="Período"
                    onChange={(e) => setPeriod(e.target.value)}
                  >
                    <MenuItem value="week">Última semana</MenuItem>
                    <MenuItem value="month">Último mês</MenuItem>
                    <MenuItem value="quarter">Últimos 3 meses</MenuItem>
                    <MenuItem value="year">Último ano</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}

            {/* Seletores de data customizada (mostra apenas quando é customizado) */}
            {useCustomPeriod && (
              <>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Data Inicial"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Data Final"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                  />
                </Grid>
              </>
            )}

            {/* Tipo de análise: por produto individual ou por categoria */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo de Análise</InputLabel>
                <Select
                  value={analysisType}
                  label="Tipo de Análise"
                  onChange={(e) =>
                    setAnalysisType(e.target.value as "product" | "category")
                  }
                >
                  <MenuItem value="product">Por Produto</MenuItem>
                  <MenuItem value="category">Por Categoria</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Seletor dinâmico: mostra produtos OU categorias baseado no tipo de análise */}
            <Grid item xs={12} sm={6} md={3}>
              {analysisType === "product" ? (
                <FormControl fullWidth size="small">
                  <InputLabel>Produto</InputLabel>
                  <Select
                    value={selectedProductId}
                    label="Produto"
                    onChange={(e) => setSelectedProductId(e.target.value)}
                  >
                    <MenuItem value="all">Todos os Produtos</MenuItem>
                    {cards.map((card) => (
                      <MenuItem key={card.id} value={card.id}>
                        {card.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : (
                <FormControl fullWidth size="small">
                  <InputLabel>Categoria</InputLabel>
                  <Select
                    value={selectedCategory}
                    label="Categoria"
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <MenuItem value="all">Todas as Categorias</MenuItem>
                    {getCategories().map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Grid>

            {/* Granularidade: define se agrupa por dia, semana ou mês */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Granularidade</InputLabel>
                <Select
                  value={chartGranularity}
                  label="Granularidade"
                  onChange={(e) =>
                    setChartGranularity(
                      e.target.value as "day" | "week" | "month"
                    )
                  }
                >
                  <MenuItem value="day">Por Dia</MenuItem>
                  <MenuItem value="week">Por Semana</MenuItem>
                  <MenuItem value="month">Por Mês</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Gráfico de Linhas com altura fixa para evitar erro do Recharts */}
          <Box sx={{ width: "100%", height: 400, minHeight: 400 }}>
            {salesChartData.length === 0 ? (
              // Mensagem quando não há dados para exibir
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                }}
              >
                <Typography variant="body1" color="text.secondary">
                  Nenhum dado disponível para o período selecionado.
                  {useCustomPeriod &&
                    (!startDate || !endDate) &&
                    " Por favor, selecione as datas inicial e final."}
                </Typography>
              </Box>
            ) : (
              // Gráfico de linhas renderizado pelo Recharts
              <ResponsiveContainer width="100%" height={400}>
                <LineChart
                  data={salesChartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="dataFormatada"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    label={{
                      value: "Quantidade Vendida",
                      angle: -90,
                      position: "insideLeft",
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="quantidade"
                    stroke="#1976d2"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Quantidade Vendida"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Box>

          {/* Estatísticas resumidas do gráfico exibidas como chips coloridos */}
          {salesChartData.length > 0 && (
            <Box sx={{ mt: 3, display: "flex", gap: 2, flexWrap: "wrap" }}>
              <Chip
                icon={<ShoppingCart />}
                label={`Total Vendido: ${salesChartData.reduce(
                  (sum, d) => sum + d.quantidade,
                  0
                )} unidades`}
                color="primary"
                variant="outlined"
              />
              <Chip
                icon={<TrendingUp />}
                label={`Pico: ${Math.max(
                  ...salesChartData.map((d) => d.quantidade)
                )} unidades`}
                color="success"
                variant="outlined"
              />
              <Chip
                icon={<Assessment />}
                label={`Média: ${(
                  salesChartData.reduce((sum, d) => sum + d.quantidade, 0) /
                  salesChartData.length
                ).toFixed(1)} unidades/período`}
                color="info"
                variant="outlined"
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* ========================================================================
          SEÇÕES ORIGINAIS: Mantidas do código original
          ======================================================================== */}

      {/* Métricas Financeiras */}
      <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
        Resumo Financeiro
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
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
                  <Typography variant="h4" color="primary">
                    R$ {financial.totalRevenue.toFixed(2)}
                  </Typography>
                  <Typography
                    variant="body2"
                    color={
                      financial.revenueGrowth >= 0
                        ? "success.main"
                        : "error.main"
                    }
                    sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                  >
                    {financial.revenueGrowth >= 0 ? (
                      <TrendingUp fontSize="small" />
                    ) : (
                      <TrendingDown fontSize="small" />
                    )}
                    {financial.revenueGrowth >= 0 ? "+" : ""}
                    {financial.revenueGrowth.toFixed(1)}%
                  </Typography>
                </Box>
                <AttachMoney color="primary" fontSize="large" />
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
                    Total de Pedidos
                  </Typography>
                  <Typography variant="h4">{financial.totalOrders}</Typography>
                </Box>
                <ShoppingCart color="primary" fontSize="large" />
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
                    Ticket Médio
                  </Typography>
                  <Typography variant="h4">
                    R$ {financial.averageOrderValue.toFixed(2)}
                  </Typography>
                </Box>
                <Assessment color="primary" fontSize="large" />
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
                    Clientes Ativos
                  </Typography>
                  <Typography variant="h4">
                    {
                      new Set(
                        (useCustomPeriod
                          ? filterOrdersByCustomPeriod(orders)
                          : filterOrdersByPeriod(orders, period)
                        ).map((o) => o.customerId)
                      ).size
                    }
                  </Typography>
                </Box>
                <People color="primary" fontSize="large" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Métricas de Estoque */}
      <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
        Status do Estoque
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
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
                    Total de Produtos
                  </Typography>
                  <Typography variant="h5">
                    {inventory.totalProducts}
                  </Typography>
                </Box>
                <Inventory color="primary" />
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
                    Valor do Estoque
                  </Typography>
                  <Typography variant="h5" color="primary">
                    R$ {inventory.totalValue.toFixed(2)}
                  </Typography>
                </Box>
                <AttachMoney color="primary" />
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
                    Estoque Baixo
                  </Typography>
                  <Typography variant="h5" color="warning.main">
                    {inventory.lowStockItems}
                  </Typography>
                </Box>
                <TrendingDown color="warning" />
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
                    Sem Estoque
                  </Typography>
                  <Typography variant="h5" color="error">
                    {inventory.outOfStockItems}
                  </Typography>
                </Box>
                <TrendingDown color="error" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabelas de Top Produtos e Top Clientes */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top 5 Produtos Mais Vendidos
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Produto</TableCell>
                      <TableCell align="right">Vendidos</TableCell>
                      <TableCell align="right">Receita</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {topProducts.map((product, index) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Chip
                              label={index + 1}
                              size="small"
                              color={index === 0 ? "primary" : "default"}
                            />
                            {product.name}
                          </Box>
                        </TableCell>
                        <TableCell align="right">{product.quantity}</TableCell>
                        <TableCell align="right">
                          R$ {product.revenue.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top 5 Melhores Clientes
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Cliente</TableCell>
                      <TableCell align="right">Pedidos</TableCell>
                      <TableCell align="right">Total Gasto</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {topCustomers.map((customer, index) => (
                      <TableRow key={customer.id}>
                        <TableCell>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Chip
                              label={index + 1}
                              size="small"
                              color={index === 0 ? "primary" : "default"}
                            />
                            {customer.name}
                          </Box>
                        </TableCell>
                        <TableCell align="right">{customer.orders}</TableCell>
                        <TableCell align="right">
                          R$ {customer.revenue.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Status das Trocas */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Status das Trocas
              </Typography>
              <Box sx={{ mt: 2 }}>
                {["pending", "approved", "completed", "rejected"].map(
                  (status) => {
                    const count = exchanges.filter(
                      (e) => e.status === status
                    ).length;
                    const total = exchanges.length;
                    const percentage = total > 0 ? (count / total) * 100 : 0;

                    const statusLabels: { [key: string]: string } = {
                      pending: "Pendentes",
                      approved: "Aprovadas",
                      completed: "Concluídas",
                      rejected: "Rejeitadas",
                    };

                    return (
                      <Box key={status} sx={{ mb: 2 }}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            mb: 1,
                          }}
                        >
                          <Typography variant="body2">
                            {statusLabels[status]}
                          </Typography>
                          <Typography variant="body2">
                            {count} ({percentage.toFixed(1)}%)
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={percentage}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>
                    );
                  }
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Resumo Geral */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Resumo Geral
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Total de Clientes:</strong> {customers.length}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Total de Produtos:</strong> {cards.length}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Total de Pedidos:</strong> {orders.length}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Total de Trocas:</strong> {exchanges.length}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Receita Total (Histórico):</strong> R${" "}
                  {orders
                    .reduce((sum, order) => sum + order.total, 0)
                    .toFixed(2)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminRelatorios;
