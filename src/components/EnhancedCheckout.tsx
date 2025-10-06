import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Chip,
} from "@mui/material";
import { LocationOn, Payment, Receipt, CheckCircle } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import * as Store from "../store/index";
import {
  CartItem,
  Order,
  Address,
  CreditCard,
  AppliedCoupon,
  PaymentInfo,
} from "../types";
import AddressManager from "../components/AddressManager";
import CreditCardManager from "../components/CreditCardManager";
import CouponManager from "../components/CouponManager";
import { AddressService } from "../services/addressService";
import { CreditCardService } from "../services/creditCardService";
import { BusinessRulesService } from "../services/businessRulesService";

const steps = [
  { label: "Endereço de Entrega", icon: <LocationOn /> },
  { label: "Pagamento e Cupons", icon: <Payment /> },
  { label: "Revisão do Pedido", icon: <Receipt /> },
];

const EnhancedCheckout: React.FC = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState("");

  // Estados para endereço
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [shippingOption, _setShippingOption] = useState("standard");

  // Estados para pagamento
  const [paymentMethod, _setPaymentMethod] = useState<
    "credit" | "debit" | "pix" | "boleto"
  >("credit");
  const [selectedCreditCards, setSelectedCreditCards] = useState<CreditCard[]>(
    []
  );
  const [cardAmounts, setCardAmounts] = useState<Record<string, number>>({});

  // Estados para cupons
  const [appliedCoupons, setAppliedCoupons] = useState<AppliedCoupon[]>([]);
  const [totalDiscount, setTotalDiscount] = useState(0);

  // Estados para validações
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  const customerId = "current-user"; // Substituir pela ID do usuário logado

  useEffect(() => {
    loadCartAndDefaults();
  }, []);

  const loadCartAndDefaults = () => {
    const cart = Store.getCart();
    setCartItems(cart);

    if (cart.length === 0) {
      navigate("/catalogo");
      return;
    }

    // Carregar endereço padrão
    const defaultAddress = AddressService.getDefaultAddress(customerId);
    if (defaultAddress) {
      setSelectedAddress(defaultAddress);
    }

    // Carregar cartão padrão
    const defaultCard = CreditCardService.getDefaultCreditCard(customerId);
    if (defaultCard) {
      setSelectedCreditCards([defaultCard]);
      setCardAmounts({ [defaultCard.id]: getTotal() });
    }
  };

  const getSubtotal = () => {
    return cartItems.reduce(
      (total, item) => total + item.card.price * item.quantity,
      0
    );
  };

  const getShippingCost = () => {
    const subtotal = getSubtotal();
    const itemCount = cartItems.reduce(
      (total, item) => total + item.quantity,
      0
    );
    return BusinessRulesService.calculateShippingCost(
      subtotal,
      itemCount,
      shippingOption
    );
  };

  const getTotal = () => {
    return getSubtotal() + getShippingCost() - totalDiscount;
  };

  const validateCurrentStep = (): boolean => {
    setErrors([]);
    setWarnings([]);

    switch (activeStep) {
      case 0: // Endereço
        if (!selectedAddress) {
          setErrors(["Selecione um endereço de entrega"]);
          return false;
        }
        break;

      case 1: // Pagamento
        if (paymentMethod === "credit") {
          if (selectedCreditCards.length === 0) {
            setErrors(["Selecione pelo menos um cartão de crédito"]);
            return false;
          }

          const totalAmount = Object.values(cardAmounts).reduce(
            (sum, amount) => sum + amount,
            0
          );
          const orderTotal = getTotal();

          if (Math.abs(totalAmount - orderTotal) > 0.01) {
            setErrors([
              "O valor total dos cartões deve ser igual ao valor do pedido",
            ]);
            return false;
          }
        }
        break;

      case 2: // Revisão
        return validateCompleteOrder();
    }

    return true;
  };

  const validateCompleteOrder = (): boolean => {
    const paymentInfo: PaymentInfo = {
      method: paymentMethod,
      totalAmount: getTotal(),
    };

    if (paymentMethod === "credit") {
      paymentInfo.creditCards = selectedCreditCards.map((card) => ({
        cardId: card.id,
        amount: cardAmounts[card.id] || 0,
      }));
    }

    const validation = BusinessRulesService.validateCheckout(
      cartItems,
      appliedCoupons,
      paymentInfo,
      customerId
    );

    setErrors(validation.errors);
    setWarnings(validation.warnings);

    return validation.isValid;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handlePlaceOrder = async () => {
    if (!validateCompleteOrder()) return;

    setLoading(true);

    try {
      // Simular processamento
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const paymentInfo: PaymentInfo = {
        method: paymentMethod,
        totalAmount: getTotal(),
      };

      if (paymentMethod === "credit") {
        paymentInfo.creditCards = selectedCreditCards.map((card) => ({
          cardId: card.id,
          amount: cardAmounts[card.id] || 0,
        }));
      }

      const deliveryEstimate =
        BusinessRulesService.calculateDeliveryTime(shippingOption);

      const order: Omit<Order, "id"> = {
        customerId,
        items: cartItems,
        subtotal: getSubtotal(),
        discountAmount: totalDiscount,
        shippingCost: getShippingCost(),
        total: getTotal(),
        status: "pending",
        shippingAddress: selectedAddress!,
        paymentInfo,
        appliedCoupons,
        createdAt: new Date().toISOString(),
        estimatedDelivery: new Date(
          Date.now() + deliveryEstimate.estimatedDays * 24 * 60 * 60 * 1000
        ).toISOString(),
      };

      const newOrderId = Store.addOrder(order);
      Store.clearCart();

      setOrderId(newOrderId);
      setOrderComplete(true);
    } catch (error) {
      setErrors(["Erro ao processar pedido. Tente novamente."]);
    } finally {
      setLoading(false);
    }
  };

  const handleCouponsChange = (
    newAppliedCoupons: AppliedCoupon[],
    newTotalDiscount: number
  ) => {
    setAppliedCoupons(newAppliedCoupons);
    setTotalDiscount(newTotalDiscount);

    // Reajustar valores dos cartões se necessário
    if (paymentMethod === "credit" && selectedCreditCards.length === 1) {
      const card = selectedCreditCards[0];
      setCardAmounts({ [card.id]: getTotal() });
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <AddressManager
            customerId={customerId}
            onAddressSelect={setSelectedAddress}
            selectedAddressId={selectedAddress?.id}
            showSelection
          />
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Método de Pagamento
              </Typography>
              <Box sx={{ mb: 3 }}>
                {/* Aqui você pode adicionar seleção de método de pagamento */}
                <Alert severity="info">
                  Método selecionado:{" "}
                  {paymentMethod === "credit"
                    ? "Cartão de Crédito"
                    : paymentMethod}
                </Alert>
              </Box>

              {paymentMethod === "credit" && (
                <CreditCardManager
                  customerId={customerId}
                  onCardSelect={(card) => {
                    setSelectedCreditCards([card]);
                    setCardAmounts({ [card.id]: getTotal() });
                  }}
                  selectedCardId={selectedCreditCards[0]?.id}
                  showSelection
                />
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              <CouponManager
                customerId={customerId}
                orderValue={getSubtotal()}
                onCouponsChange={handleCouponsChange}
              />
            </Grid>
          </Grid>
        );

      case 2:
        return renderOrderReview();

      default:
        return null;
    }
  };

  const renderOrderReview = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <Typography variant="h6" gutterBottom>
          Resumo do Pedido
        </Typography>

        <List>
          {cartItems.map((item) => (
            <ListItem key={item.id} sx={{ px: 0 }}>
              <ListItemText
                primary={
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography variant="body1">
                      {item.card.name} × {item.quantity}
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      R$ {(item.card.price * item.quantity).toFixed(2)}
                    </Typography>
                  </Box>
                }
                secondary={
                  <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
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
        {selectedAddress && (
          <Typography variant="body2">
            {selectedAddress.firstName} {selectedAddress.lastName}
            <br />
            {selectedAddress.address}
            <br />
            {selectedAddress.city}, {selectedAddress.state} -{" "}
            {selectedAddress.zipCode}
            <br />
            {selectedAddress.phone}
          </Typography>
        )}

        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          Forma de Pagamento
        </Typography>
        {paymentMethod === "credit" && selectedCreditCards.length > 0 && (
          <Box>
            {selectedCreditCards.map((card) => (
              <Typography key={card.id} variant="body2">
                {card.cardNumber} - R$ {cardAmounts[card.id]?.toFixed(2)}
              </Typography>
            ))}
          </Box>
        )}

        {appliedCoupons.length > 0 && (
          <>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Cupons Aplicados
            </Typography>
            {appliedCoupons.map((coupon) => (
              <Typography key={coupon.couponId} variant="body2">
                {coupon.code}: -R$ {coupon.discount.toFixed(2)}
              </Typography>
            ))}
          </>
        )}
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Total do Pedido
            </Typography>
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
            >
              <Typography>Subtotal:</Typography>
              <Typography>R$ {getSubtotal().toFixed(2)}</Typography>
            </Box>
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
            >
              <Typography>Frete:</Typography>
              <Typography>R$ {getShippingCost().toFixed(2)}</Typography>
            </Box>
            {totalDiscount > 0 && (
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
              >
                <Typography color="success.main">Desconto:</Typography>
                <Typography color="success.main">
                  -R$ {totalDiscount.toFixed(2)}
                </Typography>
              </Box>
            )}
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="h6" fontWeight="bold">
                Total:
              </Typography>
              <Typography variant="h6" fontWeight="bold" color="primary">
                R$ {getTotal().toFixed(2)}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  if (orderComplete) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <CheckCircle sx={{ fontSize: 80, color: "success.main", mb: 2 }} />
        <Typography variant="h4" gutterBottom>
          Pedido Realizado com Sucesso!
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          ID do Pedido: {orderId}
        </Typography>
        <Typography variant="body1" sx={{ mb: 4 }}>
          Status: <Chip label="Em Aberto" color="warning" />
        </Typography>
        <Typography variant="body1" sx={{ mb: 4 }}>
          Seu pedido foi registrado e está sendo processado. Você receberá
          atualizações sobre o status em breve.
        </Typography>
        <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
          <Button variant="contained" onClick={() => navigate("/meus-pedidos")}>
            Ver Meus Pedidos
          </Button>
          <Button variant="outlined" onClick={() => navigate("/catalogo")}>
            Continuar Comprando
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Finalizar Compra
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((step, index) => (
            <Step key={index}>
              <StepLabel icon={step.icon}>{step.label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {errors.length > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errors.map((error, index) => (
            <div key={index}>{error}</div>
          ))}
        </Alert>
      )}

      {warnings.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {warnings.map((warning, index) => (
            <div key={index}>{warning}</div>
          ))}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>{renderStepContent()}</Paper>

      <Box sx={{ display: "flex", flexDirection: "row", pt: 2 }}>
        <Button
          color="inherit"
          disabled={activeStep === 0}
          onClick={handleBack}
          sx={{ mr: 1 }}
        >
          Voltar
        </Button>
        <Box sx={{ flex: "1 1 auto" }} />
        {activeStep === steps.length - 1 ? (
          <Button
            variant="contained"
            onClick={handlePlaceOrder}
            disabled={loading}
            startIcon={loading && <CircularProgress size={16} />}
          >
            {loading ? "Processando..." : "Finalizar Pedido"}
          </Button>
        ) : (
          <Button variant="contained" onClick={handleNext}>
            Próximo
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default EnhancedCheckout;
