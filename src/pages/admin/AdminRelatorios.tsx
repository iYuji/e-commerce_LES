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

// 🔧 FUNÇÃO HELPER ADICIONADA - Garante que cada item tem o card populado
const getItemCard = (item: any, cards: CardType[]): CardType | null => {
  // Se o item já tem card, retorna ele
  if (item.card) return item.card;
  
  // Senão, busca na lista de cards
  const card = cards.find((c) => c.id === item.cardId);
  
  if (!card) {
    console.warn(`Card ${item.cardId} não encontrado`);
    return null;
  }
  
  return card;
};

const AdminRelatorios: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [cards, setCards] = useState<CardType[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [period, setPeriod] = useState("month");

  const [useCustomPeriod, setUseCustomPeriod] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [analysisType, setAnalysisType] = useState<"product" | "category">("product");
  const [selectedProductId, setSelectedProductId] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [chartGranularity, setChartGranularity] = useState<"day" | "week" | "month">("day");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setOrders(Store.getOrders());
    setCards(Store.getCards());
    setCustomers(Store.getCustomers());
    setExchanges(Store.getExchanges());
  };

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

  const filterOrdersByCustomPeriod = (orders: Order[]) => {
    if (!startDate || !endDate) {
      console.warn("Datas não definidas, retornando todos os pedidos");
      return orders;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.error("Datas inválidas:", { startDate, endDate });
      return orders;
    }

    if (start > end) {
      console.warn("Data inicial é maior que data final");
    }

    end.setHours(23, 59, 59, 999);

    const filtered = orders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= start && orderDate <= end;
    });

    console.log(`Filtrados ${filtered.length} de ${orders.length} pedidos entre ${startDate} e ${endDate}`);

    return filtered;
  };

  const getCategories = () => {
    const categories = new Set<string>();
    cards.forEach((card) => {
      if (card.category) {
        categories.add(card.category);
      }
    });
    return Array.from(categories);
  };

  const formatDateForDisplay = (dateKey: string, granularity: string) => {
    if (granularity === "day") {
      const [year, month, day] = dateKey.split("-");
      return `${day}/${month}`;
    } else if (granularity === "week") {
      const [year, month, day] = dateKey.split("-");
      return `Sem ${day}/${month}`;
    } else if (granularity === "month") {
      const [year, month] = dateKey.split("-");
      const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      return `${monthNames[parseInt(month) - 1]}/${year}`;
    }
    return dateKey;
  };

  // 🔧 FUNÇÃO CORRIGIDA - prepareSalesChartData
  const prepareSalesChartData = () => {
    const filteredOrders = useCustomPeriod
      ? filterOrdersByCustomPeriod(orders)
      : filterOrdersByPeriod(orders, period);

    let relevantOrders = filteredOrders;

    if (analysisType === "product" && selectedProductId !== "all") {
      relevantOrders = filteredOrders.filter((order) =>
        order.items?.some((item) => item.cardId === selectedProductId)
      );
    } else if (analysisType === "category" && selectedCategory !== "all") {
      relevantOrders = filteredOrders.filter((order) =>
        order.items?.some((item) => {
          const card = getItemCard(item, cards);
          return card && card.category === selectedCategory;
        })
      );
    }

    const salesByDate: { [key: string]: number } = {};

    relevantOrders.forEach((order) => {
      const date = new Date(order.createdAt);
      let dateKey = "";

      if (chartGranularity === "day") {
        dateKey = date.toISOString().split("T")[0];
      } else if (chartGranularity === "week") {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        dateKey = weekStart.toISOString().split("T")[0];
      } else if (chartGranularity === "month") {
        dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      }

      let quantity = 0;
      
      // 🔧 CORREÇÃO APLICADA AQUI
      order.items?.forEach((item) => {
        const card = getItemCard(item, cards);
        
        if (!card) {
          return;
        }

        const shouldCount =
          (analysisType === "product" &&
            (selectedProductId === "all" || item.cardId === selectedProductId)) ||
          (analysisType === "category" &&
            (selectedCategory === "all" || card.category === selectedCategory));

        if (shouldCount) {
          quantity += item.quantity;
        }
      });

      salesByDate[dateKey] = (salesByDate[dateKey] || 0) + quantity;
    });

    const chartData = Object.entries(salesByDate)
      .map(([date, quantidade]) => ({
        date,
        quantidade: quantidade,
        dataFormatada: formatDateForDisplay(date, chartGranularity),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return chartData;
  };

  const calculateFinancialMetrics = () => {
    const periodOrders = useCustomPeriod
      ? filterOrdersByCustomPeriod(orders)
      : filterOrdersByPeriod(orders, period);

    const totalRevenue = periodOrders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = periodOrders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const previousPeriodOrders = filterOrdersByPeriod(orders, period).filter((order) => {
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
    });

    const previousRevenue = previousPeriodOrders.reduce((sum, order) => sum + order.total, 0);
    const revenueGrowth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      revenueGrowth,
      previousRevenue,
    };
  };

  // 🔧 FUNÇÃO CORRIGIDA - calculateProductMetrics
  const calculateProductMetrics = () => {
    const periodOrders = useCustomPeriod
      ? filterOrdersByCustomPeriod(orders)
      : filterOrdersByPeriod(orders, period);

    const productSales: {
      [key: string]: { quantity: number; revenue: number; name: string };
    } = {};

    periodOrders.forEach((order) => {
      order.items?.forEach((item) => {
        const card = getItemCard(item, cards);
        
        if (!card) {
          return;
        }

        if (!productSales[item.cardId]) {
          productSales[item.cardId] = {
            quantity: 0,
            revenue: 0,
            name: card.name,
          };
        }
        productSales[item.cardId].quantity += item.quantity;
        productSales[item.cardId].revenue += card.price * item.quantity;
      });
    });

    const topProducts = Object.entries(productSales)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    return { productSales, topProducts };
  };

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

  const calculateInventoryMetrics = () => {
    const totalProducts = cards.length;
    const totalValue = cards.reduce((sum, card) => sum + card.price * card.stock, 0);
    const lowStockItems = cards.filter((card) => card.stock <= 5 && card.stock > 0).length;
    const outOfStockItems = cards.filter((card) => card.stock === 0).length;

    return {
      totalProducts,
      totalValue,
      lowStockItems,
      outOfStockItems,
    };
  };

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
      ...topProducts.map((p) => [p.name, p.quantity.toString(), `R$ ${p.revenue.toFixed(2)}`]),
      [""],
      ["TOP 5 CLIENTES"],
      ["Cliente", "Pedidos", "Total Gasto"],
      ...topCustomers.map((c) => [c.name, c.orders.toString(), `R$ ${c.revenue.toFixed(2)}`]),
    ];

    const csvContent = reportData.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const financial = calculateFinancialMetrics();
  const { topProducts } = calculateProductMetrics();
  const { topCustomers } = calculateCustomerMetrics();
  const inventory = calculateInventoryMetrics();
  const salesChartData = prepareSalesChartData();

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" component="h1">
          Relatórios e Analytics
        </Typography>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <Button variant="outlined" startIcon={<GetApp />} onClick={exportReport}>
            Exportar CSV
          </Button>
        </Box>
      </Box>

      {/* Análise de Vendas com Gráfico */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
            <ShowChart color="primary" />
            <Typography variant="h5">Análise de Volume de Vendas</Typography>
          </Box>

          <Grid container spacing={2} sx={{ mb: 3 }}>
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

            {!useCustomPeriod && (
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Período</InputLabel>
                  <Select value={period} label="Período" onChange={(e) => setPeriod(e.target.value)}>
                    <MenuItem value="week">Última semana</MenuItem>
                    <MenuItem value="month">Último mês</MenuItem>
                    <MenuItem value="quarter">Últimos 3 meses</MenuItem>
                    <MenuItem value="year">Último ano</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}

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

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo de Análise</InputLabel>
                <Select
                  value={analysisType}
                  label="Tipo de Análise"
                  onChange={(e) => setAnalysisType(e.target.value as "product" | "category")}
                >
                  <MenuItem value="product">Por Produto</MenuItem>
                  <MenuItem value="category">Por Categoria</MenuItem>
                </Select>
              </FormControl>
            </Grid>

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

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Granularidade</InputLabel>
                <Select
                  value={chartGranularity}
                  label="Granularidade"
                  onChange={(e) => setChartGranularity(e.target.value as "day" | "week" | "month")}
                >
                  <MenuItem value="day">Por Dia</MenuItem>
                  <MenuItem value="week">Por Semana</MenuItem>
                  <MenuItem value="month">Por Mês</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ width: "100%", height: 400, minHeight: 400 }}>
            {salesChartData.length === 0 ? (
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                <Typography variant="body1" color="text.secondary">
                  Nenhum dado disponível para o período selecionado.
                  {useCustomPeriod && (!startDate || !endDate) && " Por favor, selecione as datas inicial e final."}
                </Typography>
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={salesChartData} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dataFormatada" angle={-45} textAnchor="end" height={80} interval="preserveStartEnd" />
                  <YAxis label={{ value: "Quantidade Vendida", angle: -90, position: "insideLeft" }} />
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

          {salesChartData.length > 0 && (
            <Box sx={{ mt: 3, display: "flex", gap: 2, flexWrap: "wrap" }}>
              <Chip
                icon={<ShoppingCart />}
                label={`Total Vendido: ${salesChartData.reduce((sum, d) => sum + d.quantidade, 0)} unidades`}
                color="primary"
                variant="outlined"
              />
              <Chip
                icon={<TrendingUp />}
                label={`Pico: ${Math.max(...salesChartData.map((d) => d.quantidade))} unidades`}
                color="success"
                variant="outlined"
              />
              <Chip
                icon={<Assessment />}
                label={`Média: ${(
                  salesChartData.reduce((sum, d) => sum + d.quantidade, 0) / salesChartData.length
                ).toFixed(1)} unidades/período`}
                color="info"
                variant="outlined"
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Resumo Financeiro */}
      <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
        Resumo Financeiro
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Receita Total
                  </Typography>
                  <Typography variant="h4" color="primary">
                    R$ {financial.totalRevenue.toFixed(2)}
                  </Typography>
                  <Typography
                    variant="body2"
                    color={financial.revenueGrowth >= 0 ? "success.main" : "error.main"}
                    sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                  >
                    {financial.revenueGrowth >= 0 ? <TrendingUp fontSize="small" /> : <TrendingDown fontSize="small" />}
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
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
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
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Ticket Médio
                  </Typography>
                  <Typography variant="h4">R$ {financial.averageOrderValue.toFixed(2)}</Typography>
                </Box>
                <Assessment color="primary" fontSize="large" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Clientes Ativos
                  </Typography>
                  <Typography variant="h4">
                    {
                      new Set(
                        (useCustomPeriod ? filterOrdersByCustomPeriod(orders) : filterOrdersByPeriod(orders, period)).map(
                          (o) => o.customerId
                        )
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

      {/* Status do Estoque */}
      <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
        Status do Estoque
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total de Produtos
                  </Typography>
                  <Typography variant="h5">{inventory.totalProducts}</Typography>
                </Box>
                <Inventory color="primary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
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
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
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
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
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

      {/* Top Produtos e Clientes */}
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
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Chip label={index + 1} size="small" color={index === 0 ? "primary" : "default"} />
                            {product.name}
                          </Box>
                        </TableCell>
                        <TableCell align="right">{product.quantity}</TableCell>
                        <TableCell align="right">R$ {product.revenue.toFixed(2)}</TableCell>
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
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Chip label={index + 1} size="small" color={index === 0 ? "primary" : "default"} />
                            {customer.name}
                          </Box>
                        </TableCell>
                        <TableCell align="right">{customer.orders}</TableCell>
                        <TableCell align="right">R$ {customer.revenue.toFixed(2)}</TableCell>
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
                Status das Trocas
              </Typography>
              <Box sx={{ mt: 2 }}>
                {["pending", "approved", "completed", "rejected"].map((status) => {
                  const count = exchanges.filter((e) => e.status === status).length;
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
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                        <Typography variant="body2">{statusLabels[status]}</Typography>
                        <Typography variant="body2">
                          {count} ({percentage.toFixed(1)}%)
                        </Typography>
                      </Box>
                      <LinearProgress variant="determinate" value={percentage} sx={{ height: 8, borderRadius: 4 }} />
                    </Box>
                  );
                })}
              </Box>
            </CardContent>
          </Card>
        </Grid>

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
                  <strong>Receita Total (Histórico):</strong> R$ {orders.reduce((sum, order) => sum + order.total, 0).toFixed(2)}
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