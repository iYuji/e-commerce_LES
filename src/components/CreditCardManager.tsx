import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  IconButton,
  Chip,
  Grid,
  Alert,
  MenuItem,
} from "@mui/material";
import { Add, Edit, Delete, CreditCard } from "@mui/icons-material";
import * as Store from "../store/index";
import { CreditCard as CreditCardType } from "../types";

interface CreditCardManagerProps {
  customerId: string;
}

const CreditCardManager: React.FC<CreditCardManagerProps> = ({
  customerId,
}) => {
  const [cards, setCards] = useState<CreditCardType[]>([]);
  const [open, setOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCardType | null>(null);
  const [formData, setFormData] = useState({
    cardNumber: "",
    cardName: "",
    expiryDate: "",
    brand: "visa" as "visa" | "mastercard" | "elo" | "amex",
    label: "",
    isDefault: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadCards();
  }, [customerId]);

  const loadCards = () => {
    const creditCards = Store.getCreditCards(customerId);
    setCards(creditCards);
  };

  const handleOpen = (card?: CreditCardType) => {
    if (card) {
      setEditingCard(card);
      setFormData({
        cardNumber: card.cardNumber,
        cardName: card.cardName,
        expiryDate: card.expiryDate,
        brand: card.brand,
        label: card.label || "",
        isDefault: card.isDefault || false,
      });
    } else {
      setEditingCard(null);
      setFormData({
        cardNumber: "",
        cardName: "",
        expiryDate: "",
        brand: "visa",
        label: "",
        isDefault: cards.length === 0,
      });
    }
    setErrors({});
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingCard(null);
    setFormData({
      cardNumber: "",
      cardName: "",
      expiryDate: "",
      brand: "visa",
      label: "",
      isDefault: false,
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.cardNumber.trim()) {
      newErrors.cardNumber = "Número do cartão é obrigatório";
    } else if (formData.cardNumber.length !== 4) {
      newErrors.cardNumber = "Digite os últimos 4 dígitos";
    }

    if (!formData.cardName.trim()) {
      newErrors.cardName = "Nome no cartão é obrigatório";
    }

    if (!formData.expiryDate.trim()) {
      newErrors.expiryDate = "Data de validade é obrigatória";
    } else if (!/^\d{2}\/\d{2}$/.test(formData.expiryDate)) {
      newErrors.expiryDate = "Formato deve ser MM/AA";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const allCards = Store.getCreditCards(customerId);

    if (editingCard) {
      const updatedCards = allCards.map((c) =>
        c.id === editingCard.id
          ? { ...c, ...formData }
          : formData.isDefault
          ? { ...c, isDefault: false }
          : c
      );
      Store.writeStore("creditCards", updatedCards);
    } else {
      const newCard: CreditCardType = {
        id: `card_${Date.now()}`,
        customerId,
        ...formData,
      };

      const updatedCards = formData.isDefault
        ? [...allCards.map((c) => ({ ...c, isDefault: false })), newCard]
        : [...allCards, newCard];

      Store.writeStore("creditCards", updatedCards);
    }

    loadCards();
    handleClose();
  };

  const handleDelete = (cardId: string) => {
    if (confirm("Deseja realmente excluir este cartão?")) {
      const allCards = Store.getCreditCards(customerId);
      const filtered = allCards.filter((c) => c.id !== cardId);
      Store.writeStore("creditCards", filtered);
      loadCards();
    }
  };

  const handleSetDefault = (cardId: string) => {
    const allCards = Store.getCreditCards(customerId);
    const updated = allCards.map((c) => ({
      ...c,
      isDefault: c.id === cardId,
    }));
    Store.writeStore("creditCards", updated);
    loadCards();
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\D/g, "");
    return v.replace(/(\d{2})(\d{2})/, "$1/$2");
  };

  const getBrandColor = (brand: string) => {
    switch (brand) {
      case "visa":
        return "#1A1F71";
      case "mastercard":
        return "#EB001B";
      case "elo":
        return "#FFCB05";
      case "amex":
        return "#006FCF";
      default:
        return "#757575";
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h6">Cartões Salvos</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpen()}
        >
          Adicionar Cartão
        </Button>
      </Box>

      {cards.length === 0 ? (
        <Alert severity="info">Você ainda não tem cartões cadastrados.</Alert>
      ) : (
        <Grid container spacing={2}>
          {cards.map((card) => (
            <Grid item xs={12} md={6} key={card.id}>
              <Card sx={{ bgcolor: getBrandColor(card.brand), color: "white" }}>
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 2,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <CreditCard />
                      <Typography
                        variant="h6"
                        sx={{ textTransform: "uppercase" }}
                      >
                        {card.brand}
                      </Typography>
                    </Box>
                    <Box>
                      <IconButton
                        size="small"
                        onClick={() => handleOpen(card)}
                        sx={{ color: "white" }}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(card.id)}
                        sx={{ color: "white" }}
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </Box>

                  {card.isDefault && (
                    <Chip
                      label="Padrão"
                      size="small"
                      sx={{
                        mb: 1,
                        bgcolor: "rgba(255,255,255,0.3)",
                        color: "white",
                      }}
                    />
                  )}

                  <Typography variant="h5" sx={{ mb: 1, letterSpacing: 2 }}>
                    **** **** **** {card.cardNumber}
                  </Typography>

                  <Box
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Box>
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>
                        Nome no Cartão
                      </Typography>
                      <Typography variant="body2">{card.cardName}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>
                        Validade
                      </Typography>
                      <Typography variant="body2">{card.expiryDate}</Typography>
                    </Box>
                  </Box>

                  {card.label && (
                    <Typography
                      variant="caption"
                      sx={{ mt: 1, display: "block", opacity: 0.9 }}
                    >
                      {card.label}
                    </Typography>
                  )}

                  {!card.isDefault && (
                    <Button
                      size="small"
                      sx={{ mt: 1, color: "white", borderColor: "white" }}
                      variant="outlined"
                      onClick={() => handleSetDefault(card.id)}
                    >
                      Definir como Padrão
                    </Button>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCard ? "Editar Cartão" : "Novo Cartão"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Identificação (ex: Cartão Principal, Emergência)"
                value={formData.label}
                onChange={(e) =>
                  setFormData({ ...formData, label: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Últimos 4 Dígitos"
                value={formData.cardNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 4);
                  setFormData({ ...formData, cardNumber: value });
                }}
                error={!!errors.cardNumber}
                helperText={
                  errors.cardNumber || "Digite apenas os últimos 4 dígitos"
                }
                inputProps={{ maxLength: 4 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Nome no Cartão"
                value={formData.cardName}
                onChange={(e) =>
                  setFormData({ ...formData, cardName: e.target.value })
                }
                error={!!errors.cardName}
                helperText={errors.cardName}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Validade (MM/AA)"
                value={formData.expiryDate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    expiryDate: formatExpiryDate(e.target.value),
                  })
                }
                error={!!errors.expiryDate}
                helperText={errors.expiryDate}
                inputProps={{ maxLength: 5 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                select
                fullWidth
                label="Bandeira"
                value={formData.brand}
                onChange={(e) =>
                  setFormData({ ...formData, brand: e.target.value as any })
                }
              >
                <MenuItem value="visa">Visa</MenuItem>
                <MenuItem value="mastercard">Mastercard</MenuItem>
                <MenuItem value="elo">Elo</MenuItem>
                <MenuItem value="amex">American Express</MenuItem>
              </TextField>
            </Grid>
          </Grid>
          <Alert severity="info" sx={{ mt: 2 }}>
            Por segurança, armazenamos apenas os últimos 4 dígitos do cartão.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained">
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CreditCardManager;
