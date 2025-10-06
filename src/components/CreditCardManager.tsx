import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox,
  Grid,
  IconButton,
  Chip,
  Alert,
  Card,
  CardContent,
  Avatar,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  CreditCard as CreditCardIcon,
  Security,
} from "@mui/icons-material";
import { CreditCard } from "../types";
import { CreditCardService } from "../services/creditCardService";

interface CreditCardManagerProps {
  customerId: string;
  onCardSelect?: (card: CreditCard) => void;
  selectedCardId?: string;
  showSelection?: boolean;
}

const CreditCardManager: React.FC<CreditCardManagerProps> = ({
  customerId,
  onCardSelect,
  selectedCardId,
  showSelection = false,
}) => {
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
  const [formData, setFormData] = useState({
    cardNumber: "",
    cardName: "",
    expiryDate: "",
    cvv: "",
    isDefault: false,
    label: "",
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [showCVV, setShowCVV] = useState(false);

  useEffect(() => {
    loadCards();
  }, [customerId]);

  const loadCards = () => {
    const customerCards = CreditCardService.getCreditCards(customerId);
    setCards(customerCards);
  };

  const handleOpenDialog = (card?: CreditCard) => {
    if (card) {
      setEditingCard(card);
      setFormData({
        cardNumber: "",
        cardName: card.cardName,
        expiryDate: card.expiryDate,
        cvv: "",
        isDefault: card.isDefault || false,
        label: card.label || "",
      });
    } else {
      setEditingCard(null);
      setFormData({
        cardNumber: "",
        cardName: "",
        expiryDate: "",
        cvv: "",
        isDefault: cards.length === 0, // Primeiro cartão é padrão
        label: "",
      });
    }
    setErrors([]);
    setIsDialogOpen(true);
    setShowCVV(false);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCard(null);
    setFormData({
      cardNumber: "",
      cardName: "",
      expiryDate: "",
      cvv: "",
      isDefault: false,
      label: "",
    });
    setErrors([]);
    setShowCVV(false);
  };

  const handleSaveCard = () => {
    if (editingCard) {
      // Para edição, apenas validar campos não sensíveis
      if (!formData.cardName?.trim()) {
        setErrors(["Nome no cartão é obrigatório"]);
        return;
      }

      CreditCardService.updateCreditCard(editingCard.id, {
        cardName: formData.cardName,
        isDefault: formData.isDefault,
        label: formData.label,
      });
    } else {
      // Para novo cartão, validar tudo
      const validation = CreditCardService.validateCreditCard(formData);

      if (!validation.isValid) {
        setErrors(validation.errors);
        return;
      }

      CreditCardService.addCreditCard({
        ...formData,
        customerId,
        brand: CreditCardService.detectCardBrand(formData.cardNumber),
      });
    }

    loadCards();
    handleCloseDialog();
  };

  const handleDeleteCard = (cardId: string) => {
    if (window.confirm("Tem certeza que deseja excluir este cartão?")) {
      CreditCardService.removeCreditCard(cardId);
      loadCards();
    }
  };

  const handleSetDefault = (cardId: string) => {
    CreditCardService.setDefaultCreditCard(cardId);
    loadCards();
  };

  const formatCardNumber = (value: string) => {
    return CreditCardService.formatCardNumber(value);
  };

  const formatExpiryDate = (value: string) => {
    return CreditCardService.formatExpiryDate(value);
  };

  const getCardBrandColor = (brand: string) => {
    const colors: Record<string, string> = {
      visa: "#1a1f71",
      mastercard: "#eb001b",
      elo: "#ffcb00",
      amex: "#006fcf",
    };
    return colors[brand] || "#666";
  };

  const getCardBrandName = (brand: string) => {
    const names: Record<string, string> = {
      visa: "Visa",
      mastercard: "Mastercard",
      elo: "Elo",
      amex: "American Express",
    };
    return names[brand] || "Desconhecida";
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h6">
          {showSelection ? "Selecionar Cartão" : "Meus Cartões"}
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Novo Cartão
        </Button>
      </Box>

      {cards.length === 0 ? (
        <Alert severity="info">
          Nenhum cartão cadastrado. Adicione um cartão para continuar.
        </Alert>
      ) : (
        <Grid container spacing={2}>
          {cards.map((card) => (
            <Grid item xs={12} sm={6} md={4} key={card.id}>
              <Card
                sx={{
                  border: "2px solid",
                  borderColor:
                    selectedCardId === card.id ? "primary.main" : "transparent",
                  cursor: showSelection ? "pointer" : "default",
                  "&:hover": showSelection
                    ? { borderColor: "primary.light" }
                    : {},
                }}
                onClick={() => showSelection && onCardSelect?.(card)}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      mb: 1,
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: getCardBrandColor(card.brand),
                        width: 32,
                        height: 32,
                      }}
                    >
                      <CreditCardIcon fontSize="small" />
                    </Avatar>
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      {card.isDefault && (
                        <Chip label="Padrão" size="small" color="primary" />
                      )}
                      {card.label && <Chip label={card.label} size="small" />}
                    </Box>
                  </Box>

                  <Typography
                    variant="h6"
                    sx={{ fontFamily: "monospace", mb: 1 }}
                  >
                    {card.cardNumber}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    {card.cardName}
                  </Typography>

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      {card.expiryDate}
                    </Typography>
                    <Chip
                      label={getCardBrandName(card.brand)}
                      size="small"
                      sx={{
                        color: "white",
                        bgcolor: getCardBrandColor(card.brand),
                      }}
                    />
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: 1,
                      mt: 2,
                    }}
                  >
                    {!card.isDefault && (
                      <Button
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetDefault(card.id);
                        }}
                      >
                        Tornar Padrão
                      </Button>
                    )}
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDialog(card);
                      }}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                    {cards.length > 1 && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCard(card.id);
                        }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Dialog para adicionar/editar cartão */}
      <Dialog
        open={isDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CreditCardIcon />
            {editingCard ? "Editar Cartão" : "Novo Cartão"}
          </Box>
        </DialogTitle>
        <DialogContent>
          {errors.length > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errors.map((error, index) => (
                <div key={index}>{error}</div>
              ))}
            </Alert>
          )}

          <Grid container spacing={2} sx={{ mt: 1 }}>
            {!editingCard && (
              <>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Número do Cartão"
                    value={formData.cardNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cardNumber: formatCardNumber(e.target.value),
                      })
                    }
                    inputProps={{ maxLength: 23 }}
                    InputProps={{
                      startAdornment: (
                        <CreditCardIcon
                          sx={{ mr: 1, color: "text.secondary" }}
                        />
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={8}>
                  <TextField
                    fullWidth
                    label="Data de Validade"
                    placeholder="MM/AAAA"
                    value={formData.expiryDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        expiryDate: formatExpiryDate(e.target.value),
                      })
                    }
                    inputProps={{ maxLength: 7 }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    label="CVV"
                    type={showCVV ? "text" : "password"}
                    value={formData.cvv}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cvv: e.target.value.replace(/\D/g, ""),
                      })
                    }
                    inputProps={{ maxLength: 4 }}
                    InputProps={{
                      endAdornment: (
                        <IconButton
                          size="small"
                          onClick={() => setShowCVV(!showCVV)}
                          edge="end"
                        >
                          <Security fontSize="small" />
                        </IconButton>
                      ),
                    }}
                  />
                </Grid>
              </>
            )}

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome no Cartão"
                value={formData.cardName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    cardName: e.target.value.toUpperCase(),
                  })
                }
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Rótulo (opcional)"
                placeholder="Ex: Cartão Principal, Emergência"
                value={formData.label}
                onChange={(e) =>
                  setFormData({ ...formData, label: e.target.value })
                }
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.isDefault}
                    onChange={(e) =>
                      setFormData({ ...formData, isDefault: e.target.checked })
                    }
                  />
                }
                label="Definir como cartão padrão"
              />
            </Grid>

            {!editingCard && (
              <Grid item xs={12}>
                <Alert severity="info" icon={<Security />}>
                  Seus dados do cartão são protegidos. Apenas os últimos 4
                  dígitos são salvos.
                </Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveCard}>
            {editingCard ? "Salvar" : "Adicionar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CreditCardManager;
