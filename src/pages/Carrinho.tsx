import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  Chip,
  Avatar,
  Alert,
  TextField,
} from '@mui/material';
import { Add, Remove, Delete, ShoppingCart } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getCart, removeFromCart, clearCart } from '../store';
import { CartItem } from '../types';

// Adicionar função para atualizar quantidade no store
const updateQuantityInStore = (itemId: string, newQuantity: number) => {
  const cart = getCart();
  const itemIndex = cart.findIndex(item => item.id === itemId);
  
  if (itemIndex >= 0) {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
    } else {
      cart[itemIndex].quantity = newQuantity;
      localStorage.setItem('cart', JSON.stringify(cart));
      window.dispatchEvent(new CustomEvent('cart:change'));
    }
  }
};

const Carrinho: React.FC = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState('');

  useEffect(() => {
    const loadCart = () => {
      setCartItems(getCart());
    };

    loadCart();

    const handleCartChange = () => loadCart();
    window.addEventListener('cart:change', handleCartChange);

    return () => {
      window.removeEventListener('cart:change', handleCartChange);
    };
  }, []);

  const updateQuantity = (item: CartItem, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(item.id);
    } else if (newQuantity <= item.card.stock) {
      updateQuantityInStore(item.id, newQuantity);
    }
  };

  const getSubtotal = () => {
    return cartItems.reduce((total, item) => total + (item.card.price * item.quantity), 0);
  };

  const getDiscount = () => {
    if (!appliedCoupon) return 0;
    const subtotal = getSubtotal();
    
    if (appliedCoupon.type === 'percentage') {
      return subtotal * (appliedCoupon.discount / 100);
    } else {
      return appliedCoupon.discount;
    }
  };

  const getTotalPrice = () => {
    return getSubtotal() - getDiscount();
  };

  const applyCoupon = () => {
    setCouponError('');
    
    // Simular validação de cupom
    const validCoupons = [
      { code: 'WELCOME10', discount: 10, type: 'percentage' },
      { code: 'SAVE5', discount: 5, type: 'fixed' },
      { code: 'LEGENDARY20', discount: 20, type: 'percentage' }
    ];

    const coupon = validCoupons.find(c => c.code.toLowerCase() === couponCode.toLowerCase());
    
    if (coupon) {
      setAppliedCoupon(coupon);
      setCouponCode('');
    } else {
      setCouponError('Cupom inválido ou expirado');
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  const handleClearCart = () => {
    clearCart();
    setAppliedCoupon(null);
  };

  if (cartItems.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <ShoppingCart sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h4" component="h1" gutterBottom>
          Carrinho de Compras
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
          Seu carrinho está vazio
        </Typography>
        <Button variant="contained" size="large" onClick={() => navigate('/catalogo')}>
          Continuar Comprando
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Carrinho de Compras ({cartItems.reduce((total, item) => total + item.quantity, 0)} itens)
      </Typography>

      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Lista de itens */}
        <Box sx={{ flex: 1 }}>
          <TableContainer component={Paper} sx={{ mb: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Produto</TableCell>
                  <TableCell align="center">Preço</TableCell>
                  <TableCell align="center">Quantidade</TableCell>
                  <TableCell align="center">Subtotal</TableCell>
                  <TableCell align="center">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cartItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar
                          src={item.card.image}
                          variant="rounded"
                          sx={{ width: 60, height: 80 }}
                        >
                          {item.card.name.slice(0, 2)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {item.card.name}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                            <Chip label={item.card.type} size="small" />
                            <Chip 
                              label={item.card.rarity} 
                              size="small" 
                              color={
                                item.card.rarity === 'Legendary' ? 'error' :
                                item.card.rarity === 'Epic' ? 'warning' :
                                item.card.rarity === 'Rare' ? 'secondary' :
                                item.card.rarity === 'Uncommon' ? 'primary' : 'default'
                              }
                            />
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {item.card.description}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body1" fontWeight="bold">
                        R$ {item.card.price.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        <IconButton 
                          size="small" 
                          onClick={() => updateQuantity(item, item.quantity - 1)}
                        >
                          <Remove />
                        </IconButton>
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            minWidth: 40, 
                            textAlign: 'center',
                            fontWeight: 'bold'
                          }}
                        >
                          {item.quantity}
                        </Typography>
                        <IconButton 
                          size="small" 
                          onClick={() => updateQuantity(item, item.quantity + 1)}
                          disabled={item.quantity >= item.card.stock}
                        >
                          <Add />
                        </IconButton>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        Estoque: {item.card.stock}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body1" fontWeight="bold" color="primary">
                        R$ {(item.card.price * item.quantity).toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton 
                        color="error" 
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Resumo do pedido */}
        <Box sx={{ width: { xs: '100%', md: 350 } }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Resumo do Pedido
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              {/* Cupom de desconto */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Cupom de Desconto
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <TextField
                    size="small"
                    placeholder="Digite o cupom"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    disabled={!!appliedCoupon}
                    fullWidth
                  />
                  <Button 
                    variant="outlined" 
                    size="small"
                    onClick={applyCoupon}
                    disabled={!couponCode || !!appliedCoupon}
                  >
                    Aplicar
                  </Button>
                </Box>
                
                {couponError && (
                  <Alert severity="error" sx={{ mb: 1 }}>
                    {couponError}
                  </Alert>
                )}
                
                {appliedCoupon && (
                  <Alert 
                    severity="success" 
                    action={
                      <Button size="small" color="inherit" onClick={removeCoupon}>
                        Remover
                      </Button>
                    }
                  >
                    Cupom {appliedCoupon.code} aplicado!
                  </Alert>
                )}
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              {/* Valores */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Subtotal:</Typography>
                <Typography>R$ {getSubtotal().toFixed(2)}</Typography>
              </Box>
              
              {appliedCoupon && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography color="success.main">
                    Desconto ({appliedCoupon.code}):
                  </Typography>
                  <Typography color="success.main">
                    -R$ {getDiscount().toFixed(2)}
                  </Typography>
                </Box>
              )}
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6" fontWeight="bold">
                  Total:
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="primary">
                  R$ {getTotalPrice().toFixed(2)}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  onClick={handleCheckout}
                >
                  Finalizar Compra
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => navigate('/catalogo')}
                >
                  Continuar Comprando
                </Button>
                <Button
                  variant="text"
                  color="error"
                  size="small"
                  onClick={handleClearCart}
                >
                  Limpar Carrinho
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default Carrinho;