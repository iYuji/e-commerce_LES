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
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import {
  CreditCard,
  Security,
  CheckCircle,
  Delete,
  Add,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import * as Store from "../store/index";
import {
  CartItem,
  Order,
  Address as AddressType,
  Coupon,
  CreditCardPayment,
} from "../types";
import AddressManager from "../components/AddressManager";
import CreditCardManager from "../components/CreditCardManager";

const steps = [
  "Endereço de Entrega",
  "Forma de Pagamento",
  "Revisão do Pedido",
];

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
  method: "credit" | "debit" | "pix" | "boleto";
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
  const [orderId, setOrderId] = useState("");
  const [customerId, setCustomerId] = useState<string>("");

  // Cupons aplicados (carregados do carrinho)
  const [appliedPromotionalCoupon, setAppliedPromotionalCoupon] =
    useState<Coupon | null>(null);
  const [appliedExchangeCoupons, setAppliedExchangeCoupons] = useState<
    Coupon[]
  >([]);

  // Modo de entrada de endereço: 'select' ou 'manual'
  const [addressMode, setAddressMode] = useState<"select" | "manual">("select");
  const [selectedAddress, setSelectedAddress] = useState<AddressType | null>(
    null
  );

  // Dados do endereço manual
  const [address, setAddress] = useState<Address>({
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
  });

  // Dados do pagamento
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({
    method: "credit",
  });

  // Modo de seleção de cartão: 'select', 'manual' ou 'multiple'
  const [cardMode, setCardMode] = useState<"select" | "manual" | "multiple">(
    "select"
  );
  const [selectedCards, setSelectedCards] = useState<CreditCardPayment[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string>("");

  // Opções de entrega
  const [shippingOption, setShippingOption] = useState("standard");

  // Validações
  const [addressErrors, setAddressErrors] = useState<Partial<Address>>({});
  const [paymentErrors, setPaymentErrors] = useState<Partial<PaymentInfo>>({});

  useEffect(() => {
    const cart = Store.getCart();
    setCartItems(cart);

    if (cart.length === 0) {
      navigate("/catalogo");
    }

    // Obter customer ID da sessão
    const session = Store.getSession();
    if (session?.user?.id) {
      setCustomerId(session.user.id);
    }

    // Carregar cupons aplicados do localStorage
    const savedCoupons = localStorage.getItem("appliedCoupons");
    if (savedCoupons) {
      const { promotional, exchange } = JSON.parse(savedCoupons);
      setAppliedPromotionalCoupon(promotional);
      setAppliedExchangeCoupons(exchange || []);
    }
  }, [navigate]);

  const validateAddress = (): boolean => {
    const errors: Partial<Address> = {};

    // Se estiver em modo de seleção, verificar se um endereço foi selecionado
    if (addressMode === "select") {
      if (!selectedAddress) {
        alert(
          "Por favor, selecione um endereço ou escolha digitar manualmente."
        );
        return false;
      }
      return true;
    }

    // Validação para modo manual
    if (!address.firstName.trim()) errors.firstName = "Nome é obrigatório";
    if (!address.lastName.trim()) errors.lastName = "Sobrenome é obrigatório";
    if (!address.address.trim()) errors.address = "Endereço é obrigatório";
    if (!address.city.trim()) errors.city = "Cidade é obrigatória";
    if (!address.state.trim()) errors.state = "Estado é obrigatório";
    if (!address.zipCode.trim()) errors.zipCode = "CEP é obrigatório";
    if (!address.phone.trim()) errors.phone = "Telefone é obrigatório";

    // Validação de CEP (formato brasileiro)
    if (address.zipCode && !/^\d{5}-?\d{3}$/.test(address.zipCode)) {
      errors.zipCode = "CEP deve ter o formato 00000-000";
    }

    // Validação de telefone
    if (address.phone && !/^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(address.phone)) {
      errors.phone = "Telefone deve ter o formato (00) 00000-0000";
    }

    setAddressErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePayment = (): boolean => {
    const errors: Partial<PaymentInfo> = {};

    // Validação para cartão de crédito
    if (paymentInfo.method === "credit") {
      // Se está no modo de seleção, verificar se há cartão selecionado
      if (cardMode === "select") {
        if (selectedCards.length === 0) {
          alert(
            "Por favor, selecione um cartão ou escolha outra opção de pagamento."
          );
          return false;
        }
        return true; // Cartão selecionado, validação OK
      }

      // Se está no modo múltiplos cartões, verificar se há cartões adicionados
      if (cardMode === "multiple") {
        if (selectedCards.length === 0) {
          alert("Por favor, adicione pelo menos um cartão ao pagamento.");
          return false;
        }
        // Verificar se a soma dos valores dos cartões cobre o total
        const totalPaid = selectedCards.reduce(
          (sum, card) => sum + card.amount,
          0
        );
        const orderTotal =
          calculateSubtotal() + getShippingCost() - calculateTotalDiscount();
        if (Math.abs(totalPaid - orderTotal) > 0.01) {
          alert(
            `O total dos cartões (R$ ${totalPaid.toFixed(
              2
            )}) deve ser igual ao valor do pedido (R$ ${orderTotal.toFixed(2)})`
          );
          return false;
        }
        return true;
      }

      // Modo manual - validar campos
      if (cardMode === "manual") {
        if (!paymentInfo.cardNumber?.trim())
          errors.cardNumber = "Número do cartão é obrigatório";
        if (!paymentInfo.cardName?.trim())
          errors.cardName = "Nome no cartão é obrigatório";
        if (!paymentInfo.expiryDate?.trim())
          errors.expiryDate = "Data de validade é obrigatória";
        if (!paymentInfo.cvv?.trim()) errors.cvv = "CVV é obrigatório";

        // Validação de formato do cartão
        if (
          paymentInfo.cardNumber &&
          !/^\d{4}\s\d{4}\s\d{4}\s\d{4}$/.test(paymentInfo.cardNumber)
        ) {
          errors.cardNumber = "Cartão deve ter o formato 0000 0000 0000 0000";
        }

        // Validação de data de validade
        if (
          paymentInfo.expiryDate &&
          !/^\d{2}\/\d{2}$/.test(paymentInfo.expiryDate)
        ) {
          errors.expiryDate = "Data deve ter o formato MM/AA";
        }

        // Validação de CVV
        if (paymentInfo.cvv && !/^\d{3,4}$/.test(paymentInfo.cvv)) {
          errors.cvv = "CVV deve ter 3 ou 4 dígitos";
        }
      }
    }

    // Validação para cartão de débito (sempre manual)
    if (paymentInfo.method === "debit") {
      if (!paymentInfo.cardNumber?.trim())
        errors.cardNumber = "Número do cartão é obrigatório";
      if (!paymentInfo.cardName?.trim())
        errors.cardName = "Nome no cartão é obrigatório";
      if (!paymentInfo.expiryDate?.trim())
        errors.expiryDate = "Data de validade é obrigatória";
      if (!paymentInfo.cvv?.trim()) errors.cvv = "CVV é obrigatório";

      // Validação de formato do cartão
      if (
        paymentInfo.cardNumber &&
        !/^\d{4}\s\d{4}\s\d{4}\s\d{4}$/.test(paymentInfo.cardNumber)
      ) {
        errors.cardNumber = "Cartão deve ter o formato 0000 0000 0000 0000";
      }

      // Validação de data de validade
      if (
        paymentInfo.expiryDate &&
        !/^\d{2}\/\d{2}$/.test(paymentInfo.expiryDate)
      ) {
        errors.expiryDate = "Data deve ter o formato MM/AA";
      }

      // Validação de CVV
      if (paymentInfo.cvv && !/^\d{3,4}$/.test(paymentInfo.cvv)) {
        errors.cvv = "CVV deve ter 3 ou 4 dígitos";
      }
    }

    if (paymentInfo.method === "pix" || paymentInfo.method === "boleto") {
      if (!paymentInfo.cpf?.trim()) errors.cpf = "CPF é obrigatório";

      // Validação de CPF
      if (
        paymentInfo.cpf &&
        !/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(paymentInfo.cpf)
      ) {
        errors.cpf = "CPF deve ter o formato 000.000.000-00";
      }
    }

    setPaymentErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const calculateSubtotal = () => {
    return cartItems.reduce(
      (total, item) => total + item.card.price * item.quantity,
      0
    );
  };

  const getShippingCost = () => {
    switch (shippingOption) {
      case "express":
        return 15.0;
      case "premium":
        return 25.0;
      default:
        return 8.5;
    }
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
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Determinar qual endereço usar
    const shippingAddress: AddressType =
      addressMode === "select" && selectedAddress
        ? selectedAddress
        : {
            id: `temp-${Date.now()}`,
            customerId: customerId || "guest",
            ...address,
          };

    // Calcular valores
    const subtotal = calculateSubtotal();
    const shippingCost = getShippingCost();
    const discountAmount = calculateTotalDiscount();
    const total = subtotal + shippingCost - discountAmount;

    // Preparar cupons aplicados
    const appliedCoupons = [
      ...(appliedPromotionalCoupon
        ? [
            {
              couponId: appliedPromotionalCoupon.id,
              code: appliedPromotionalCoupon.code,
              discount: appliedPromotionalCoupon.discount,
              type: appliedPromotionalCoupon.type,
              category: appliedPromotionalCoupon.category,
            },
          ]
        : []),
      ...appliedExchangeCoupons.map((c) => ({
        couponId: c.id,
        code: c.code,
        discount: c.discount,
        type: c.type,
        category: c.category,
      })),
    ];

    const order: Omit<Order, "id"> = {
      customerId: customerId || "guest",
      items: cartItems,
      subtotal,
      discountAmount,
      shippingCost,
      total,
      status: "pending",
      shippingAddress,
      paymentInfo: {
        method: paymentInfo.method,
        creditCards: selectedCards.length > 0 ? selectedCards : undefined,
        totalAmount: total,
      },
      appliedCoupons,
      createdAt: new Date().toISOString(),
      estimatedDelivery: new Date(
        Date.now() +
          (shippingOption === "express"
            ? 1
            : shippingOption === "premium"
            ? 0.5
            : 3) *
            24 *
            60 *
            60 *
            1000
      ).toISOString(),
    };

    const newOrderId = Store.addOrder(order);
    Store.clearCart();
    localStorage.removeItem("appliedCoupons"); // Limpar cupons aplicados
    setOrderId(newOrderId);
    setOrderComplete(true);
    setLoading(false);
  };

  const calculateTotalDiscount = () => {
    let totalDiscount = 0;
    const subtotal = calculateSubtotal();

    // Aplicar cupons de troca
    appliedExchangeCoupons.forEach((coupon) => {
      if (coupon.type === "percentage") {
        totalDiscount += (subtotal * coupon.discount) / 100;
      } else {
        totalDiscount += coupon.discount;
      }
    });

    // Aplicar cupom promocional
    if (appliedPromotionalCoupon) {
      if (appliedPromotionalCoupon.type === "percentage") {
        totalDiscount += (subtotal * appliedPromotionalCoupon.discount) / 100;
      } else {
        totalDiscount += appliedPromotionalCoupon.discount;
      }
    }

    return totalDiscount;
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(" ");
    } else {
      return v;
    }
  };

  const formatCPF = (value: string) => {
    const v = value.replace(/\D/g, "");
    return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  const formatPhone = (value: string) => {
    const v = value.replace(/\D/g, "");
    return v.replace(/(\d{2})(\d{4,5})(\d{4})/, "($1) $2-$3");
  };

  const formatZipCode = (value: string) => {
    const v = value.replace(/\D/g, "");
    return v.replace(/(\d{5})(\d{3})/, "$1-$2");
  };

  if (orderComplete) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <CheckCircle sx={{ fontSize: 80, color: "success.main", mb: 2 }} />
        <Typography variant="h4" gutterBottom>
          Pedido Realizado com Sucesso!
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Número do Pedido: {orderId}
        </Typography>
        <Typography variant="body1" sx={{ mb: 4 }}>
          Você receberá um e-mail de confirmação em breve com os detalhes do seu
          pedido.
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

  const renderAddressForm = () => (
    <Box>
      {/* Opção de selecionar modo */}
      <Box sx={{ mb: 3 }}>
        <FormControl component="fieldset">
          <FormLabel component="legend">
            Como deseja informar o endereço?
          </FormLabel>
          <RadioGroup
            row
            value={addressMode}
            onChange={(e) =>
              setAddressMode(e.target.value as "select" | "manual")
            }
          >
            <FormControlLabel
              value="select"
              control={<Radio />}
              label="Usar endereço salvo"
            />
            <FormControlLabel
              value="manual"
              control={<Radio />}
              label="Digitar manualmente"
            />
          </RadioGroup>
        </FormControl>
      </Box>

      {/* Modo de seleção de endereço salvo */}
      {addressMode === "select" && customerId && (
        <AddressManager
          customerId={customerId}
          showSelection={true}
          selectedAddressId={selectedAddress?.id}
          onAddressSelect={(addr) => setSelectedAddress(addr)}
        />
      )}

      {/* Modo manual */}
      {addressMode === "manual" && (
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              label="Nome"
              value={address.firstName}
              onChange={(e) =>
                setAddress({ ...address, firstName: e.target.value })
              }
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
              onChange={(e) =>
                setAddress({ ...address, lastName: e.target.value })
              }
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
              onChange={(e) =>
                setAddress({ ...address, address: e.target.value })
              }
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
              onChange={(e) =>
                setAddress({ ...address, state: e.target.value })
              }
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
              onChange={(e) =>
                setAddress({
                  ...address,
                  zipCode: formatZipCode(e.target.value),
                })
              }
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
              onChange={(e) =>
                setAddress({ ...address, phone: formatPhone(e.target.value) })
              }
              error={!!addressErrors.phone}
              helperText={addressErrors.phone}
              inputProps={{ maxLength: 15 }}
            />
          </Grid>
        </Grid>
      )}
    </Box>
  );

  const renderPaymentForm = () => (
    <Box>
      <FormControl component="fieldset" sx={{ mb: 3 }}>
        <FormLabel component="legend">Forma de Pagamento</FormLabel>
        <RadioGroup
          value={paymentInfo.method}
          onChange={(e) => {
            setPaymentInfo({ ...paymentInfo, method: e.target.value as any });
            // Resetar modo do cartão ao mudar método
            if (e.target.value === "credit") {
              setCardMode("select");
            }
          }}
        >
          <FormControlLabel
            value="credit"
            control={<Radio />}
            label="Cartão de Crédito (Aceita múltiplos cartões)"
          />
          <FormControlLabel
            value="debit"
            control={<Radio />}
            label="Cartão de Débito"
          />
          <FormControlLabel value="pix" control={<Radio />} label="PIX" />
          <FormControlLabel
            value="boleto"
            control={<Radio />}
            label="Boleto Bancário"
          />
        </RadioGroup>
      </FormControl>

      {/* Cartão de Crédito - Opção de múltiplos cartões */}
      {paymentInfo.method === "credit" && (
        <Box>
          <FormControl component="fieldset" sx={{ mb: 2 }}>
            <FormLabel component="legend">Como deseja pagar?</FormLabel>
            <RadioGroup
              row
              value={cardMode}
              onChange={(e) =>
                setCardMode(e.target.value as "select" | "manual" | "multiple")
              }
            >
              <FormControlLabel
                value="select"
                control={<Radio />}
                label="Cartão salvo"
              />
              <FormControlLabel
                value="manual"
                control={<Radio />}
                label="Novo cartão"
              />
              <FormControlLabel
                value="multiple"
                control={<Radio />}
                label="Dividir em múltiplos cartões"
              />
            </RadioGroup>
          </FormControl>

          {cardMode === "select" && customerId && (
            <CreditCardManager
              customerId={customerId}
              showSelection={true}
              selectedCardId={selectedCardId}
              onCardSelect={(card) => {
                // Marcar cartão como selecionado visualmente
                setSelectedCardId(card.id);
                // Adicionar cartão à lista de pagamentos com valor total
                setSelectedCards([
                  {
                    cardId: card.id,
                    amount:
                      calculateSubtotal() +
                      getShippingCost() -
                      calculateTotalDiscount(),
                  },
                ]);
              }}
            />
          )}

          {cardMode === "manual" && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Número do Cartão"
                  value={paymentInfo.cardNumber || ""}
                  onChange={(e) =>
                    setPaymentInfo({
                      ...paymentInfo,
                      cardNumber: formatCardNumber(e.target.value),
                    })
                  }
                  error={!!paymentErrors.cardNumber}
                  helperText={paymentErrors.cardNumber}
                  inputProps={{ maxLength: 19 }}
                  InputProps={{
                    startAdornment: (
                      <CreditCard sx={{ mr: 1, color: "text.secondary" }} />
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Nome no Cartão"
                  value={paymentInfo.cardName || ""}
                  onChange={(e) =>
                    setPaymentInfo({ ...paymentInfo, cardName: e.target.value })
                  }
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
                  value={paymentInfo.expiryDate || ""}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    const formatted = value.replace(/(\d{2})(\d{2})/, "$1/$2");
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
                  value={paymentInfo.cvv || ""}
                  onChange={(e) =>
                    setPaymentInfo({
                      ...paymentInfo,
                      cvv: e.target.value.replace(/\D/g, ""),
                    })
                  }
                  error={!!paymentErrors.cvv}
                  helperText={paymentErrors.cvv}
                  inputProps={{ maxLength: 4 }}
                  InputProps={{
                    startAdornment: (
                      <Security sx={{ mr: 1, color: "text.secondary" }} />
                    ),
                  }}
                />
              </Grid>
            </Grid>
          )}

          {cardMode === "multiple" && (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                Divida o pagamento entre vários cartões salvos ou cadastre
                novos.
              </Alert>

              {customerId && (
                <>
                  <Typography variant="subtitle2" gutterBottom>
                    Cartões Adicionados ao Pagamento:
                  </Typography>

                  {selectedCards.length === 0 ? (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      Nenhum cartão adicionado. Clique em "Gerenciar Cartões"
                      para adicionar.
                    </Alert>
                  ) : (
                    <Table size="small" sx={{ mb: 2 }}>
                      <TableHead>
                        <TableRow>
                          <TableCell>Cartão</TableCell>
                          <TableCell align="right">Valor</TableCell>
                          <TableCell align="right">Ações</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedCards.map((card, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              {card.cardId
                                ? `Cartão **** ${card.cardId.slice(-4)}`
                                : "Novo Cartão"}
                            </TableCell>
                            <TableCell align="right">
                              <TextField
                                size="small"
                                type="number"
                                value={card.amount}
                                onChange={(e) => {
                                  const newCards = [...selectedCards];
                                  newCards[index].amount =
                                    parseFloat(e.target.value) || 0;
                                  setSelectedCards(newCards);
                                }}
                                InputProps={{
                                  startAdornment: "R$",
                                }}
                                sx={{ width: 120 }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => {
                                  setSelectedCards(
                                    selectedCards.filter((_, i) => i !== index)
                                  );
                                }}
                              >
                                <Delete />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}

                  <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                    <Button
                      variant="outlined"
                      startIcon={<Add />}
                      onClick={() => {
                        // Adicionar placeholder para novo cartão
                        const totalPaid = selectedCards.reduce(
                          (sum, c) => sum + c.amount,
                          0
                        );
                        const remaining =
                          calculateSubtotal() +
                          getShippingCost() -
                          calculateTotalDiscount() -
                          totalPaid;
                        setSelectedCards([
                          ...selectedCards,
                          {
                            cardId: undefined,
                            amount: Math.max(0, remaining),
                          },
                        ]);
                      }}
                    >
                      Adicionar Cartão
                    </Button>
                  </Box>

                  <CreditCardManager
                    customerId={customerId}
                    showSelection={false}
                  />
                </>
              )}
            </Box>
          )}
        </Box>
      )}

      {/* Cartão de Débito - Formulário simplificado */}
      {paymentInfo.method === "debit" && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              label="Número do Cartão"
              value={paymentInfo.cardNumber || ""}
              onChange={(e) =>
                setPaymentInfo({
                  ...paymentInfo,
                  cardNumber: formatCardNumber(e.target.value),
                })
              }
              error={!!paymentErrors.cardNumber}
              helperText={paymentErrors.cardNumber}
              inputProps={{ maxLength: 19 }}
              InputProps={{
                startAdornment: (
                  <CreditCard sx={{ mr: 1, color: "text.secondary" }} />
                ),
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              label="Nome no Cartão"
              value={paymentInfo.cardName || ""}
              onChange={(e) =>
                setPaymentInfo({ ...paymentInfo, cardName: e.target.value })
              }
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
              value={paymentInfo.expiryDate || ""}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                const formatted = value.replace(/(\d{2})(\d{2})/, "$1/$2");
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
              value={paymentInfo.cvv || ""}
              onChange={(e) =>
                setPaymentInfo({
                  ...paymentInfo,
                  cvv: e.target.value.replace(/\D/g, ""),
                })
              }
              error={!!paymentErrors.cvv}
              helperText={paymentErrors.cvv}
              inputProps={{ maxLength: 4 }}
              InputProps={{
                startAdornment: (
                  <Security sx={{ mr: 1, color: "text.secondary" }} />
                ),
              }}
            />
          </Grid>
        </Grid>
      )}

      {(paymentInfo.method === "pix" || paymentInfo.method === "boleto") && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              label="CPF"
              value={paymentInfo.cpf || ""}
              onChange={(e) =>
                setPaymentInfo({
                  ...paymentInfo,
                  cpf: formatCPF(e.target.value),
                })
              }
              error={!!paymentErrors.cpf}
              helperText={paymentErrors.cpf}
              inputProps={{ maxLength: 14 }}
            />
          </Grid>
          {paymentInfo.method === "pix" && (
            <Grid item xs={12}>
              <Alert severity="info">
                Após confirmar o pedido, você receberá o código PIX para
                pagamento.
              </Alert>
            </Grid>
          )}
          {paymentInfo.method === "boleto" && (
            <Grid item xs={12}>
              <Alert severity="info">
                O boleto será enviado por e-mail e poderá ser pago em qualquer
                banco.
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
        <Typography variant="body2">
          {addressMode === "select" && selectedAddress ? (
            <>
              {selectedAddress.firstName} {selectedAddress.lastName}
              <br />
              {selectedAddress.address}
              <br />
              {selectedAddress.city}, {selectedAddress.state} -{" "}
              {selectedAddress.zipCode}
              <br />
              {selectedAddress.phone}
            </>
          ) : (
            <>
              {address.firstName} {address.lastName}
              <br />
              {address.address}
              <br />
              {address.city}, {address.state} - {address.zipCode}
              <br />
              {address.phone}
            </>
          )}
        </Typography>

        {/* Mostrar cupons aplicados */}
        {(appliedPromotionalCoupon || appliedExchangeCoupons.length > 0) && (
          <>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Cupons Aplicados
            </Typography>
            {appliedPromotionalCoupon && (
              <Chip
                label={`${appliedPromotionalCoupon.code} - ${
                  appliedPromotionalCoupon.type === "percentage"
                    ? `${appliedPromotionalCoupon.discount}%`
                    : `R$ ${appliedPromotionalCoupon.discount}`
                }`}
                color="success"
                sx={{ mr: 1, mb: 1 }}
              />
            )}
            {appliedExchangeCoupons.map((coupon) => (
              <Chip
                key={coupon.id}
                label={`${coupon.code} - ${
                  coupon.type === "percentage"
                    ? `${coupon.discount}%`
                    : `R$ ${coupon.discount}`
                }`}
                color="info"
                sx={{ mr: 1, mb: 1 }}
              />
            ))}
          </>
        )}

        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          Forma de Pagamento
        </Typography>
        <Typography variant="body2">
          {paymentInfo.method === "credit" && "Cartão de Crédito"}
          {paymentInfo.method === "debit" && "Cartão de Débito"}
          {paymentInfo.method === "pix" && "PIX"}
          {paymentInfo.method === "boleto" && "Boleto Bancário"}
          {paymentInfo.cardNumber &&
            ` - **** **** **** ${paymentInfo.cardNumber.slice(-4)}`}
        </Typography>
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
              <Typography>R$ {calculateSubtotal().toFixed(2)}</Typography>
            </Box>
            {(appliedPromotionalCoupon ||
              appliedExchangeCoupons.length > 0) && (
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
              >
                <Typography color="success.main">Descontos:</Typography>
                <Typography color="success.main">
                  -R$ {calculateTotalDiscount().toFixed(2)}
                </Typography>
              </Box>
            )}
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
            >
              <Typography>Frete:</Typography>
              <Typography>R$ {getShippingCost().toFixed(2)}</Typography>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="h6">Total:</Typography>
              <Typography variant="h6" color="primary">
                R${" "}
                {(
                  calculateSubtotal() +
                  getShippingCost() -
                  calculateTotalDiscount()
                ).toFixed(2)}
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

        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
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
              {loading ? "Processando..." : "Finalizar Pedido"}
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
