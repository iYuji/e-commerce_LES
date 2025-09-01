import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Badge,
  Box,
  Container,
} from '@mui/material';
import {
  ShoppingCart,
  AccountCircle,
  Brightness4,
  Brightness7,
  SmartToy,
  AdminPanelSettings,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { getCart, getSession } from '../store/index';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [cartCount, setCartCount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [adminMenuAnchor, setAdminMenuAnchor] = useState<null | HTMLElement>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    const updateCartCount = () => {
      const cart = getCart();
      const count = cart.reduce((total, item) => total + item.quantity, 0);
      setCartCount(count);
    };

    const updateAuthStatus = () => {
      const session = getSession();
      setIsLoggedIn(!!session.userId);
    };

    updateCartCount();
    updateAuthStatus();

    const handleCartChange = () => updateCartCount();
    const handleSessionChange = () => updateAuthStatus();

    window.addEventListener('cart:change', handleCartChange);
    window.addEventListener('session:change', handleSessionChange);

    return () => {
      window.removeEventListener('cart:change', handleCartChange);
      window.removeEventListener('session:change', handleSessionChange);
    };
  }, []);

  const handleAdminMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAdminMenuAnchor(event.currentTarget);
  };

  const handleAdminMenuClose = () => {
    setAdminMenuAnchor(null);
  };

  const handleAdminMenuItemClick = (path: string) => {
    navigate(path);
    handleAdminMenuClose();
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    // Here you would implement theme switching logic
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ cursor: 'pointer', fontWeight: 'bold' }}
            onClick={() => navigate('/catalogo')}
          >
            PokéCard Store
          </Typography>

          <Box sx={{ ml: 2 }}>
            <Button color="inherit" onClick={() => navigate('/catalogo')}>
              Catálogo
            </Button>
            <Button 
              color="inherit" 
              onClick={() => navigate('/carrinho')}
              startIcon={
                <Badge badgeContent={cartCount} color="secondary">
                  <ShoppingCart />
                </Badge>
              }
            >
              Carrinho
            </Button>
            {isLoggedIn && (
              <>
                <Button color="inherit" onClick={() => navigate('/meus-pedidos')}>
                  Meus Pedidos
                </Button>
                <Button color="inherit" onClick={() => navigate('/cupons')}>
                  Cupons
                </Button>
                <Button color="inherit" onClick={() => navigate('/minha-conta')}>
                  Minha Conta
                </Button>
              </>
            )}
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          <IconButton color="inherit" onClick={() => navigate('/assistente')}>
            <SmartToy />
          </IconButton>

          <IconButton
            color="inherit"
            onClick={handleAdminMenuClick}
          >
            <AdminPanelSettings />
          </IconButton>
          <Menu
            anchorEl={adminMenuAnchor}
            open={Boolean(adminMenuAnchor)}
            onClose={handleAdminMenuClose}
          >
            <MenuItem onClick={() => handleAdminMenuItemClick('/admin/cartas')}>
              Cartas
            </MenuItem>
            <MenuItem onClick={() => handleAdminMenuItemClick('/admin/clientes')}>
              Clientes
            </MenuItem>
            <MenuItem onClick={() => handleAdminMenuItemClick('/admin/vendas')}>
              Vendas
            </MenuItem>
            <MenuItem onClick={() => handleAdminMenuItemClick('/admin/trocas')}>
              Trocas
            </MenuItem>
            <MenuItem onClick={() => handleAdminMenuItemClick('/admin/estoque')}>
              Estoque
            </MenuItem>
            <MenuItem onClick={() => handleAdminMenuItemClick('/admin/relatorios')}>
              Relatórios
            </MenuItem>
          </Menu>

          <IconButton color="inherit" onClick={toggleTheme}>
            {isDarkMode ? <Brightness7 /> : <Brightness4 />}
          </IconButton>

          <IconButton 
            color="inherit" 
            onClick={() => navigate(isLoggedIn ? '/minha-conta' : '/auth')}
          >
            <AccountCircle />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container component="main" maxWidth="xl" sx={{ flex: 1, py: 3 }}>
        {children}
      </Container>

      <Box 
        component="footer" 
        sx={{ 
          bgcolor: 'background.paper', 
          borderTop: 1, 
          borderColor: 'divider',
          py: 2,
          textAlign: 'center'
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Protótipo • E-commerce TCG
        </Typography>
      </Box>
    </Box>
  );
};

export default Layout;
