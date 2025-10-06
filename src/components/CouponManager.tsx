import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
} from "@mui/material";
import {
  Add,
  Remove,
  ExpandMore,
  LocalOffer,
  CardGiftcard,
} from "@mui/icons-material";
import { Coupon, AppliedCoupon } from "../types";
import { CouponService } from "../services/couponService";

interface CouponManagerProps {
  customerId: string;
  orderValue: number;
  onCouponsChange: (
    appliedCoupons: AppliedCoupon[],
    totalDiscount: number
  ) => void;
}

const CouponManager: React.FC<CouponManagerProps> = ({
  customerId,
  orderValue,
  onCouponsChange,
}) => {
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupons, setAppliedCoupons] = useState<Coupon[]>([]);
  const [availableExchangeCoupons, setAvailableExchangeCoupons] = useState<
    Coupon[]
  >([]);
  const [availablePromotionalCoupons, setAvailablePromotionalCoupons] =
    useState<Coupon[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  useEffect(() => {
    loadAvailableCoupons();
  }, [customerId]);

  useEffect(() => {
    updateCouponsAndCalculate();
  }, [appliedCoupons, orderValue]);

  const loadAvailableCoupons = () => {
    const exchangeCoupons =
      CouponService.getExchangeCouponsForCustomer(customerId);
    const promotionalCoupons =
      CouponService.getCouponsByCategory("promotional");

    setAvailableExchangeCoupons(exchangeCoupons);
    setAvailablePromotionalCoupons(promotionalCoupons);
  };

  const updateCouponsAndCalculate = () => {
    if (appliedCoupons.length === 0) {
      onCouponsChange([], 0);
      return;
    }

    const validation = CouponService.validateCouponCombination(
      appliedCoupons,
      customerId,
      orderValue
    );
    setErrors(validation.errors);
    setWarnings(validation.warnings);

    if (validation.isValid) {
      const result = CouponService.applyCoupons(appliedCoupons, orderValue);
      onCouponsChange(result.appliedCoupons, result.adjustedDiscount);
    } else {
      onCouponsChange([], 0);
    }
  };

  const handleApplyCouponByCode = () => {
    if (!couponCode.trim()) return;

    setErrors([]);
    setWarnings([]);

    const validation = CouponService.validateCoupon(
      couponCode,
      customerId,
      orderValue
    );

    if (!validation.isValid) {
      setErrors([validation.error || "Erro ao validar cupom"]);
      return;
    }

    const coupon = validation.coupon!;

    // Verificar se cupom já foi aplicado
    if (appliedCoupons.some((c) => c.id === coupon.id)) {
      setErrors(["Cupom já foi aplicado"]);
      return;
    }

    // Verificar regras de combinação
    const newCoupons = [...appliedCoupons, coupon];
    const combinationValidation = CouponService.validateCouponCombination(
      newCoupons,
      customerId,
      orderValue
    );

    if (!combinationValidation.isValid) {
      setErrors(combinationValidation.errors);
      return;
    }

    setAppliedCoupons(newCoupons);
    setCouponCode("");
  };

  const handleApplyCoupon = (coupon: Coupon) => {
    // Verificar se cupom já foi aplicado
    if (appliedCoupons.some((c) => c.id === coupon.id)) return;

    const newCoupons = [...appliedCoupons, coupon];
    const validation = CouponService.validateCouponCombination(
      newCoupons,
      customerId,
      orderValue
    );

    if (validation.isValid) {
      setAppliedCoupons(newCoupons);
      setErrors([]);
    } else {
      setErrors(validation.errors);
    }
  };

  const handleRemoveCoupon = (couponId: string) => {
    const newCoupons = appliedCoupons.filter((c) => c.id !== couponId);
    setAppliedCoupons(newCoupons);
    setErrors([]);
    setWarnings([]);
  };

  const getTotalDiscount = () => {
    return appliedCoupons.reduce((total, coupon) => {
      return total + CouponService.calculateDiscount(coupon, orderValue);
    }, 0);
  };

  const getCouponChipColor = (coupon: Coupon) => {
    return coupon.category === "promotional" ? "primary" : "secondary";
  };

  const getCouponIcon = (coupon: Coupon) => {
    return coupon.category === "promotional" ? (
      <LocalOffer />
    ) : (
      <CardGiftcard />
    );
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Cupons de Desconto
      </Typography>

      {/* Campo para inserir cupom por código */}
      <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
        <TextField
          size="small"
          placeholder="Digite o código do cupom"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
          onKeyPress={(e) => e.key === "Enter" && handleApplyCouponByCode()}
          fullWidth
        />
        <Button
          variant="outlined"
          onClick={handleApplyCouponByCode}
          disabled={!couponCode.trim()}
        >
          Aplicar
        </Button>
      </Box>

      {/* Erros e avisos */}
      {errors.length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errors.map((error, index) => (
            <div key={index}>{error}</div>
          ))}
        </Alert>
      )}

      {warnings.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {warnings.map((warning, index) => (
            <div key={index}>{warning}</div>
          ))}
        </Alert>
      )}

      {/* Cupons aplicados */}
      {appliedCoupons.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Cupons Aplicados ({appliedCoupons.length})
          </Typography>
          <List dense>
            {appliedCoupons.map((coupon) => (
              <ListItem key={coupon.id} sx={{ px: 0 }}>
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Chip
                        icon={getCouponIcon(coupon)}
                        label={coupon.code}
                        color={getCouponChipColor(coupon)}
                        size="small"
                      />
                      <Typography variant="body2">
                        {CouponService.formatDiscount(coupon)}
                      </Typography>
                    </Box>
                  }
                  secondary={CouponService.getCouponDescription(coupon)}
                />
                <ListItemSecondaryAction>
                  <Typography
                    variant="body2"
                    color="success.main"
                    sx={{ mr: 1 }}
                  >
                    -R${" "}
                    {CouponService.calculateDiscount(
                      coupon,
                      orderValue
                    ).toFixed(2)}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveCoupon(coupon.id)}
                  >
                    <Remove />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
          <Divider />
          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              Desconto Total:
            </Typography>
            <Typography
              variant="subtitle1"
              fontWeight="bold"
              color="success.main"
            >
              -R$ {getTotalDiscount().toFixed(2)}
            </Typography>
          </Box>
        </Box>
      )}

      {/* Cupons disponíveis */}
      <Box>
        {/* Cupons de troca */}
        {availableExchangeCoupons.length > 0 && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CardGiftcard />
                <Typography>
                  Cupons de Troca ({availableExchangeCoupons.length})
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={1}>
                {availableExchangeCoupons.map((coupon) => (
                  <Grid item xs={12} sm={6} key={coupon.id}>
                    <Box
                      sx={{
                        p: 1,
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 1,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {coupon.code}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          R$ {coupon.discount.toFixed(2)}
                        </Typography>
                      </Box>
                      <Button
                        size="small"
                        startIcon={<Add />}
                        onClick={() => handleApplyCoupon(coupon)}
                        disabled={appliedCoupons.some(
                          (c) => c.id === coupon.id
                        )}
                      >
                        {appliedCoupons.some((c) => c.id === coupon.id)
                          ? "Aplicado"
                          : "Usar"}
                      </Button>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Cupons promocionais */}
        {availablePromotionalCoupons.length > 0 && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <LocalOffer />
                <Typography>
                  Cupons Promocionais ({availablePromotionalCoupons.length})
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={1}>
                {availablePromotionalCoupons.map((coupon) => (
                  <Grid item xs={12} sm={6} key={coupon.id}>
                    <Box
                      sx={{
                        p: 1,
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 1,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {coupon.code}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {CouponService.formatDiscount(coupon)}
                        </Typography>
                        {coupon.minOrderValue && (
                          <Typography
                            variant="caption"
                            display="block"
                            color="text.secondary"
                          >
                            Min. R$ {coupon.minOrderValue.toFixed(2)}
                          </Typography>
                        )}
                      </Box>
                      <Button
                        size="small"
                        startIcon={<Add />}
                        onClick={() => handleApplyCoupon(coupon)}
                        disabled={
                          appliedCoupons.some((c) => c.id === coupon.id) ||
                          appliedCoupons.some(
                            (c) => c.category === "promotional"
                          ) ||
                          (coupon.minOrderValue
                            ? orderValue < coupon.minOrderValue
                            : false)
                        }
                      >
                        {appliedCoupons.some((c) => c.id === coupon.id)
                          ? "Aplicado"
                          : appliedCoupons.some(
                              (c) => c.category === "promotional"
                            )
                          ? "Limite"
                          : coupon.minOrderValue &&
                            orderValue < coupon.minOrderValue
                          ? "Valor insuf."
                          : "Usar"}
                      </Button>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </AccordionDetails>
          </Accordion>
        )}
      </Box>
    </Box>
  );
};

export default CouponManager;
