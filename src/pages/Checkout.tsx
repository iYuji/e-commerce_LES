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
} from "@mui/material";
import { CreditCard, Security, CheckCircle } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import * as Store from "../store/index";
import {
  CartItem,
  Order,
  Coupon,
  AppliedCoupon,
  Address as AddressType,
  CreditCard as CreditCardType,
} from "../types";
import { CouponService } from "../services/couponService";
import { StockService } from "../services/stockService";

// ============================================================
// CONSTANTES E CONFIGURAÇÕES
// ============================================================

// Define os três passos do processo de checkout
// Isso ajuda o usuário a saber em que etapa ele está
const steps = [
  "Endereço de Entrega",
  "Forma de Pagamento",
  "Revisão do Pedido",
];

// ============================================================
// INTERFACES E TIPOS
// ============================================================

// Define a estrutura de um endereço temporário (antes de ser salvo)
// Usamos isso para validar os dados antes de criar um endereço definitivo
interface Address {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
}

// Define a estrutura das informações de pagamento
// O campo 'method' determina quais outros campos são obrigatórios
interface PaymentInfo {
  method: "credit" | "debit" | "pix" | "boleto";
  cardNumber?: string;
  cardName?: string;
  expiryDate?: string;
  cvv?: string;
  cpf?: string;
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

const Checkout: React.FC = () => {
  const navigate = useNavigate();

  // --------------------------------------------------------
  // ESTADOS PRINCIPAIS DO COMPONENTE
  // --------------------------------------------------------

  // Controla qual etapa do checkout está ativa (0, 1 ou 2)
  const [activeStep, setActiveStep] = useState(0);

  // Armazena os itens do carrinho que vieram da página anterior
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Armazena os cupons que o usuário aplicou no carrinho
  const [appliedCoupons, setAppliedCoupons] = useState<Coupon[]>([]);

  // Indica se está processando o pedido (mostra loading no botão)
  const [loading, setLoading] = useState(false);

  // Indica se o pedido foi finalizado com sucesso
  const [orderComplete, setOrderComplete] = useState(false);

  // Armazena o ID do pedido criado (para mostrar na tela de sucesso)
  const [orderId, setOrderId] = useState("");

  // --------------------------------------------------------
  // ESTADOS PARA GERENCIAMENTO DE ENDEREÇOS
  // --------------------------------------------------------

  // Lista de endereços que o usuário já salvou anteriormente
  const [savedAddresses, setSavedAddresses] = useState<AddressType[]>([]);

  // Controla se o usuário quer usar um endereço novo ou um já salvo
  const [useNewAddress, setUseNewAddress] = useState(true);

  // ID do endereço selecionado (quando usa endereço salvo)
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");

  // --------------------------------------------------------
  // ESTADOS PARA GERENCIAMENTO DE CARTÕES
  // --------------------------------------------------------

  // Lista de cartões que o usuário já salvou anteriormente
  const [savedCards, setSavedCards] = useState<CreditCardType[]>([]);

  // Controla se o usuário quer usar um cartão novo ou um já salvo
  const [useNewCard, setUseNewCard] = useState(true);

  // Array que mapeia quanto será cobrado em cada cartão selecionado
  // Exemplo: [{ cardId: "abc123", amount: 50.00 }, { cardId: "def456", amount: 30.00 }]
  const [selectedCards, setSelectedCards] = useState<
    { cardId: string; amount: number }[]
  >([]);

  // Valor que será cobrado no cartão novo (quando não usa cartões salvos)
  const [newCardAmount, setNewCardAmount] = useState<number>(0);

  // --------------------------------------------------------
  // ESTADOS PARA DADOS DO FORMULÁRIO
  // --------------------------------------------------------

  // Dados do novo endereço que o usuário está cadastrando
  const [address, setAddress] = useState<Address>({
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
  });

  // Dados do pagamento (cartão, PIX ou boleto)
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({
    method: "credit",
  });

  // Opção de entrega selecionada (standard, express ou premium)
  // Isso afeta o custo do frete e o prazo de entrega
  const [shippingOption, setShippingOption] = useState("standard");

  // --------------------------------------------------------
  // ESTADOS PARA VALIDAÇÃO E ERROS
  // --------------------------------------------------------

  // Armazena os erros de validação do formulário de endereço
  // Exemplo: { firstName: "Nome é obrigatório", email: "Email inválido" }
  const [addressErrors, setAddressErrors] = useState<Partial<Address>>({});

  // Armazena os erros de validação do formulário de pagamento
  const [paymentErrors, setPaymentErrors] = useState<Partial<PaymentInfo>>({});

  // ============================================================
  // EFEITO INICIAL - CARREGA DADOS AO MONTAR O COMPONENTE
  // ============================================================

  useEffect(() => {
    // Carrega o carrinho do localStorage
    const cart = Store.getCart();
    setCartItems(cart);

    // Carrega os cupons que foram aplicados na página do carrinho
    const savedCoupons = localStorage.getItem("appliedCoupons");
    if (savedCoupons) {
      try {
        setAppliedCoupons(JSON.parse(savedCoupons));
      } catch (error) {
        console.error("Erro ao carregar cupons:", error);
      }
    }

    // Carrega os dados do usuário logado
    const session = Store.getSession();
    if (session?.user?.id) {
      // Busca os endereços salvos deste usuário
      const addresses = Store.getAddresses(session.user.id);
      setSavedAddresses(addresses);

      // Se existe um endereço marcado como padrão, seleciona ele automaticamente
      const defaultAddress = addresses.find((a) => a.isDefault);
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
        setUseNewAddress(false);
      }

      // Busca os cartões salvos deste usuário
      const cards = Store.getCreditCards(session.user.id);
      setSavedCards(cards);

      // Inicializa o valor do novo cartão (será calculado dinamicamente)
      setNewCardAmount(0);
    }

    // Se o carrinho está vazio, redireciona para o catálogo
    // Não faz sentido estar no checkout sem itens para comprar
    if (cart.length === 0) {
      navigate("/catalogo");
    }
  }, [navigate]);

  // ============================================================
  // FUNÇÕES DE VALIDAÇÃO
  // ============================================================

  /**
   * Valida os dados do endereço antes de prosseguir para o próximo passo
   * Retorna true se tudo está válido, false se há erros
   */
  const validateAddress = (): boolean => {
    // Se está usando endereço salvo, só precisa verificar se um foi selecionado
    if (!useNewAddress) {
      if (!selectedAddressId) {
        return false;
      }
      return true;
    }

    // Validação de novo endereço
    const errors: Partial<Address> = {};

    // Verifica cada campo obrigatório
    if (!address.firstName.trim()) errors.firstName = "Nome é obrigatório";
    if (!address.lastName.trim()) errors.lastName = "Sobrenome é obrigatório";
    if (!address.address.trim()) errors.address = "Endereço é obrigatório";
    if (!address.city.trim()) errors.city = "Cidade é obrigatória";
    if (!address.state.trim()) errors.state = "Estado é obrigatório";
    if (!address.zipCode.trim()) errors.zipCode = "CEP é obrigatório";
    if (!address.phone.trim()) errors.phone = "Telefone é obrigatório";

    // Validações de formato - CEP brasileiro (00000-000)
    if (address.zipCode && !/^\d{5}-?\d{3}$/.test(address.zipCode)) {
      errors.zipCode = "CEP deve ter o formato 00000-000";
    }

    // Validação de telefone brasileiro ((00) 00000-0000)
    if (address.phone && !/^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(address.phone)) {
      errors.phone = "Telefone deve ter o formato (00) 00000-0000";
    }

    // Atualiza o estado com os erros encontrados
    setAddressErrors(errors);

    // Retorna true apenas se não houver erros
    return Object.keys(errors).length === 0;
  };

  /**
   * Valida os dados de pagamento antes de finalizar o pedido
   * As validações mudam dependendo da forma de pagamento escolhida
   */
  const validatePayment = (): boolean => {
    const errors: Partial<PaymentInfo> = {};

    // Validações específicas para cartão de crédito ou débito
    if (paymentInfo.method === "credit" || paymentInfo.method === "debit") {
      // Se está usando cartões salvos
      if (!useNewCard) {
        const total = calculateTotal();
        const totalAllocated = selectedCards.reduce(
          (sum, sc) => sum + sc.amount,
          0
        );

        // Precisa ter pelo menos um cartão selecionado
        if (selectedCards.length === 0) {
          alert("Selecione pelo menos um cartão");
          return false;
        }

        // O valor total dos cartões deve ser igual ao total do pedido
        // Usamos uma margem de 0.01 para evitar problemas com ponto flutuante
        if (Math.abs(totalAllocated - total) > 0.01) {
          alert(
            `O valor total alocado (R$ ${totalAllocated.toFixed(
              2
            )}) deve ser igual ao total do pedido (R$ ${total.toFixed(2)})`
          );
          return false;
        }

        return true;
      }

      // Validações de novo cartão
      if (!paymentInfo.cardNumber?.trim())
        errors.cardNumber = "Número do cartão é obrigatório";
      if (!paymentInfo.cardName?.trim())
        errors.cardName = "Nome no cartão é obrigatório";
      if (!paymentInfo.expiryDate?.trim())
        errors.expiryDate = "Data de validade é obrigatória";
      if (!paymentInfo.cvv?.trim()) errors.cvv = "CVV é obrigatório";

      // Validação de formato do número do cartão (0000 0000 0000 0000)
      if (
        paymentInfo.cardNumber &&
        !/^\d{4}\s\d{4}\s\d{4}\s\d{4}$/.test(paymentInfo.cardNumber)
      ) {
        errors.cardNumber = "Cartão deve ter o formato 0000 0000 0000 0000";
      }

      // Validação de data de validade (MM/AA)
      if (
        paymentInfo.expiryDate &&
        !/^\d{2}\/\d{2}$/.test(paymentInfo.expiryDate)
      ) {
        errors.expiryDate = "Data deve ter o formato MM/AA";
      }

      // Validação do CVV (3 ou 4 dígitos)
      if (paymentInfo.cvv && !/^\d{3,4}$/.test(paymentInfo.cvv)) {
        errors.cvv = "CVV deve ter 3 ou 4 dígitos";
      }
    }

    // Validações para PIX ou Boleto (precisam apenas do CPF)
    if (paymentInfo.method === "pix" || paymentInfo.method === "boleto") {
      if (!paymentInfo.cpf?.trim()) errors.cpf = "CPF é obrigatório";

      // Validação de formato do CPF (000.000.000-00)
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

  // ============================================================
  // FUNÇÕES DE CÁLCULO DE VALORES
  // ============================================================

  /**
   * Calcula o subtotal do carrinho (soma dos preços x quantidades)
   * Este é o valor antes de aplicar descontos e frete
   */
  const calculateSubtotal = () => {
    return cartItems.reduce(
      (total, item) => total + item.card.price * item.quantity,
      0
    );
  };

  /**
   * Calcula o valor total de desconto dos cupons aplicados
   * Considera todos os cupons ativos no carrinho
   */
  const calculateDiscountAmount = () => {
    if (appliedCoupons.length === 0) return 0;
    const subtotal = calculateSubtotal();

    // Soma o desconto de todos os cupons
    return appliedCoupons.reduce((total, coupon) => {
      return total + CouponService.calculateDiscount(coupon, subtotal);
    }, 0);
  };

  /**
   * Retorna o custo do frete baseado na opção escolhida
   * Standard: R$ 8,50 (3-5 dias)
   * Express: R$ 15,00 (1-2 dias)
   * Premium: R$ 25,00 (24 horas)
   */
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

  /**
   * Calcula o valor total do pedido
   * Fórmula: Subtotal - Descontos + Frete
   */
  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscountAmount() + getShippingCost();
  };

  // ============================================================
  // FUNÇÕES DE NAVEGAÇÃO ENTRE ETAPAS
  // ============================================================

  /**
   * Avança para o próximo passo do checkout
   * Valida os dados antes de permitir o avanço
   */
  const handleNext = () => {
    // Valida o endereço no primeiro passo
    if (activeStep === 0 && !validateAddress()) return;

    // Valida o pagamento no segundo passo
    if (activeStep === 1 && !validatePayment()) return;

    // Avança para a próxima etapa
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  /**
   * Volta para o passo anterior
   * Não há validação ao voltar, apenas navegação
   */
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  // ============================================================
  // FUNÇÃO PRINCIPAL - FINALIZAR PEDIDO
  // ============================================================

  /**
   * Esta é a função mais importante do checkout!
   * Ela processa o pedido completo e salva no sistema
   *
   * MUDANÇAS IMPORTANTES PARA CORRIGIR O BUG:
   * 1. Valida autenticação ANTES de processar
   * 2. Usa customerId real da sessão
   * 3. Dispara evento orders:updated para atualizar outros componentes
   */
  const handlePlaceOrder = async () => {
    // PROTEÇÃO 1: Prevenir múltiplas chamadas (duplo clique)
    // Se já está processando, ignora novos cliques
    if (loading) {
      console.log("⚠️ Já está processando, ignorando clique duplo");
      return;
    }

    setLoading(true);
    console.log("🛒 Iniciando processo de pedido...");

    try {
      // PROTEÇÃO 2: Validar autenticação ANTES de tudo
      // Esta é uma das principais correções que fizemos!
      const session = Store.getSession();
      const customerId = session?.user?.id;

      if (!customerId) {
        alert("Você precisa estar logado para finalizar a compra");
        setLoading(false);
        navigate("/auth");
        return;
      }

      console.log("👤 Customer ID:", customerId);

      // Simula o processamento do pagamento (em produção, aqui você chamaria uma API)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Converte os cupons aplicados para o formato que será salvo no pedido
      const appliedCouponsForOrder: AppliedCoupon[] = appliedCoupons.map(
        (coupon) => ({
          couponId: coupon.id,
          code: coupon.code,
          discount: CouponService.calculateDiscount(
            coupon,
            calculateSubtotal()
          ),
          type: coupon.type,
          category: coupon.category,
        })
      );

      // Determina qual endereço usar (novo ou salvo)
      let shippingAddress: AddressType;
      if (useNewAddress) {
        // Cria um novo endereço com os dados do formulário
        shippingAddress = {
          id: `addr_${Date.now()}`,
          customerId,
          ...address,
        };
      } else {
        // Busca o endereço selecionado da lista de salvos
        const savedAddr = savedAddresses.find(
          (a) => a.id === selectedAddressId
        );
        if (!savedAddr) {
          alert("Endereço selecionado não encontrado");
          setLoading(false);
          return;
        }
        shippingAddress = savedAddr;
      }

      // Prepara as informações de pagamento
      const paymentInfoForOrder: any = {
        method: paymentInfo.method,
        totalAmount: calculateTotal(),
      };

      // Se for cartão, adiciona os dados dos cartões
      if (paymentInfo.method === "credit" || paymentInfo.method === "debit") {
        if (useNewCard) {
          // Novo cartão: salva apenas os últimos 4 dígitos
          paymentInfoForOrder.creditCards = [
            {
              cardNumber: paymentInfo.cardNumber?.slice(-4),
              cardName: paymentInfo.cardName,
              expiryDate: paymentInfo.expiryDate,
              amount: calculateTotal(),
            },
          ];
        } else {
          // Cartões salvos: mapeia cada cartão selecionado com seu valor
          paymentInfoForOrder.creditCards = selectedCards.map((sc) => {
            const card = savedCards.find((c) => c.id === sc.cardId);
            return {
              cardId: sc.cardId,
              cardNumber: card?.cardNumber,
              cardName: card?.cardName,
              brand: card?.brand,
              amount: sc.amount,
            };
          });
        }
      }

      // Cria o objeto do pedido com todos os dados
      const order: Omit<Order, "id"> = {
        customerId, // CORREÇÃO IMPORTANTE: Usa o customerId validado
        items: cartItems,
        subtotal: calculateSubtotal(),
        discountAmount: calculateDiscountAmount(),
        shippingCost: getShippingCost(),
        total: calculateTotal(),
        status: "pending",
        shippingAddress,
        paymentInfo: paymentInfoForOrder,
        appliedCoupons: appliedCouponsForOrder,
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

      // Salva o pedido no sistema
      const newOrderId = Store.addOrder(order);

      // LOGS PARA DEBUG: Ajudam a rastrear problemas
      console.log("✅ Pedido criado com ID:", newOrderId);
      console.log("📦 Pedido completo:", { ...order, id: newOrderId });

      // Limpa o carrinho e os cupons aplicados
      Store.clearCart();
      localStorage.removeItem("appliedCoupons");

      // CORREÇÃO CRÍTICA: Dispara evento para atualizar outros componentes
      // Sem isso, AdminVendas e MeusPedidos não sabem que há um novo pedido!
      console.log("📢 Disparando evento orders:updated...");
      window.dispatchEvent(new CustomEvent("orders:updated"));

      // Pequeno delay para garantir que o evento seja processado
      await new Promise((resolve) => setTimeout(resolve, 100));

      console.log("🎉 Pedido concluído:", newOrderId);

      // Mostra a tela de sucesso
      setOrderId(newOrderId);
      setOrderComplete(true);
    } catch (error) {
      console.error("❌ Erro ao processar pedido:", error);
      alert("Erro ao processar pedido. Tente novamente.");
    } finally {
      // Sempre desativa o loading, mesmo se houver erro
      setLoading(false);
    }
  };

  // ============================================================
  // FUNÇÕES DE FORMATAÇÃO
  // ============================================================

  /**
   * Formata o número do cartão enquanto o usuário digita
   * Adiciona espaços a cada 4 dígitos para melhor legibilidade
   * Exemplo: "1234567812345678" vira "1234 5678 1234 5678"
   */
  const formatCardNumber = (value: string) => {
    // Remove espaços e caracteres não numéricos
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");

    // Pega apenas os primeiros 16 dígitos
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";

    // Divide em grupos de 4
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    // Junta com espaços
    if (parts.length) {
      return parts.join(" ");
    } else {
      return v;
    }
  };

  /**
   * Formata o CPF enquanto o usuário digita
   * Adiciona pontos e hífen no padrão brasileiro
   * Exemplo: "12345678901" vira "123.456.789-01"
   */
  const formatCPF = (value: string) => {
    const v = value.replace(/\D/g, "");
    return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  /**
   * Formata o telefone enquanto o usuário digita
   * Adiciona parênteses, espaço e hífen no padrão brasileiro
   * Exemplo: "11987654321" vira "(11) 98765-4321"
   */
  const formatPhone = (value: string) => {
    const v = value.replace(/\D/g, "");
    return v.replace(/(\d{2})(\d{4,5})(\d{4})/, "($1) $2-$3");
  };

  /**
   * Formata o CEP enquanto o usuário digita
   * Adiciona hífen no padrão brasileiro
   * Exemplo: "01234567" vira "01234-567"
   */
  const formatZipCode = (value: string) => {
    const v = value.replace(/\D/g, "");
    return v.replace(/(\d{5})(\d{3})/, "$1-$2");
  };

  // ============================================================
  // TELA DE SUCESSO
  // ============================================================

  // Se o pedido foi concluído, mostra uma tela de sucesso
  // O usuário é redirecionado aqui automaticamente após finalizar
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

  // ============================================================
  // FUNÇÕES DE RENDERIZAÇÃO DOS FORMULÁRIOS
  // ============================================================

  // Cada uma dessas funções renderiza uma etapa diferente do checkout
  // Elas são chamadas dentro do JSX principal baseadas no activeStep

  const renderAddressForm = () => {
    return (
      <Grid container spacing={3}>
        {savedAddresses.length > 0 && (
          <Grid item xs={12}>
            <FormControl component="fieldset">
              <FormLabel component="legend">Endereço de Entrega</FormLabel>
              <RadioGroup
                value={useNewAddress ? "new" : "saved"}
                onChange={(e) => setUseNewAddress(e.target.value === "new")}
              >
                <FormControlLabel
                  value="saved"
                  control={<Radio />}
                  label="Usar endereço salvo"
                />
                <FormControlLabel
                  value="new"
                  control={<Radio />}
                  label="Cadastrar novo endereço"
                />
              </RadioGroup>
            </FormControl>
          </Grid>
        )}

        {!useNewAddress && savedAddresses.length > 0 && (
          <Grid item xs={12}>
            <FormControl fullWidth>
              <FormLabel>Selecione um endereço</FormLabel>
              <RadioGroup
                value={selectedAddressId}
                onChange={(e) => setSelectedAddressId(e.target.value)}
              >
                {savedAddresses.map((addr) => (
                  <FormControlLabel
                    key={addr.id}
                    value={addr.id}
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography variant="body1" fontWeight="bold">
                          {addr.label || `${addr.firstName} ${addr.lastName}`}
                          {addr.isDefault && (
                            <Chip
                              label="Padrão"
                              size="small"
                              color="primary"
                              sx={{ ml: 1 }}
                            />
                          )}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {addr.address}, {addr.city}, {addr.state} -{" "}
                          {addr.zipCode}
                        </Typography>
                      </Box>
                    }
                  />
                ))}
              </RadioGroup>
            </FormControl>
          </Grid>
        )}

        {useNewAddress && (
          <>
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
                onChange={(e) =>
                  setAddress({ ...address, city: e.target.value })
                }
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
          </>
        )}
      </Grid>
    );
  };

  const renderPaymentForm = () => {
    const total = calculateTotal();
    const totalAllocated = useNewCard
      ? newCardAmount
      : selectedCards.reduce((sum, sc) => sum + sc.amount, 0);
    const remaining = total - totalAllocated;

    return (
      <Box>
        <FormControl component="fieldset" sx={{ mb: 3 }}>
          <FormLabel component="legend">Forma de Pagamento</FormLabel>
          <RadioGroup
            value={paymentInfo.method}
            onChange={(e) =>
              setPaymentInfo({ ...paymentInfo, method: e.target.value as any })
            }
          >
            <FormControlLabel
              value="credit"
              control={<Radio />}
              label="Cartão de Crédito"
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

        {(paymentInfo.method === "credit" ||
          paymentInfo.method === "debit") && (
          <>
            <Alert severity="info" sx={{ mb: 2 }}>
              Total a pagar: R$ {total.toFixed(2)}
              {totalAllocated > 0 &&
                ` | Alocado: R$ ${totalAllocated.toFixed(
                  2
                )} | Restante: R$ ${remaining.toFixed(2)}`}
            </Alert>

            {savedCards.length > 0 && (
              <FormControl component="fieldset" sx={{ mb: 3 }}>
                <FormLabel component="legend">Opções de Cartão</FormLabel>
                <RadioGroup
                  value={useNewCard ? "new" : "saved"}
                  onChange={(e) => {
                    setUseNewCard(e.target.value === "new");
                    if (e.target.value === "new") {
                      setSelectedCards([]);
                      setNewCardAmount(total);
                    } else {
                      setNewCardAmount(0);
                    }
                  }}
                >
                  <FormControlLabel
                    value="saved"
                    control={<Radio />}
                    label="Usar cartão(ões) salvo(s)"
                  />
                  <FormControlLabel
                    value="new"
                    control={<Radio />}
                    label="Cadastrar novo cartão"
                  />
                </RadioGroup>
              </FormControl>
            )}

            {!useNewCard && savedCards.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Selecione um ou mais cartões e defina o valor para cada um:
                </Typography>
                {savedCards.map((card) => {
                  const cardSelection = selectedCards.find(
                    (sc) => sc.cardId === card.id
                  );
                  const cardAmount = cardSelection?.amount || 0;

                  return (
                    <Card key={card.id} sx={{ mb: 2, p: 2 }}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={6}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <CreditCard />
                            <Box>
                              <Typography variant="body1" fontWeight="bold">
                                **** **** **** {card.cardNumber}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {card.cardName}
                                {card.label && ` - ${card.label}`}
                                {card.isDefault && (
                                  <Chip
                                    label="Padrão"
                                    size="small"
                                    color="primary"
                                    sx={{ ml: 1 }}
                                  />
                                )}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            type="number"
                            label="Valor (R$)"
                            value={cardAmount || ""}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) || 0;
                              const newSelections = selectedCards.filter(
                                (sc) => sc.cardId !== card.id
                              );
                              if (value > 0) {
                                newSelections.push({
                                  cardId: card.id,
                                  amount: value,
                                });
                              }
                              setSelectedCards(newSelections);
                            }}
                            inputProps={{ min: 0, max: total, step: 0.01 }}
                            helperText={`Máx: R$ ${total.toFixed(2)}`}
                          />
                        </Grid>
                      </Grid>
                    </Card>
                  );
                })}
                {remaining !== 0 && (
                  <Alert
                    severity={remaining > 0 ? "warning" : "error"}
                    sx={{ mt: 2 }}
                  >
                    {remaining > 0
                      ? `Ainda falta alocar R$ ${remaining.toFixed(2)}`
                      : `Valor alocado excede o total em R$ ${Math.abs(
                          remaining
                        ).toFixed(2)}`}
                  </Alert>
                )}
              </Box>
            )}

            {useNewCard && (
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
                      setPaymentInfo({
                        ...paymentInfo,
                        cardName: e.target.value,
                      })
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
                      const formatted = value.replace(
                        /(\d{2})(\d{2})/,
                        "$1/$2"
                      );
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
          </>
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
  };

  const renderOrderReview = () => {
    return (
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
            {useNewAddress ? (
              <>
                {address.firstName} {address.lastName}
                <br />
                {address.address}
                <br />
                {address.city}, {address.state} - {address.zipCode}
                <br />
                {address.phone}
              </>
            ) : (
              (() => {
                const addr = savedAddresses.find(
                  (a) => a.id === selectedAddressId
                );
                return addr ? (
                  <>
                    {addr.firstName} {addr.lastName}
                    {addr.label && (
                      <Chip label={addr.label} size="small" sx={{ ml: 1 }} />
                    )}
                    <br />
                    {addr.address}
                    <br />
                    {addr.city}, {addr.state} - {addr.zipCode}
                    <br />
                    {addr.phone}
                  </>
                ) : (
                  "Endereço não selecionado"
                );
              })()
            )}
          </Typography>

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

          {appliedCoupons.length > 0 && (
            <>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Cupons Aplicados
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {appliedCoupons.map((coupon) => (
                  <Chip
                    key={coupon.id}
                    label={`${coupon.code} (${
                      coupon.category === "promotional"
                        ? "Promocional"
                        : "Troca"
                    })`}
                    color="success"
                    size="small"
                  />
                ))}
              </Box>
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
                <Typography>R$ {calculateSubtotal().toFixed(2)}</Typography>
              </Box>
              {appliedCoupons.length > 0 && (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography color="success.main">
                    Desconto ({appliedCoupons.length}{" "}
                    {appliedCoupons.length === 1 ? "cupom" : "cupons"}):
                  </Typography>
                  <Typography color="success.main">
                    -R$ {calculateDiscountAmount().toFixed(2)}
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
                  R$ {calculateTotal().toFixed(2)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  // ============================================================
  // RENDERIZAÇÃO PRINCIPAL
  // ============================================================

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
