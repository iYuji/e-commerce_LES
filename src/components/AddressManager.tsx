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
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  Home,
  Business,
  LocationOn,
} from "@mui/icons-material";
import { Address } from "../types";
import { getAddresses, readStore, writeStore } from "../store/index";

interface AddressManagerProps {
  customerId: string;
  onAddressSelect?: (address: Address) => void;
  selectedAddressId?: string;
  showSelection?: boolean;
}

const AddressManager: React.FC<AddressManagerProps> = ({
  customerId,
  onAddressSelect,
  selectedAddressId,
  showSelection = false,
}) => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
    isDefault: false,
    label: "",
  });
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    loadAddresses();
  }, [customerId]);

  const loadAddresses = () => {
    const customerAddresses = getAddresses(customerId);
    setAddresses(customerAddresses);
  };

  const handleOpenDialog = (address?: Address) => {
    if (address) {
      setEditingAddress(address);
      setFormData({
        firstName: address.firstName,
        lastName: address.lastName,
        address: address.address,
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
        phone: address.phone,
        isDefault: address.isDefault || false,
        label: address.label || "",
      });
    } else {
      setEditingAddress(null);
      setFormData({
        firstName: "",
        lastName: "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        phone: "",
        isDefault: addresses.length === 0,
        label: "",
      });
    }
    setErrors([]);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingAddress(null);
    setFormData({
      firstName: "",
      lastName: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      phone: "",
      isDefault: false,
      label: "",
    });
    setErrors([]);
  };

  const handleSaveAddress = () => {
    const errorsList: string[] = [];
    if (!formData.firstName.trim()) errorsList.push("Nome é obrigatório");
    if (!formData.lastName.trim()) errorsList.push("Sobrenome é obrigatório");
    if (!formData.address.trim()) errorsList.push("Endereço é obrigatório");
    if (!formData.city.trim()) errorsList.push("Cidade é obrigatória");
    if (!formData.state.trim()) errorsList.push("Estado é obrigatório");
    if (!formData.zipCode.trim() || !/^\d{5}-\d{3}$/.test(formData.zipCode))
      errorsList.push("CEP inválido");
    if (!formData.phone.trim()) errorsList.push("Telefone é obrigatório");

    if (errorsList.length > 0) {
      setErrors(errorsList);
      return;
    }

    try {
      const allAddresses = readStore("addresses", []);
      let updatedAddresses;
      if (editingAddress) {
        updatedAddresses = allAddresses.map((a: Address) =>
          a.id === editingAddress.id
            ? { ...a, ...formData, customerId }
            : formData.isDefault
            ? { ...a, isDefault: false }
            : a
        );
      } else {
        const newAddress = {
          ...formData,
          id: `addr_${Date.now()}`,
          customerId,
        };
        updatedAddresses = formData.isDefault
          ? [
              ...allAddresses.map((a: Address) => ({ ...a, isDefault: false })),
              newAddress,
            ]
          : [...allAddresses, newAddress];
      }
      writeStore("addresses", updatedAddresses);
      loadAddresses();
      handleCloseDialog();
    } catch (error) {
      setErrors(["Erro ao salvar endereço. Tente novamente."]);
    }
  };

  const handleDeleteAddress = (addressId: string) => {
    if (window.confirm("Tem certeza que deseja excluir este endereço?")) {
      const allAddresses = readStore("addresses", []);
      const updated = allAddresses.filter((a: Address) => a.id !== addressId);
      writeStore("addresses", updated);
      loadAddresses();
    }
  };

  const handleSetDefault = (addressId: string) => {
    const allAddresses = readStore("addresses", []);
    const updated = allAddresses.map((a: Address) => ({
      ...a,
      isDefault: a.id === addressId,
    }));
    writeStore("addresses", updated);
    loadAddresses();
  };

  const formatZipCode = (value: string) => {
    const v = value.replace(/\D/g, "");
    return v.replace(/(\d{5})(\d{3})/, "$1-$2");
  };

  const formatPhone = (value: string) => {
    const v = value.replace(/\D/g, "");
    return v.replace(/(\d{2})(\d{4,5})(\d{4})/, "($1) $2-$3");
  };

  const getAddressIcon = (label?: string) => {
    if (!label) return <LocationOn />;
    const lowerLabel = label.toLowerCase();
    if (lowerLabel.includes("casa") || lowerLabel.includes("home"))
      return <Home />;
    if (
      lowerLabel.includes("trabalho") ||
      lowerLabel.includes("work") ||
      lowerLabel.includes("empresa")
    )
      return <Business />;
    return <LocationOn />;
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
          {showSelection ? "Selecionar Endereço" : "Meus Endereços"}
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Novo Endereço
        </Button>
      </Box>

      {addresses.length === 0 ? (
        <Alert severity="info">
          Nenhum endereço cadastrado. Adicione um endereço para continuar.
        </Alert>
      ) : (
        <List>
          {addresses.map((address) => (
            <ListItem
              key={address.id}
              sx={{
                border: "1px solid",
                borderColor:
                  selectedAddressId === address.id ? "primary.main" : "divider",
                borderRadius: 1,
                mb: 1,
                backgroundColor:
                  selectedAddressId === address.id
                    ? "action.selected"
                    : "background.paper",
                cursor: showSelection ? "pointer" : "default",
              }}
              onClick={() => showSelection && onAddressSelect?.(address)}
            >
              <Box sx={{ display: "flex", alignItems: "center", mr: 1 }}>
                {getAddressIcon(address.label)}
              </Box>
              <ListItemText
                primary={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="subtitle1">
                      {address.firstName} {address.lastName}
                    </Typography>
                    {address.label && (
                      <Chip label={address.label} size="small" />
                    )}
                    {address.isDefault && (
                      <Chip label="Padrão" size="small" color="primary" />
                    )}
                  </Box>
                }
                secondary={
                  <>
                    <Typography variant="body2">{address.address}</Typography>
                    <Typography variant="body2">
                      {address.city}, {address.state} - {address.zipCode}
                    </Typography>
                    <Typography variant="body2">{address.phone}</Typography>
                  </>
                }
              />
              <ListItemSecondaryAction>
                <Box sx={{ display: "flex", gap: 1 }}>
                  {!address.isDefault && (
                    <Button
                      size="small"
                      onClick={() => handleSetDefault(address.id)}
                    >
                      Tornar Padrão
                    </Button>
                  )}
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(address)}
                  >
                    <Edit />
                  </IconButton>
                  {addresses.length > 1 && (
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteAddress(address.id)}
                    >
                      <Delete />
                    </IconButton>
                  )}
                </Box>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}

      {/* Dialog para adicionar/editar endereço */}
      <Dialog
        open={isDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingAddress ? "Editar Endereço" : "Novo Endereço"}
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
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nome"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Sobrenome"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Rótulo (opcional)"
                placeholder="Ex: Casa, Trabalho"
                value={formData.label}
                onChange={(e) =>
                  setFormData({ ...formData, label: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="CEP"
                value={formData.zipCode}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    zipCode: formatZipCode(e.target.value),
                  })
                }
                inputProps={{ maxLength: 9 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Endereço"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label="Cidade"
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Estado"
                value={formData.state}
                onChange={(e) =>
                  setFormData({ ...formData, state: e.target.value })
                }
                inputProps={{ maxLength: 2 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Telefone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    phone: formatPhone(e.target.value),
                  })
                }
                inputProps={{ maxLength: 15 }}
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
                label="Definir como endereço padrão"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveAddress}>
            {editingAddress ? "Salvar" : "Adicionar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AddressManager;
