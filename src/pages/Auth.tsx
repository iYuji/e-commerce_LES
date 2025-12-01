import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Tabs,
  Tab,
  Alert,
  Divider,
  IconButton,
  InputAdornment,
  Link,
  Grid,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Google,
  Facebook,
  Login,
  PersonAdd,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import * as Store from "../store/index";
import { Customer } from "../types";

interface LoginForm {
  email: string;
  password: string;
}

interface RegisterForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
}

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [loginForm, setLoginForm] = useState<LoginForm>({
    email: "",
    password: "",
  });

  const [registerForm, setRegisterForm] = useState<RegisterForm>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });

  const [loginErrors, setLoginErrors] = useState<Partial<LoginForm>>({});
  const [registerErrors, setRegisterErrors] = useState<Partial<RegisterForm>>(
    {}
  );

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 6;
  };

  const validateLogin = (): boolean => {
    const errors: Partial<LoginForm> = {};

    if (!loginForm.email.trim()) {
      errors.email = "E-mail é obrigatório";
    } else if (!validateEmail(loginForm.email)) {
      errors.email = "E-mail inválido";
    }

    if (!loginForm.password.trim()) {
      errors.password = "Senha é obrigatória";
    }

    setLoginErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateRegister = (): boolean => {
    const errors: Partial<RegisterForm> = {};

    if (!registerForm.firstName.trim()) {
      errors.firstName = "Nome é obrigatório";
    }

    if (!registerForm.lastName.trim()) {
      errors.lastName = "Sobrenome é obrigatório";
    }

    if (!registerForm.email.trim()) {
      errors.email = "E-mail é obrigatório";
    } else if (!validateEmail(registerForm.email)) {
      errors.email = "E-mail inválido";
    }

    if (!registerForm.password.trim()) {
      errors.password = "Senha é obrigatória";
    } else if (!validatePassword(registerForm.password)) {
      errors.password = "Senha deve ter pelo menos 6 caracteres";
    }

    if (!registerForm.confirmPassword.trim()) {
      errors.confirmPassword = "Confirmação de senha é obrigatória";
    } else if (registerForm.password !== registerForm.confirmPassword) {
      errors.confirmPassword = "Senhas não coincidem";
    }

    if (
      registerForm.phone &&
      !/^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(registerForm.phone)
    ) {
      errors.phone = "Telefone deve ter o formato (00) 00000-0000";
    }

    setRegisterErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateLogin()) return;

    setLoading(true);
    setError("");

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const customers = Store.getCustomers();
      const passwordStore = JSON.parse(
        localStorage.getItem("customer_passwords") || "{}"
      );

      const customer = customers.find((c) => c.email === loginForm.email);

      if (!customer || passwordStore[customer.id] !== loginForm.password) {
        setError("E-mail ou senha incorretos");
        return;
      }

      Store.setSession({
        userId: customer.id,
        user: customer,
      });

      setSuccess("Login realizado com sucesso!");
      setTimeout(() => {
        navigate("/catalogo");
      }, 1000);
    } catch (err) {
      setError("Erro ao fazer login. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateRegister()) return;

    setLoading(true);
    setError("");

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const customers = Store.getCustomers();

      if (customers.some((c) => c.email === registerForm.email)) {
        setError("Este e-mail já está cadastrado");
        return;
      }

      const newCustomer: Customer = {
        id: `customer_${Date.now()}`,
        name: `${registerForm.firstName} ${registerForm.lastName}`,
        email: registerForm.email,
        phone: registerForm.phone,
        createdAt: new Date().toISOString(),
      };

      customers.push(newCustomer);
      Store.writeStore(Store.STORE_KEYS.customers, customers);

      // Salvar senha separadamente (simulação de hash)
      const passwordStore = JSON.parse(
        localStorage.getItem("customer_passwords") || "{}"
      );
      passwordStore[newCustomer.id] = registerForm.password;
      localStorage.setItem("customer_passwords", JSON.stringify(passwordStore));

      setSuccess(
        "Cadastro realizado com sucesso! Faça o login para continuar."
      );
      setActiveTab(0);

      setLoginForm({
        email: registerForm.email,
        password: "",
      });

      setRegisterForm({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
        phone: "",
      });
    } catch (err) {
      setError("Erro ao criar conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    setLoading(true);
    setError("");

    setTimeout(() => {
      setSuccess(`Login com ${provider} realizado com sucesso!`);
      setTimeout(() => {
        navigate("/catalogo");
      }, 1000);
    }, 1500);
  };

  const formatPhone = (value: string) => {
    const v = value.replace(/\D/g, "");
    return v.replace(/(\d{2})(\d{4,5})(\d{4})/, "($1) $2-$3");
  };

  return (
    <Box
      sx={{
        minHeight: "80vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: 4,
      }}
    >
      <Paper sx={{ width: "100%", maxWidth: 450, p: 4 }}>
        <Typography variant="h4" component="h1" align="center" gutterBottom>
          Portal do Cliente
        </Typography>

        <Typography
          variant="body2"
          align="center"
          color="text.secondary"
          sx={{ mb: 3 }}
        >
          Acesse sua conta ou crie uma nova para continuar suas compras
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          centered
        >
          <Tab label="Entrar" icon={<Login />} />
          <Tab label="Cadastrar" icon={<PersonAdd />} />
        </Tabs>

        <Box sx={{ mt: 3 }}>
          {activeTab === 0 ? (
            <Box component="form" onSubmit={handleLogin}>
              <TextField
                fullWidth
                label="E-mail"
                type="email"
                value={loginForm.email}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, email: e.target.value })
                }
                error={!!loginErrors.email}
                helperText={loginErrors.email}
                sx={{ mb: 2 }}
                autoComplete="email"
              />

              <TextField
                fullWidth
                label="Senha"
                type={showPassword ? "text" : "password"}
                value={loginForm.password}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, password: e.target.value })
                }
                error={!!loginErrors.password}
                helperText={loginErrors.password}
                sx={{ mb: 3 }}
                autoComplete="current-password"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mb: 2 }}
              >
                {loading ? "Entrando..." : "Entrar"}
              </Button>

              <Link
                component="button"
                variant="body2"
                sx={{ display: "block", textAlign: "center", mb: 2 }}
                onClick={() =>
                  setError(
                    "Funcionalidade de recuperação de senha ainda não implementada"
                  )
                }
              >
                Esqueceu sua senha?
              </Link>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleRegister}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Nome"
                    value={registerForm.firstName}
                    onChange={(e) =>
                      setRegisterForm({
                        ...registerForm,
                        firstName: e.target.value,
                      })
                    }
                    error={!!registerErrors.firstName}
                    helperText={registerErrors.firstName}
                    autoComplete="given-name"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Sobrenome"
                    value={registerForm.lastName}
                    onChange={(e) =>
                      setRegisterForm({
                        ...registerForm,
                        lastName: e.target.value,
                      })
                    }
                    error={!!registerErrors.lastName}
                    helperText={registerErrors.lastName}
                    autoComplete="family-name"
                  />
                </Grid>
              </Grid>

              <TextField
                fullWidth
                label="E-mail"
                type="email"
                value={registerForm.email}
                onChange={(e) =>
                  setRegisterForm({ ...registerForm, email: e.target.value })
                }
                error={!!registerErrors.email}
                helperText={registerErrors.email}
                sx={{ mt: 2 }}
                autoComplete="email"
              />

              <TextField
                fullWidth
                label="Telefone (opcional)"
                value={registerForm.phone}
                onChange={(e) =>
                  setRegisterForm({
                    ...registerForm,
                    phone: formatPhone(e.target.value),
                  })
                }
                error={!!registerErrors.phone}
                helperText={registerErrors.phone}
                sx={{ mt: 2 }}
                inputProps={{ maxLength: 15 }}
                autoComplete="tel"
              />

              <TextField
                fullWidth
                label="Senha"
                type={showPassword ? "text" : "password"}
                value={registerForm.password}
                onChange={(e) =>
                  setRegisterForm({ ...registerForm, password: e.target.value })
                }
                error={!!registerErrors.password}
                helperText={registerErrors.password}
                sx={{ mt: 2 }}
                autoComplete="new-password"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Confirmar Senha"
                type={showConfirmPassword ? "text" : "password"}
                value={registerForm.confirmPassword}
                onChange={(e) =>
                  setRegisterForm({
                    ...registerForm,
                    confirmPassword: e.target.value,
                  })
                }
                error={!!registerErrors.confirmPassword}
                helperText={registerErrors.confirmPassword}
                sx={{ mt: 2, mb: 3 }}
                autoComplete="new-password"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        edge="end"
                      >
                        {showConfirmPassword ? (
                          <VisibilityOff />
                        ) : (
                          <Visibility />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mb: 2 }}
              >
                {loading ? "Criando conta..." : "Criar Conta"}
              </Button>
            </Box>
          )}

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">
              ou continue com
            </Typography>
          </Divider>

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Google />}
                onClick={() => handleSocialLogin("Google")}
                disabled={loading}
              >
                Google
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Facebook />}
                onClick={() => handleSocialLogin("Facebook")}
                disabled={loading}
              >
                Facebook
              </Button>
            </Grid>
          </Grid>

          <Typography
            variant="body2"
            align="center"
            color="text.secondary"
            sx={{ mt: 3 }}
          >
            Para testar o login, use:
            <br />
            <strong>E-mail:</strong> usuario@example.com
            <br />
            <strong>Senha:</strong> 123456
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default Auth;
