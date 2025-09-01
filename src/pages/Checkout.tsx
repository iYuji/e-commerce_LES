import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  Grid,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Divider,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  CreditCard,
  Security,
  CheckCircle,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getCart, clearCart, addOrder } from '../store';
import { CartItem, Order } from '../types';

const steps = ['Endereço de Entrega', 'Forma de Pagamento', 'Revisão do Pedido'];

interface Address {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
}

interface PaymentInfo {
  method: 'credit' | 'debit' | 'pix' | 'boleto';
  cardNumber?: string;
  cardName?: string;
  expiryDate?: string;
  cvv?: string;
  cpf?: string;
}

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState('');

  // Dados do endereço
  const [address, setAddress] = useState<Address>({
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
  });

  // Dados do pagamento
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({
    method: 'credit',
  });

  // Opções de entrega
  const [shippingOption, setShippingOption] = useState('standard');

  // Validações
  const [addressErrors, setAddressErrors] = useState<Partial<Address>>({});
  const [paymentErrors, setPaymentErrors] = useState<Partial<PaymentInfo>>({});

  useEffect(() => {
    const cart = getCart();
    setCartItems(cart);
    
    if (cart.length === 0) {
      navigate('/catalogo');
    }
  }, [navigate]);

  const validateAddress = (): boolean => {
    const errors: Partial<Address> = {};

    if (!address.firstName.trim()) errors.firstName = 'Nome é obrigatório';
    if (!address.lastName.trim()) errors.lastName = 'Sobrenome é obrigatório';
    if (!address.address.trim()) errors.address = 'Endereço é obrigatório';
    if (!address.city.trim()) errors.city = 'Cidade é obrigatória';
    if (!address.state.trim()) errors.state = 'Estado é obrigatório';
    if (!address.zipCode.trim()) errors.zipCode = 'CEP é obrigatório';
    if (!address.phone.trim()) errors.phone = 'Telefone é obrigatório';

    // Validação de CEP (formato brasileiro)
    if (address.zipCode && !/^\d{5}-?\d{3}$/.test(address.zipCode)) {
      errors.zipCode = 'CEP deve ter o formato 00000-000';
    }

    // Validação de telefone
    if (address.phone && !/^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(address.phone)) {
      errors.phone = 'Telefone deve ter o formato (00) 00000-0000';
    }

    setAddressErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePayment = (): boolean => {
    const errors: Partial<PaymentInfo> = {};

    if (paymentInfo.method === 'credit' || paymentInfo.method === 'debit') {
      if (!paymentInfo.cardNumber?.trim()) errors.cardNumber = 'Número do cartão é obrigatório';
      if (!paymentInfo.cardName?.trim()) errors.cardName = 'Nome no cartão é obrigatório';
      if (!paymentInfo.expiryDate?.trim()) errors.expiryDate = 'Data de validade é obrigatória';
      if (!paymentInfo.cvv?.trim()) errors.cvv = 'CVV é obrigatório';

      // Validação de cartão de crédito
      if (paymentInfo.cardNumber && !/^\d{4}\s\d{4}\s\d{4}\s\d{4}$/.test(paymentInfo.cardNumber)) {
        errors.cardNumber = 'Cartão deve ter o formato 0000 0000 0000 0000';
      }

      // Validação de data de validade
      if (paymentInfo.expiryDate && !/^\d{2}\/\d{2}$/.test(paymentInfo.expiryDate)) {
        errors.expiryDate = 'Data deve ter o formato MM/AA';
      }

      // Validação de CVV
      if (paymentInfo.cvv && !/^\d{3,4}$/.test(paymentInfo.cvv)) {
        errors.cvv = 'CVV deve ter 3 ou 4 dígitos';
      }
    }

    if (paymentInfo.method === 'pix' || paymentInfo.method === 'boleto') {
      if (!paymentInfo.cpf?.trim()) errors.cpf = 'CPF é obrigatório';
      
      // Validação de CPF
      if (paymentInfo.cpf && !/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(paymentInfo.cpf)) {
        errors.cpf = 'CPF deve ter o formato 000.000.000-00';
      }
    }

    setPaymentErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + (item.card.price * item.quantity), 0);
  };

  const getShippingCost = () => {
    switch (shippingOption) {
      case 'express': return 15.00;
      case 'premium': return 25.00;
      default: return 8.50;
    }
  };

  const calculateTotal = () => {
    return calculateSubtotal() + getShippingCost();
  };

  const handleNext = () => {
    if (activeStep === 0 && !validateAddress()) return;
    if (activeStep === 1 && !validatePayment()) return;
    
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    
    // Simular processamento do pagamento
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const order: Omit<Order, 'id'> = {
      customerId: 'current-user', // Substituir pela ID do usuário atual
      items: cartItems,
      total: calculateTotal(),
      status: 'processing',
      shippingAddress: address,
      paymentMethod: paymentInfo.method,
      createdAt: new Date().toISOString(),
      estimatedDelivery: new Date(Date.now() + (shippingOption === 'express' ? 1 : shippingOption === 'premium' ? 0.5 : 3) * 24 * 60 * 60 * 1000).toISOString(),
    };

    const newOrderId = addOrder(order);
    clearCart();
    setOrderId(newOrderId);
    setOrderComplete(true);
    setLoading(false);
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatCPF = (value: string) => {
    const v = value.replace(/\D/g, '');
    return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatPhone = (value: string) => {
    const v = value.replace(/\D/g, '');
    return v.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3');
  };

  const formatZipCode = (value: string) => {
    const v = value.replace(/\D/g, '');
    return v.replace(/(\d{5})(\d{3})/, '$1-$2');
  };

  if (orderComplete) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
        <Typography variant="h4" gutterBottom>
          Pedido Realizado com Sucesso!
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Número do Pedido: {orderId}
        </Typography>
        <Typography variant="body1" sx={{ mb: 4 }}>
          Você receberá um e-mail de confirmação em breve com os detalhes do seu pedido.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button variant="contained" onClick={() => navigate('/meus-pedidos')}>
            Ver Meus Pedidos
          </Button>
          <Button variant="outlined" onClick={() => navigate('/catalogo')}>
            Continuar Comprando
          </Button>
        </Box>
      </Box>
    );
  }

  const renderAddressForm = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6}>
        <TextField
          required
          fullWidth
          label="Nome"
          value={address.firstName}
          onChange={(e) => setAddress({ ...address, firstName: e.target.value })}
          error={!!addressErrors.firstName}
          helperText={addressErrors.firstName}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          required
          fullWidth
          label="Sobrenome"
          value={address.lastName}
          onChange={(e) => setAddress({ ...address, lastName: e.target.value })}
          error={!!addressErrors.lastName}
          helperText={addressErrors.lastName}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          required
          fullWidth
          label="Endereço"
          value={address.address}
          onChange={(e) => setAddress({ ...address, address: e.target.value })}
          error={!!addressErrors.address}
          helperText={addressErrors.address}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          required
          fullWidth
          label="Cidade"
          value={address.city}
          onChange={(e) => setAddress({ ...address, city: e.target.value })}
          error={!!addressErrors.city}
          helperText={addressErrors.city}
        />
      </Grid>
      <Grid item xs={12} sm={3}>
        <TextField
          required
          fullWidth
          label="Estado"
          value={address.state}
          onChange={(e) => setAddress({ ...address, state: e.target.value })}
          error={!!addressErrors.state}
          helperText={addressErrors.state}
        />
      </Grid>
      <Grid item xs={12} sm={3}>
        <TextField
          required
          fullWidth
          label="CEP"
          value={address.zipCode}
          onChange={(e) => setAddress({ ...address, zipCode: formatZipCode(e.target.value) })}
          error={!!addressErrors.zipCode}
          helperText={addressErrors.zipCode}
          inputProps={{ maxLength: 9 }}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          required
          fullWidth
          label="Telefone"
          value={address.phone}
          onChange={(e) => setAddress({ ...address, phone: formatPhone(e.target.value) })}
          error={!!addressErrors.phone}
          helperText={addressErrors.phone}
          inputProps={{ maxLength: 15 }}
        />
      </Grid>
    </Grid>
  );

  const renderPaymentForm = () => (
    <Box>
      <FormControl component="fieldset" sx={{ mb: 3 }}>
        <FormLabel component="legend">Forma de Pagamento</FormLabel>
        <RadioGroup
          value={paymentInfo.method}
          onChange={(e) => setPaymentInfo({ ...paymentInfo, method: e.target.value as any })}
        >
          <FormControlLabel value="credit" control={<Radio />} label="Cartão de Crédito" />
          <FormControlLabel value="debit" control={<Radio />} label="Cartão de Débito" />
          <FormControlLabel value="pix" control={<Radio />} label="PIX" />
          <FormControlLabel value="boleto" control={<Radio />} label="Boleto Bancário" />
        </RadioGroup>
      </FormControl>

      {(paymentInfo.method === 'credit' || paymentInfo.method === 'debit') && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              label="Número do Cartão"
              value={paymentInfo.cardNumber || ''}
              onChange={(e) => setPaymentInfo({ 
                ...paymentInfo, 
                cardNumber: formatCardNumber(e.target.value) 
              })}
              error={!!paymentErrors.cardNumber}
              helperText={paymentErrors.cardNumber}
              inputProps={{ maxLength: 19 }}
              InputProps={{
                startAdornment: <CreditCard sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              label="Nome no Cartão"
              value={paymentInfo.cardName || ''}
              onChange={(e) => setPaymentInfo({ ...paymentInfo, cardName: e.target.value })}
              error={!!paymentErrors.cardName}
              helperText={paymentErrors.cardName}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              label="Data de Validade"
              placeholder="MM/AA"
              value={paymentInfo.expiryDate || ''}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                const formatted = value.replace(/(\d{2})(\d{2})/, '$1/$2');
                setPaymentInfo({ ...paymentInfo, expiryDate: formatted });
              }}
              error={!!paymentErrors.expiryDate}
              helperText={paymentErrors.expiryDate}
              inputProps={{ maxLength: 5 }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              label="CVV"
              value={paymentInfo.cvv || ''}
              onChange={(e) => setPaymentInfo({ 
                ...paymentInfo, 
                cvv: e.target.value.replace(/\D/g, '') 
              })}
              error={!!paymentErrors.cvv}
              helperText={paymentErrors.cvv}
              inputProps={{ maxLength: 4 }}
              InputProps={{
                startAdornment: <Security sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
        </Grid>
      )}

      {(paymentInfo.method === 'pix' || paymentInfo.method === 'boleto') && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              label="CPF"
              value={paymentInfo.cpf || ''}
              onChange={(e) => setPaymentInfo({ 
                ...paymentInfo, 
                cpf: formatCPF(e.target.value) 
              })}
              error={!!paymentErrors.cpf}
              helperText={paymentErrors.cpf}
              inputProps={{ maxLength: 14 }}
            />
          </Grid>
          {paymentInfo.method === 'pix' && (
            <Grid item xs={12}>
              <Alert severity="info">
                Após confirmar o pedido, você receberá o código PIX para pagamento.
              </Alert>
            </Grid>
          )}
          {paymentInfo.method === 'boleto' && (
            <Grid item xs={12}>
              <Alert severity="info">
                O boleto será enviado por e-mail e poderá ser pago em qualquer banco.
              </Alert>
            </Grid>
          )}
        </Grid>
      )}

      <Divider sx={{ my: 3 }} />

      <FormControl component="fieldset">
        <FormLabel component="legend">Opções de Entrega</FormLabel>
        <RadioGroup
          value={shippingOption}
          onChange={(e) => setShippingOption(e.target.value)}
        >
          <FormControlLabel 
            value="standard" 
            control={<Radio />} 
            label="Entrega Padrão (3-5 dias úteis) - R$ 8,50" 
          />
          <FormControlLabel 
            value="express" 
            control={<Radio />} 
            label="Entrega Expressa (1-2 dias úteis) - R$ 15,00" 
          />
          <FormControlLabel 
            value="premium" 
            control={<Radio />} 
            label="Entrega Premium (24 horas) - R$ 25,00" 
          />
        </RadioGroup>
      </FormControl>
    </Box>
  );

  const renderOrderReview = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <Typography variant="h6" gutterBottom>
          Resumo do Pedido
        </Typography>
        <List>
          {cartItems.map((item) => (
            <ListItem key={item.card.id} sx={{ px: 0 }}>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body1">
                      {item.card.name} × {item.quantity}
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      R$ {(item.card.price * item.quantity).toFixed(2)}
                    </Typography>
                  </Box>
                }
                secondary={
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Chip label={item.card.type} size="small" />
                    <Chip label={item.card.rarity} size="small" />
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>

        <Divider sx={{ my: 2 }} />

        <Typography variant="h6" gutterBottom>
          Endereço de Entrega
        </Typography>
        <Typography variant="body2">
          {address.firstName} {address.lastName}<br />
          {address.address}<br />
          {address.city}, {address.state} - {address.zipCode}<br />
          {address.phone}
        </Typography>

        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          Forma de Pagamento
        </Typography>
        <Typography variant="body2">
          {paymentInfo.method === 'credit' && 'Cartão de Crédito'}
          {paymentInfo.method === 'debit' && 'Cartão de Débito'}
          {paymentInfo.method === 'pix' && 'PIX'}
          {paymentInfo.method === 'boleto' && 'Boleto Bancário'}
          {paymentInfo.cardNumber && ` - **** **** **** ${paymentInfo.cardNumber.slice(-4)}`}
        </Typography>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Total do Pedido
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography>Subtotal:</Typography>
              <Typography>R$ {calculateSubtotal().toFixed(2)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography>Frete:</Typography>
              <Typography>R$ {getShippingCost().toFixed(2)}</Typography>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6">Total:</Typography>
              <Typography variant="h6" color="primary">
                R$ {calculateTotal().toFixed(2)}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Finalizar Pedido
      </Typography>

      <Stepper activeStep={activeStep} sx={{ pt: 3, pb: 5 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Paper sx={{ p: 3 }}>
        {activeStep === 0 && renderAddressForm()}
        {activeStep === 1 && renderPaymentForm()}
        {activeStep === 2 && renderOrderReview()}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
          {activeStep !== 0 && (
            <Button onClick={handleBack} sx={{ mr: 1 }}>
              Voltar
            </Button>
          )}
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handlePlaceOrder}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : undefined}
            >
              {loading ? 'Processando...' : 'Finalizar Pedido'}
            </Button>
          ) : (
            <Button variant="contained" onClick={handleNext}>
              Próximo
            </Button>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default Checkout;