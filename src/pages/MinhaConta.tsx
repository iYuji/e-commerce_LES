import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Avatar,
  Divider,
  Alert,
  Tab,
  Tabs,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
} from "@mui/material";
import {
  Person,
  Email,
  Phone,
  Lock,
  Edit,
  Save,
  Cancel,
  Visibility,
  VisibilityOff,
  LocationOn,
  CreditCard,
  ShoppingBag,
  AccountCircle,
} from "@mui/icons-material";
import * as Store from "../store/index";
import { Customer } from "../types";
import AddressManager from "../components/AddressManager";
import CreditCardManager from "../components/CreditCardManager";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`account-tabpanel-${index}`}
      aria-labelledby={`account-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const MinhaConta: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const [passwordDialog, setPasswordDialog] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    loadCustomerData();
  }, []);

  const loadCustomerData = () => {
    const session = Store.getSession();
    if (session?.user) {
      const currentCustomer = session.user as Customer;
      setCustomer(currentCustomer);
      setFormData({
        name: currentCustomer.name,
        email: currentCustomer.email,
        phone: currentCustomer.phone || "",
      });
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setError("");
    setSuccess("");
  };

  const handleInputChange =
    (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: event.target.value,
      }));
    };

  const handlePasswordInputChange =
    (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setPasswordForm((prev) => ({
        ...prev,
        [field]: event.target.value,
      }));
    };

  const handleSavePersonalData = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      if (!formData.name.trim()) {
        setError("Nome é obrigatório");
        return;
      }

      if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
        setError("Email válido é obrigatório");
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      const customers = Store.getCustomers();
      const customerIndex = customers.findIndex((c) => c.id === customer?.id);

      if (customerIndex !== -1) {
        customers[customerIndex] = {
          ...customers[customerIndex],
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
        };

        Store.writeStore(Store.STORE_KEYS.customers, customers);

        Store.setSession({
          userId: customers[customerIndex].id,
          user: customers[customerIndex],
        });

        setCustomer(customers[customerIndex]);
        setSuccess("Dados atualizados com sucesso!");
        setEditMode(false);
      }
    } catch (err) {
      setError("Erro ao atualizar dados");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      setLoading(true);
      setError("");

      if (
        !passwordForm.currentPassword ||
        !passwordForm.newPassword ||
        !passwordForm.confirmPassword
      ) {
        setError("Preencha todos os campos");
        return;
      }

      if (passwordForm.newPassword.length < 6) {
        setError("A nova senha deve ter no mínimo 6 caracteres");
        return;
      }

      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        setError("As senhas não coincidem");
        return;
      }

      const passwordStore = JSON.parse(
        localStorage.getItem("customer_passwords") || "{}"
      );
      if (passwordStore[customer?.id || ""] !== passwordForm.currentPassword) {
        setError("Senha atual incorreta");
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      passwordStore[customer?.id || ""] = passwordForm.newPassword;
      localStorage.setItem("customer_passwords", JSON.stringify(passwordStore));

      setSuccess("Senha alterada com sucesso!");
      setPasswordDialog(false);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      setError("Erro ao alterar senha");
    } finally {
      setLoading(false);
    }
  };

  const getRecentOrders = () => {
    if (!customer) return [];
    const orders = Store.getOrdersByCustomer(customer.id);
    return orders.slice(0, 5);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!customer) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          Você precisa estar logado para acessar sua conta.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Paper
        sx={{ p: 3, mb: 3, display: "flex", alignItems: "center", gap: 2 }}
      >
        <Avatar
          sx={{
            width: 80,
            height: 80,
            bgcolor: "primary.main",
            fontSize: "2rem",
          }}
        >
          {getInitials(customer.name)}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" gutterBottom>
            {customer.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Membro desde{" "}
            {new Date(customer.createdAt).toLocaleDateString("pt-BR")}
          </Typography>
        </Box>
      </Paper>

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

      {/* Tabs */}
      <Paper>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          <Tab icon={<AccountCircle />} label="Dados Pessoais" />
          <Tab icon={<LocationOn />} label="Endereços" />
          <Tab icon={<CreditCard />} label="Cartões" />
          <Tab icon={<ShoppingBag />} label="Resumo de Pedidos" />
        </Tabs>

        {/* Tab 0: Dados Pessoais */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ p: 3 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
              }}
            >
              <Typography variant="h6">Informações Pessoais</Typography>
              {!editMode ? (
                <Button
                  startIcon={<Edit />}
                  variant="outlined"
                  onClick={() => setEditMode(true)}
                >
                  Editar
                </Button>
              ) : (
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    startIcon={<Cancel />}
                    variant="outlined"
                    onClick={() => {
                      setEditMode(false);
                      loadCustomerData();
                      setError("");
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    startIcon={<Save />}
                    variant="contained"
                    onClick={handleSavePersonalData}
                    disabled={loading}
                  >
                    Salvar
                  </Button>
                </Box>
              )}
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nome Completo"
                  value={formData.name}
                  onChange={handleInputChange("name")}
                  disabled={!editMode}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="E-mail"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange("email")}
                  disabled={!editMode}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Telefone"
                  value={formData.phone}
                  onChange={handleInputChange("phone")}
                  disabled={!editMode}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Phone />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 4 }} />

            <Box>
              <Typography variant="h6" gutterBottom>
                Segurança
              </Typography>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Lock color="action" />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1">Senha</Typography>
                      <Typography variant="body2" color="text.secondary">
                        ••••••••
                      </Typography>
                    </Box>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setPasswordDialog(true)}
                    >
                      Alterar
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </TabPanel>

        {/* Tab 1: Endereços */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ p: 3 }}>
            <AddressManager customerId={customer.id} />
          </Box>
        </TabPanel>

        {/* Tab 2: Cartões */}
        <TabPanel value={activeTab} index={2}>
          <Box sx={{ p: 3 }}>
            <CreditCardManager customerId={customer.id} />
          </Box>
        </TabPanel>

        {/* Tab 3: Resumo de Pedidos */}
        <TabPanel value={activeTab} index={3}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Últimos Pedidos
            </Typography>

            {getRecentOrders().length === 0 ? (
              <Alert severity="info">Você ainda não fez nenhum pedido.</Alert>
            ) : (
              <List>
                {getRecentOrders().map((order) => (
                  <React.Fragment key={order.id}>
                    <ListItem
                      sx={{
                        border: 1,
                        borderColor: "divider",
                        borderRadius: 1,
                        mb: 1,
                      }}
                    >
                      <ListItemIcon>
                        <ShoppingBag color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Typography variant="subtitle1">
                              Pedido #{order.id.slice(-8).toUpperCase()}
                            </Typography>
                            <Chip
                              label={order.status}
                              size="small"
                              color={
                                order.status === "delivered"
                                  ? "success"
                                  : order.status === "cancelled"
                                  ? "error"
                                  : "primary"
                              }
                            />
                          </Box>
                        }
                        secondary={
                          <>
                            <Typography variant="body2" component="span">
                              {new Date(order.createdAt).toLocaleDateString(
                                "pt-BR"
                              )}{" "}
                              • {order.items.length}{" "}
                              {order.items.length === 1 ? "item" : "itens"}
                            </Typography>
                            <Typography
                              variant="body2"
                              component="div"
                              sx={{ mt: 0.5, fontWeight: "bold" }}
                            >
                              Total: R$ {order.total.toFixed(2)}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            )}

            {getRecentOrders().length > 0 && (
              <Box sx={{ mt: 2, textAlign: "center" }}>
                <Button variant="outlined" href="/meus-pedidos">
                  Ver Todos os Pedidos
                </Button>
              </Box>
            )}
          </Box>
        </TabPanel>
      </Paper>

      {/* Diálogo de Alteração de Senha */}
      <Dialog
        open={passwordDialog}
        onClose={() => {
          setPasswordDialog(false);
          setPasswordForm({
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          });
          setError("");
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Alterar Senha</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              fullWidth
              label="Senha Atual"
              type={showPasswords.current ? "text" : "password"}
              value={passwordForm.currentPassword}
              onChange={handlePasswordInputChange("currentPassword")}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() =>
                        setShowPasswords((prev) => ({
                          ...prev,
                          current: !prev.current,
                        }))
                      }
                      edge="end"
                    >
                      {showPasswords.current ? (
                        <VisibilityOff />
                      ) : (
                        <Visibility />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Nova Senha"
              type={showPasswords.new ? "text" : "password"}
              value={passwordForm.newPassword}
              onChange={handlePasswordInputChange("newPassword")}
              helperText="Mínimo 6 caracteres"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() =>
                        setShowPasswords((prev) => ({
                          ...prev,
                          new: !prev.new,
                        }))
                      }
                      edge="end"
                    >
                      {showPasswords.new ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Confirmar Nova Senha"
              type={showPasswords.confirm ? "text" : "password"}
              value={passwordForm.confirmPassword}
              onChange={handlePasswordInputChange("confirmPassword")}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() =>
                        setShowPasswords((prev) => ({
                          ...prev,
                          confirm: !prev.confirm,
                        }))
                      }
                      edge="end"
                    >
                      {showPasswords.confirm ? (
                        <VisibilityOff />
                      ) : (
                        <Visibility />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {error && (
              <Alert severity="error" onClose={() => setError("")}>
                {error}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setPasswordDialog(false);
              setPasswordForm({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
              });
              setError("");
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleChangePassword}
            variant="contained"
            disabled={loading}
          >
            Alterar Senha
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MinhaConta;
