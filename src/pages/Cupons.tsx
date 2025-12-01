import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Alert,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  LocalOffer,
  ContentCopy,
  CheckCircle,
  Cancel,
  CardGiftcard,
  Percent,
} from "@mui/icons-material";
import * as Store from "../store/index";
import { Customer, Coupon } from "../types";
import { CouponService } from "../services/couponService";

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
      id={`coupon-tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const Cupons: React.FC = () => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [usedCoupons, setUsedCoupons] = useState<Coupon[]>([]);
  const [expiredCoupons, setExpiredCoupons] = useState<Coupon[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const session = Store.getSession();
    if (session?.user) {
      setCustomer(session.user as Customer);
      loadCoupons((session.user as Customer).id);
    }
  };

  const loadCoupons = (customerId: string) => {
    initializeSampleCoupons();

    const allCoupons = CouponService.getCoupons();
    const now = new Date();

    const available = allCoupons.filter(
      (c: Coupon) =>
        c.isActive &&
        new Date(c.expiresAt) > now &&
        (c.category === "promotional" || c.customerId === customerId)
    );

    const used = allCoupons.filter(
      (c: Coupon) =>
        !c.isActive &&
        (c.category === "promotional" || c.customerId === customerId)
    );

    const expired = allCoupons.filter(
      (c: Coupon) =>
        c.isActive &&
        new Date(c.expiresAt) <= now &&
        (c.category === "promotional" || c.customerId === customerId)
    );

    setAvailableCoupons(available);
    setUsedCoupons(used);
    setExpiredCoupons(expired);
  };

  const initializeSampleCoupons = () => {
    const existingCoupons = CouponService.getCoupons();

    if (existingCoupons.length === 0) {
      const newCoupons: Coupon[] = [
        {
          id: "promo_001",
          code: "BEMVINDO10",
          discount: 10,
          type: "percentage",
          category: "promotional",
          isActive: true,
          minOrderValue: 50,
          expiresAt: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ).toISOString(),
        },
        {
          id: "promo_002",
          code: "BEMVINDO15",
          discount: 15,
          type: "percentage",
          category: "promotional",
          isActive: true,
          minOrderValue: 100,
          maxDiscount: 30,
          expiresAt: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ).toISOString(),
        },

        {
          id: "promo_003",
          code: "FRETEGRATIS",
          discount: 15,
          type: "fixed",
          category: "promotional",
          isActive: true,
          minOrderValue: 100,
          expiresAt: new Date(
            Date.now() + 15 * 24 * 60 * 60 * 1000
          ).toISOString(),
        },
        {
          id: "promo_004",
          code: "FRETE10",
          discount: 10,
          type: "fixed",
          category: "promotional",
          isActive: true,
          minOrderValue: 50,
          expiresAt: new Date(
            Date.now() + 20 * 24 * 60 * 60 * 1000
          ).toISOString(),
        },

        {
          id: "promo_005",
          code: "DESCONTO20",
          discount: 20,
          type: "percentage",
          category: "promotional",
          isActive: true,
          minOrderValue: 150,
          maxDiscount: 50,
          expiresAt: new Date(
            Date.now() + 45 * 24 * 60 * 60 * 1000
          ).toISOString(),
        },
        {
          id: "promo_006",
          code: "MEGA25",
          discount: 25,
          type: "percentage",
          category: "promotional",
          isActive: true,
          minOrderValue: 200,
          maxDiscount: 75,
          expiresAt: new Date(
            Date.now() + 60 * 24 * 60 * 60 * 1000
          ).toISOString(),
        },
        {
          id: "promo_007",
          code: "SUPER30",
          discount: 30,
          type: "percentage",
          category: "promotional",
          isActive: true,
          minOrderValue: 300,
          maxDiscount: 100,
          expiresAt: new Date(
            Date.now() + 90 * 24 * 60 * 60 * 1000
          ).toISOString(),
        },

        {
          id: "promo_008",
          code: "ECONOMIZE20",
          discount: 20,
          type: "fixed",
          category: "promotional",
          isActive: true,
          minOrderValue: 80,
          expiresAt: new Date(
            Date.now() + 25 * 24 * 60 * 60 * 1000
          ).toISOString(),
        },
        {
          id: "promo_009",
          code: "ECONOMIZE50",
          discount: 50,
          type: "fixed",
          category: "promotional",
          isActive: true,
          minOrderValue: 200,
          expiresAt: new Date(
            Date.now() + 40 * 24 * 60 * 60 * 1000
          ).toISOString(),
        },
        {
          id: "promo_010",
          code: "VALE100",
          discount: 100,
          type: "fixed",
          category: "promotional",
          isActive: true,
          minOrderValue: 400,
          expiresAt: new Date(
            Date.now() + 60 * 24 * 60 * 60 * 1000
          ).toISOString(),
        },

        {
          id: "promo_011",
          code: "PRIMEIRACOMPRA",
          discount: 15,
          type: "percentage",
          category: "promotional",
          isActive: true,
          minOrderValue: 0,
          maxDiscount: 40,
          expiresAt: new Date(
            Date.now() + 365 * 24 * 60 * 60 * 1000
          ).toISOString(),
        },
        {
          id: "promo_012",
          code: "CLIENTEVIP",
          discount: 35,
          type: "percentage",
          category: "promotional",
          isActive: true,
          minOrderValue: 500,
          maxDiscount: 150,
          expiresAt: new Date(
            Date.now() + 180 * 24 * 60 * 60 * 1000
          ).toISOString(),
        },

        {
          id: "promo_013",
          code: "HOJE10",
          discount: 10,
          type: "percentage",
          category: "promotional",
          isActive: true,
          minOrderValue: 30,
          maxDiscount: 25,
          expiresAt: new Date(
            Date.now() + 1 * 24 * 60 * 60 * 1000
          ).toISOString(),
        },
        {
          id: "promo_014",
          code: "FLASH20",
          discount: 20,
          type: "fixed",
          category: "promotional",
          isActive: true,
          minOrderValue: 60,
          expiresAt: new Date(
            Date.now() + 3 * 24 * 60 * 60 * 1000
          ).toISOString(),
        },

        {
          id: "promo_015",
          code: "DESCONTO5",
          discount: 5,
          type: "percentage",
          category: "promotional",
          isActive: true,
          minOrderValue: 0,
          expiresAt: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ).toISOString(),
        },
      ];

      Store.writeStore("coupons", newCoupons);
    }
  };

  const handleCopyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setSuccess(`Cupom ${code} copiado!`);
    setTimeout(() => {
      setCopiedCode(null);
      setSuccess("");
    }, 2000);
  };

  const formatValue = (c: Coupon) =>
    c.type === "percentage"
      ? `${c.discount}% OFF`
      : `R$ ${c.discount.toFixed(2)} OFF`;

  const formatExpiryDate = (date: string) => {
    const days = Math.ceil(
      (new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (days < 0) return "Expirado";
    if (days === 0) return "Expira hoje";
    if (days === 1) return "Expira amanhã";
    if (days <= 7) return `Expira em ${days} dias`;
    return `Válido até ${new Date(date).toLocaleDateString("pt-BR")}`;
  };

  const renderCard = (
    coupon: Coupon,
    status: "available" | "used" | "expired"
  ) => (
    <Grid item xs={12} sm={6} md={4} key={coupon.id}>
      <Card
        sx={{
          border: 2,
          borderColor:
            status === "available"
              ? "primary.main"
              : status === "used"
              ? "success.main"
              : "grey.400",
          opacity: status === "available" ? 1 : 0.7,
          background:
            status === "available"
              ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              : status === "used"
              ? "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)"
              : "linear-gradient(135deg, #e0e0e0 0%, #bdbdbd 100%)",
          color: "white",
        }}
      >
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <Box sx={{ display: "flex", gap: 1 }}>
              {coupon.category === "promotional" ? (
                <Percent sx={{ fontSize: 28 }} />
              ) : (
                <CardGiftcard sx={{ fontSize: 28 }} />
              )}
              <Chip
                label={
                  coupon.category === "promotional" ? "Promocional" : "Troca"
                }
                size="small"
                sx={{ bgcolor: "rgba(255,255,255,0.3)", color: "white" }}
              />
            </Box>
            {status === "used" && <CheckCircle />}
            {status === "expired" && <Cancel />}
          </Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            {formatValue(coupon)}
          </Typography>
          <Box
            sx={{
              bgcolor: "rgba(0,0,0,0.2)",
              p: 1.5,
              borderRadius: 1,
              mb: 2,
              border: "1px dashed rgba(255,255,255,0.3)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography
              variant="h6"
              fontWeight="bold"
              sx={{ letterSpacing: 2 }}
            >
              {coupon.code}
            </Typography>
            {status === "available" && (
              <Tooltip
                title={copiedCode === coupon.code ? "Copiado!" : "Copiar"}
              >
                <IconButton
                  size="small"
                  onClick={() => handleCopyCoupon(coupon.code)}
                  sx={{ color: "white" }}
                >
                  {copiedCode === coupon.code ? (
                    <CheckCircle fontSize="small" />
                  ) : (
                    <ContentCopy fontSize="small" />
                  )}
                </IconButton>
              </Tooltip>
            )}
          </Box>
          <Box>
            {coupon.minOrderValue && coupon.minOrderValue > 0 && (
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Compra mínima: R$ {coupon.minOrderValue.toFixed(2)}
              </Typography>
            )}
            {coupon.maxDiscount && (
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Desconto máximo: R$ {coupon.maxDiscount.toFixed(2)}
              </Typography>
            )}
            {status === "available" && (
              <Typography
                variant="body2"
                fontWeight="bold"
                sx={{ opacity: 0.9 }}
              >
                {formatExpiryDate(coupon.expiresAt)}
              </Typography>
            )}
            {status === "expired" && (
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Expirado em{" "}
                {new Date(coupon.expiresAt).toLocaleDateString("pt-BR")}
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>
    </Grid>
  );

  if (!customer) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          Você precisa estar logado para ver seus cupons.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          <LocalOffer sx={{ mr: 1, verticalAlign: "middle" }} />
          Meus Cupons
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Aproveite os cupons disponíveis para economizar em suas compras!
        </Typography>
      </Box>

      {/* Success Alert */}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Paper
            sx={{
              p: 2,
              textAlign: "center",
              bgcolor: "primary.main",
              color: "white",
            }}
          >
            <Typography variant="h3" fontWeight="bold">
              {availableCoupons.length}
            </Typography>
            <Typography variant="body2">Disponíveis</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper
            sx={{
              p: 2,
              textAlign: "center",
              bgcolor: "success.main",
              color: "white",
            }}
          >
            <Typography variant="h3" fontWeight="bold">
              {usedCoupons.length}
            </Typography>
            <Typography variant="body2">Utilizados</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper
            sx={{
              p: 2,
              textAlign: "center",
              bgcolor: "grey.400",
              color: "white",
            }}
          >
            <Typography variant="h3" fontWeight="bold">
              {expiredCoupons.length}
            </Typography>
            <Typography variant="body2">Expirados</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          <Tab
            label={`Disponíveis (${availableCoupons.length})`}
            icon={<LocalOffer />}
            iconPosition="start"
          />
          <Tab
            label={`Utilizados (${usedCoupons.length})`}
            icon={<CheckCircle />}
            iconPosition="start"
          />
          <Tab
            label={`Expirados (${expiredCoupons.length})`}
            icon={<Cancel />}
            iconPosition="start"
          />
        </Tabs>

        {/* Tab Panels */}
        <TabPanel value={activeTab} index={0}>
          {availableCoupons.length === 0 ? (
            <Alert severity="info" sx={{ m: 3 }}>
              Nenhum cupom disponível no momento.
            </Alert>
          ) : (
            <Box sx={{ p: 3 }}>
              <Alert severity="success" sx={{ mb: 3 }}>
                Clique no ícone de copiar para usar o cupom no checkout!
              </Alert>
              <Grid container spacing={3}>
                {availableCoupons.map((c) => renderCard(c, "available"))}
              </Grid>
            </Box>
          )}
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          {usedCoupons.length === 0 ? (
            <Alert severity="info" sx={{ m: 3 }}>
              Você ainda não utilizou nenhum cupom.
            </Alert>
          ) : (
            <Box sx={{ p: 3 }}>
              <Grid container spacing={3}>
                {usedCoupons.map((c) => renderCard(c, "used"))}
              </Grid>
            </Box>
          )}
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          {expiredCoupons.length === 0 ? (
            <Alert severity="info" sx={{ m: 3 }}>
              Nenhum cupom expirado.
            </Alert>
          ) : (
            <Box sx={{ p: 3 }}>
              <Grid container spacing={3}>
                {expiredCoupons.map((c) => renderCard(c, "expired"))}
              </Grid>
            </Box>
          )}
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default Cupons;
