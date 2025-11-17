import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Container,
} from "@mui/material";
import {
  AccountCircle,
  AdminPanelSettings,
  LightMode,
  DarkMode,
} from "@mui/icons-material";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { useNavigate } from "react-router-dom";
import { getAppTheme } from "../theme/theme";
import * as Store from "../store/index";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const [adminMenuAnchor, setAdminMenuAnchor] = useState<null | HTMLElement>(
    null
  );
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(
    null
  );
  const [currentTheme, setCurrentTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    // Define tema inicial como escuro se não houver tema salvo
    const savedTheme = Store.getTheme();
    if (!savedTheme || savedTheme === "light") {
      Store.setTheme("dark");
      setCurrentTheme("dark");
    } else {
      setCurrentTheme(savedTheme);
    }
  }, []);

  const handleAdminMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAdminMenuAnchor(event.currentTarget);
  };

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAdminMenuAnchor(null);
    setUserMenuAnchor(null);
  };

  const navigateAndClose = (path: string) => {
    navigate(path);
    handleMenuClose();
  };

  const handleThemeToggle = () => {
    // Alterna diretamente o tema
    const newTheme = currentTheme === "light" ? "dark" : "light";

    Store.setTheme(newTheme);
    setCurrentTheme(newTheme);
  };
  return (
    <ThemeProvider theme={getAppTheme(currentTheme)}>
      <CssBaseline />
      <Box
        sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
      >
        <AppBar position="static">
          <Toolbar>
            <Typography
              variant="h6"
              component="div"
              sx={{ flexGrow: 1, cursor: "pointer" }}
              onClick={() => navigate("/catalogo")}
            >
              PokeCard Store
            </Typography>

            <Button color="inherit" onClick={() => navigate("/catalogo")}>
              Catálogo
            </Button>
            <Button color="inherit" onClick={() => navigate("/carrinho")}>
              Carrinho
            </Button>
            <Button color="inherit" onClick={() => navigate("/trocas")}>
              Trocas
            </Button>
            <Button color="inherit" onClick={() => navigate("/assistente")}>
              Assistente
            </Button>

            {/* Botão para alternar tema */}
            <IconButton
              color="inherit"
              onClick={handleThemeToggle}
              title={`Trocar para tema ${
                currentTheme === "light" ? "escuro" : "claro"
              }`}
            >
              {currentTheme === "light" ? <DarkMode /> : <LightMode />}
            </IconButton>

            <IconButton
              size="large"
              edge="end"
              color="inherit"
              onClick={handleAdminMenuOpen}
            >
              <AdminPanelSettings />
            </IconButton>
            <Menu
              anchorEl={adminMenuAnchor}
              open={Boolean(adminMenuAnchor)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={() => navigateAndClose("/admin/cartas")}>
                Gerenciar Cartas
              </MenuItem>
              <MenuItem onClick={() => navigateAndClose("/admin/clientes")}>
                Gerenciar Clientes
              </MenuItem>
              <MenuItem onClick={() => navigateAndClose("/admin/estoque")}>
                Estoque
              </MenuItem>
              <MenuItem onClick={() => navigateAndClose("/admin/pedidos")}>
                Pedidos
              </MenuItem>
              <MenuItem onClick={() => navigateAndClose("/admin/relatorios")}>
                Relatórios
              </MenuItem>
              <MenuItem onClick={() => navigateAndClose("/admin/trocas")}>
                Trocas Admin
              </MenuItem>
            </Menu>

            <IconButton
              size="large"
              edge="end"
              color="inherit"
              onClick={handleUserMenuOpen}
            >
              <AccountCircle />
            </IconButton>
            <Menu
              anchorEl={userMenuAnchor}
              open={Boolean(userMenuAnchor)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={() => navigateAndClose("/auth")}>
                Login
              </MenuItem>
              <MenuItem onClick={() => navigateAndClose("/minha-conta")}>
                Minha Conta
              </MenuItem>
              <MenuItem onClick={() => navigateAndClose("/meus-pedidos")}>
                Meus Pedidos
              </MenuItem>
              <MenuItem onClick={() => navigateAndClose("/cupons")}>
                Cupons
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        <Container component="main" sx={{ flex: 1, py: 4, px: 3 }}>
          {children}
        </Container>
      </Box>
    </ThemeProvider>
  );
}
