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
  TextField,
  Grid,
  Card,
  CardContent,
  Pagination,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
} from "@mui/material";
import {
  Search,
  Visibility,
  Check,
  Close,
  SwapHoriz,
  Schedule,
  CheckCircle,
  Cancel,
} from "@mui/icons-material";
import * as Store from "../../store/index";
import { Exchange, Customer, Card as CardType } from "../../types";

const ITEMS_PER_PAGE = 10;

const AdminTrocas: React.FC = () => {
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cards, setCards] = useState<CardType[]>([]);
  const [filteredExchanges, setFilteredExchanges] = useState<Exchange[]>([]);
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedExchange, setSelectedExchange] = useState<Exchange | null>(
    null
  );
  const [detailsOpen, setDetailsOpen] = useState(false);
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
  }, [exchanges, searchTerm, statusFilter]);

  const loadData = () => {
    const loadedExchanges = Store.getExchanges();
    const loadedCustomers = Store.getCustomers();
    const loadedCards = Store.getCards();
    setExchanges(loadedExchanges);
    setCustomers(loadedCustomers);
    setCards(loadedCards);
  };

  const applyFilters = () => {
    let filtered = exchanges;

    if (searchTerm) {
      filtered = filtered.filter((exchange) => {
        const customer = customers.find((c) => c.id === exchange.customerId);
        return (
          customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          exchange.id.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    if (statusFilter) {
      filtered = filtered.filter(
        (exchange) => exchange.status === statusFilter
      );
    }

    setFilteredExchanges(filtered);
    setPage(0);
  };

  const getCustomerName = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    return customer ? customer.name : "Cliente Desconhecido";
  };

  const getCardName = (cardId: string) => {
    const card = cards.find((c) => c.id === cardId);
    return card ? card.name : "Carta Desconhecida";
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "warning";
      case "approved":
        return "success";
      case "rejected":
        return "error";
      case "completed":
        return "primary";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      pending: "Pendente",
      approved: "Aprovado",
      rejected: "Rejeitado",
      completed: "Concluído",
    };
    return labels[status.toLowerCase()] || status;
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return <Schedule />;
      case "approved":
        return <CheckCircle />;
      case "rejected":
        return <Cancel />;
      case "completed":
        return <Check />;
      default:
        return <SwapHoriz />;
    }
  };

  const handleViewDetails = (exchange: Exchange) => {
    setSelectedExchange(exchange);
    setDetailsOpen(true);
  };

  const handleStatusChange = (exchangeId: string, newStatus: string) => {
    const updatedExchanges = exchanges.map((exchange) =>
      exchange.id === exchangeId
        ? { ...exchange, status: newStatus as Exchange["status"] }
        : exchange
    );
    setExchanges(updatedExchanges);
    Store.writeStore(Store.STORE_KEYS.exchanges, updatedExchanges);

    setSnackbar({
      open: true,
      message: `Troca ${getStatusLabel(newStatus).toLowerCase()} com sucesso!`,
      severity: "success",
    });
    setDetailsOpen(false);
  };

  const calculateStats = () => {
    const totalExchanges = exchanges.length;
    const pendingExchanges = exchanges.filter(
      (e) => e.status === "pending"
    ).length;
    const approvedExchanges = exchanges.filter(
      (e) => e.status === "approved"
    ).length;
    const completedExchanges = exchanges.filter(
      (e) => e.status === "completed"
    ).length;
    const rejectedExchanges = exchanges.filter(
      (e) => e.status === "rejected"
    ).length;

    return {
      totalExchanges,
      pendingExchanges,
      approvedExchanges,
      completedExchanges,
      rejectedExchanges,
    };
  };

  const stats = calculateStats();
  const paginatedExchanges = filteredExchanges.slice(
    page * ITEMS_PER_PAGE,
    (page + 1) * ITEMS_PER_PAGE
  );

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Gerenciar Trocas
      </Typography>

      {/* Estatísticas */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
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
                    Total
                  </Typography>
                  <Typography variant="h5">{stats.totalExchanges}</Typography>
                </Box>
                <SwapHoriz color="primary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
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
                    Pendentes
                  </Typography>
                  <Typography variant="h5" color="warning.main">
                    {stats.pendingExchanges}
                  </Typography>
                </Box>
                <Schedule color="warning" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
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
                    Aprovadas
                  </Typography>
                  <Typography variant="h5" color="success.main">
                    {stats.approvedExchanges}
                  </Typography>
                </Box>
                <CheckCircle color="success" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
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
                    Concluídas
                  </Typography>
                  <Typography variant="h5" color="primary">
                    {stats.completedExchanges}
                  </Typography>
                </Box>
                <Check color="primary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
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
                    Rejeitadas
                  </Typography>
                  <Typography variant="h5" color="error">
                    {stats.rejectedExchanges}
                  </Typography>
                </Box>
                <Cancel color="error" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Alertas */}
      {stats.pendingExchanges > 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Você tem {stats.pendingExchanges} solicitação(ões) de troca
          pendente(s) para revisar.
        </Alert>
      )}

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Buscar por cliente ou ID da troca..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <Search sx={{ mr: 1, color: "text.secondary" }} />
                ),
              }}
            />
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
                <MenuItem value="approved">Aprovado</MenuItem>
                <MenuItem value="rejected">Rejeitado</MenuItem>
                <MenuItem value="completed">Concluído</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("");
              }}
            >
              Limpar Filtros
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
              <TableCell>Carta Oferecida</TableCell>
              <TableCell>Carta Desejada</TableCell>
              <TableCell>Data</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedExchanges.map((exchange) => (
              <TableRow key={exchange.id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    #{exchange.id}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {getCustomerName(exchange.customerId)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {getCardName(exchange.offeredCardId)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {getCardName(exchange.requestedCardId)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {new Date(exchange.createdAt).toLocaleDateString()}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={getStatusLabel(exchange.status)}
                    size="small"
                    color={getStatusColor(exchange.status) as any}
                    icon={getStatusIcon(exchange.status)}
                  />
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    size="small"
                    onClick={() => handleViewDetails(exchange)}
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
          count={Math.ceil(filteredExchanges.length / ITEMS_PER_PAGE)}
          page={page + 1}
          onChange={(_, newPage) => setPage(newPage - 1)}
          color="primary"
        />
      </Box>

      {/* Dialog de Detalhes da Troca */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Detalhes da Troca #{selectedExchange?.id}</DialogTitle>
        <DialogContent>
          {selectedExchange && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Informações da Troca
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <Typography>
                          <strong>Cliente:</strong>{" "}
                          {getCustomerName(selectedExchange.customerId)}
                        </Typography>
                        <Typography>
                          <strong>Data:</strong>{" "}
                          {new Date(
                            selectedExchange.createdAt
                          ).toLocaleString()}
                        </Typography>
                        <Typography>
                          <strong>Status:</strong>{" "}
                          {getStatusLabel(selectedExchange.status)}
                        </Typography>
                        {selectedExchange.reason && (
                          <Typography>
                            <strong>Motivo:</strong> {selectedExchange.reason}
                          </Typography>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Detalhes da Troca
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <Typography>
                          <strong>Carta Oferecida:</strong>{" "}
                          {getCardName(selectedExchange.offeredCardId)}
                        </Typography>
                        <Typography>
                          <strong>Carta Desejada:</strong>{" "}
                          {getCardName(selectedExchange.requestedCardId)}
                        </Typography>
                        <Typography>
                          <strong>Observações:</strong>{" "}
                          {selectedExchange.notes || "Nenhuma"}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {selectedExchange.status === "pending" && (
                <Box
                  sx={{
                    mt: 3,
                    display: "flex",
                    gap: 2,
                    justifyContent: "center",
                  }}
                >
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<Check />}
                    onClick={() =>
                      handleStatusChange(selectedExchange.id, "approved")
                    }
                  >
                    Aprovar Troca
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<Close />}
                    onClick={() =>
                      handleStatusChange(selectedExchange.id, "rejected")
                    }
                  >
                    Rejeitar Troca
                  </Button>
                </Box>
              )}

              {selectedExchange.status === "approved" && (
                <Box sx={{ mt: 3, display: "flex", justifyContent: "center" }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Check />}
                    onClick={() =>
                      handleStatusChange(selectedExchange.id, "completed")
                    }
                  >
                    Marcar como Concluída
                  </Button>
                </Box>
              )}
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

export default AdminTrocas;
