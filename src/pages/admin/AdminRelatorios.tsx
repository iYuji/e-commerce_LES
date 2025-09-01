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
} from "@mui/icons-material";
import * as Store from "../../store/index";
import { Order, Card as CardType, Customer, Exchange } from "../../types";

const AdminRelatorios: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [cards, setCards] = useState<CardType[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [period, setPeriod] = useState("month");

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

  const calculateFinancialMetrics = () => {
    const periodOrders = filterOrdersByPeriod(orders, period);
    const totalRevenue = periodOrders.reduce(
      (sum, order) => sum + order.total,
      0
    );
    const totalOrders = periodOrders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Calcular crescimento comparado ao período anterior
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

  const calculateProductMetrics = () => {
    const periodOrders = filterOrdersByPeriod(orders, period);
    const productSales: {
      [key: string]: { quantity: number; revenue: number; name: string };
    } = {};

    periodOrders.forEach((order) => {
      order.items.forEach((item) => {
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
          productSales[item.cardId].revenue += item.card.price * item.quantity;
        }
      });
    });

    const topProducts = Object.entries(productSales)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    return { productSales, topProducts };
  };

  const calculateCustomerMetrics = () => {
    const periodOrders = filterOrdersByPeriod(orders, period);
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

  const exportReport = () => {
    const financial = calculateFinancialMetrics();
    const { topProducts } = calculateProductMetrics();
    const { topCustomers } = calculateCustomerMetrics();

    const reportData = [
      ["RELATÓRIO FINANCEIRO"],
      ["Período", period],
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
    a.download = `relatorio_${period}_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
  };

  const financial = calculateFinancialMetrics();
  const { topProducts } = calculateProductMetrics();
  const { topCustomers } = calculateCustomerMetrics();
  const inventory = calculateInventoryMetrics();

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
          Relatórios e Analytics
        </Typography>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <FormControl sx={{ minWidth: 120 }}>
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
          <Button
            variant="outlined"
            startIcon={<GetApp />}
            onClick={exportReport}
          >
            Exportar
          </Button>
        </Box>
      </Box>

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
                        filterOrdersByPeriod(orders, period).map(
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

      <Grid container spacing={3}>
        {/* Top Produtos */}
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

        {/* Top Clientes */}
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
