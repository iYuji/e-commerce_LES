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
  TextField,
  Grid,
  Card,
  CardContent,
  Avatar,
  Pagination,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  Snackbar,
  CircularProgress,
} from "@mui/material";
import {
  Search,
  Visibility,
  Email,
  Phone,
  Add,
  Edit,
  Delete,
  Person,
} from "@mui/icons-material";
import { customerApi, CreateCustomerData } from "../../api/customerApi";
import { Customer } from "../../types";

const ITEMS_PER_PAGE = 10;

const AdminClientes: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Estados para detalhes do cliente
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [customerStats, setCustomerStats] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Estados do CRUD
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  // Form state (simple controlled inputs)
  const [formValues, setFormValues] = useState<CreateCustomerData>({
    name: "",
    email: "",
    phone: "",
    address: "",
    cpf: "",
  });

  useEffect(() => {
    loadCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchTerm]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const result = await customerApi.getCustomers(
        searchTerm || undefined,
        currentPage,
        ITEMS_PER_PAGE
      );
      setCustomers(result.customers);
      setTotalCustomers(result.total);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
      showSnackbar(
        "Erro ao carregar clientes. Verifique se o servidor está rodando.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string, severity: "success" | "error") => {
    setSnackbar({ open: true, message, severity });
  };
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handlePageChange = (
    _event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    setCurrentPage(value);
  };

  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setFormValues({ name: "", email: "", phone: "", address: "", cpf: "" });
    setOpenDialog(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormValues({
      name: customer.name,
      email: customer.email,
      phone: customer.phone || "",
      address: customer.address || "",
      cpf: customer.cpf || "",
    });
    setOpenDialog(true);
  };

  const handleSaveCustomer = async (values: CreateCustomerData) => {
    try {
      if (editingCustomer) {
        await customerApi.updateCustomer(editingCustomer.id, values);
        showSnackbar("Cliente atualizado com sucesso!", "success");
      } else {
        await customerApi.createCustomer(values);
      }

      setOpenDialog(false);
      await loadCustomers();
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
      showSnackbar(
        error instanceof Error ? error.message : "Erro ao salvar cliente",
        "error"
      );
    }
  };

  const handleDeleteCustomer = (customerId: string) => {
    setCustomerToDelete(customerId);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteCustomer = async () => {
    if (!customerToDelete) return;

    try {
      await customerApi.deleteCustomer(customerToDelete);
      showSnackbar("Cliente deletado com sucesso!", "success");
      setDeleteConfirmOpen(false);
      setCustomerToDelete(null);
      await loadCustomers();
    } catch (error) {
      console.error("Erro ao deletar cliente:", error);
      showSnackbar(
        error instanceof Error ? error.message : "Erro ao deletar cliente",
        "error"
      );
    }
  };

  const handleViewCustomer = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setDetailsOpen(true);

    try {
      const stats = await customerApi.getCustomerStats(customer.id);
      setCustomerStats(stats);
    } catch (error) {
      console.error("Erro ao carregar estatísticas do cliente:", error);
      setCustomerStats(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h4" component="h1">
          Gerenciamento de Clientes
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddCustomer}
        >
          Adicionar Cliente
        </Button>
      </Box>

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Pesquisar clientes"
                placeholder="Nome, email, telefone ou CPF..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <Search sx={{ mr: 1, color: "text.secondary" }} />
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                {totalCustomers} cliente(s) encontrado(s)
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Lista de Clientes */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : customers.length > 0 ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Cliente</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Telefone</TableCell>
                <TableCell>CPF</TableCell>
                <TableCell>Data de Cadastro</TableCell>
                <TableCell align="center">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id} hover>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Avatar sx={{ mr: 2, bgcolor: "primary.main" }}>
                        <Person />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2">
                          {customer.name}
                        </Typography>
                        {customer.address && (
                          <Typography variant="caption" color="text.secondary">
                            {customer.address}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Email
                        sx={{
                          mr: 1,
                          fontSize: "small",
                          color: "text.secondary",
                        }}
                      />
                      {customer.email}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {customer.phone ? (
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Phone
                          sx={{
                            mr: 1,
                            fontSize: "small",
                            color: "text.secondary",
                          }}
                        />
                        {customer.phone}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Não informado
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {customer.cpf || (
                      <Typography variant="body2" color="text.secondary">
                        Não informado
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(customer.createdAt)}</TableCell>
                  <TableCell align="center">
                    <IconButton
                      color="primary"
                      onClick={() => handleViewCustomer(customer)}
                    >
                      <Visibility />
                    </IconButton>
                    <IconButton
                      color="secondary"
                      onClick={() => handleEditCustomer(customer)}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDeleteCustomer(customer.id)}
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <Typography variant="body2" color="text.secondary">
            Nenhum cliente encontrado.
          </Typography>
        </Box>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
      )}

      {/* Dialog de Criar/Editar Cliente */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingCustomer ? "Editar Cliente" : "Adicionar Novo Cliente"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nome *"
                value={formValues.name}
                onChange={(e) =>
                  setFormValues({ ...formValues, name: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email *"
                type="email"
                value={formValues.email}
                onChange={(e) =>
                  setFormValues({ ...formValues, email: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Telefone"
                value={formValues.phone || ""}
                onChange={(e) =>
                  setFormValues({ ...formValues, phone: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="CPF"
                value={formValues.cpf || ""}
                onChange={(e) =>
                  setFormValues({ ...formValues, cpf: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Endereço"
                multiline
                rows={2}
                value={formValues.address || ""}
                onChange={(e) =>
                  setFormValues({ ...formValues, address: e.target.value })
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button
            onClick={() => handleSaveCustomer(formValues)}
            variant="contained"
            disabled={!formValues.name || !formValues.email}
          >
            {editingCustomer ? "Atualizar" : "Criar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja excluir este cliente? Esta ação não pode ser
            desfeita.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancelar</Button>
          <Button
            onClick={confirmDeleteCustomer}
            color="error"
            variant="contained"
          >
            Excluir
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Detalhes do Cliente */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Detalhes do Cliente</DialogTitle>
        <DialogContent>
          {selectedCustomer && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Informações Pessoais
                </Typography>
                <Typography>
                  <strong>Nome:</strong> {selectedCustomer.name}
                </Typography>
                <Typography>
                  <strong>Email:</strong> {selectedCustomer.email}
                </Typography>
                <Typography>
                  <strong>Telefone:</strong>{" "}
                  {selectedCustomer.phone || "Não informado"}
                </Typography>
                <Typography>
                  <strong>CPF:</strong>{" "}
                  {selectedCustomer.cpf || "Não informado"}
                </Typography>
                <Typography>
                  <strong>Endereço:</strong>{" "}
                  {selectedCustomer.address || "Não informado"}
                </Typography>
                <Typography>
                  <strong>Cadastrado em:</strong>{" "}
                  {formatDate(selectedCustomer.createdAt)}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Estatísticas
                </Typography>
                {customerStats ? (
                  <>
                    <Typography>
                      <strong>Total de Pedidos:</strong>{" "}
                      {customerStats.totalOrders}
                    </Typography>
                    <Typography>
                      <strong>Total Gasto:</strong>{" "}
                      {formatCurrency(customerStats.totalSpent)}
                    </Typography>
                    <Typography>
                      <strong>Itens Comprados:</strong>{" "}
                      {customerStats.totalItems}
                    </Typography>
                    <Typography>
                      <strong>Ticket Médio:</strong>{" "}
                      {formatCurrency(customerStats.averageOrderValue)}
                    </Typography>
                    {customerStats.lastOrder && (
                      <Typography>
                        <strong>Último Pedido:</strong>{" "}
                        {formatDate(customerStats.lastOrder)}
                      </Typography>
                    )}
                  </>
                ) : (
                  <CircularProgress size={24} />
                )}
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para feedbacks */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminClientes;
