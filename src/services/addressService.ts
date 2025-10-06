import { Address } from "../types";
import * as Store from "../store/index";

export class AddressService {
  private static STORAGE_KEY = "customer_addresses";

  // Obter todos os endereços de um cliente
  static getAddresses(customerId: string): Address[] {
    try {
      const addresses = Store.readStore<Address[]>(this.STORAGE_KEY, []);
      return addresses.filter((addr) => addr.customerId === customerId);
    } catch {
      return [];
    }
  }

  // Adicionar novo endereço
  static addAddress(addressData: Omit<Address, "id">): Address {
    const addresses = Store.readStore<Address[]>(this.STORAGE_KEY, []);
    const newAddress: Address = {
      ...addressData,
      id: `addr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    // Se for o primeiro endereço ou marcado como padrão, definir como padrão
    if (
      addresses.filter((a) => a.customerId === addressData.customerId)
        .length === 0
    ) {
      newAddress.isDefault = true;
    }

    // Se este endereço for marcado como padrão, remover padrão dos outros
    if (newAddress.isDefault) {
      addresses.forEach((addr) => {
        if (addr.customerId === addressData.customerId) {
          addr.isDefault = false;
        }
      });
    }

    addresses.push(newAddress);
    Store.writeStore(this.STORAGE_KEY, addresses);
    return newAddress;
  }

  // Atualizar endereço existente
  static updateAddress(
    addressId: string,
    updates: Partial<Omit<Address, "id" | "customerId">>
  ): boolean {
    const addresses = Store.readStore<Address[]>(this.STORAGE_KEY, []);
    const addressIndex = addresses.findIndex((addr) => addr.id === addressId);

    if (addressIndex === -1) return false;

    const address = addresses[addressIndex];

    // Se está definindo como padrão, remover padrão dos outros
    if (updates.isDefault) {
      addresses.forEach((addr) => {
        if (addr.customerId === address.customerId) {
          addr.isDefault = false;
        }
      });
    }

    addresses[addressIndex] = { ...address, ...updates };
    Store.writeStore(this.STORAGE_KEY, addresses);
    return true;
  }

  // Remover endereço
  static removeAddress(addressId: string): boolean {
    const addresses = Store.readStore<Address[]>(this.STORAGE_KEY, []);
    const addressIndex = addresses.findIndex((addr) => addr.id === addressId);

    if (addressIndex === -1) return false;

    const removedAddress = addresses[addressIndex];
    addresses.splice(addressIndex, 1);

    // Se removeu o endereço padrão, definir outro como padrão
    if (removedAddress.isDefault) {
      const customerAddresses = addresses.filter(
        (a) => a.customerId === removedAddress.customerId
      );
      if (customerAddresses.length > 0) {
        customerAddresses[0].isDefault = true;
      }
    }

    Store.writeStore(this.STORAGE_KEY, addresses);
    return true;
  }

  // Obter endereço padrão
  static getDefaultAddress(customerId: string): Address | null {
    const addresses = this.getAddresses(customerId);
    return addresses.find((addr) => addr.isDefault) || addresses[0] || null;
  }

  // Definir endereço como padrão
  static setDefaultAddress(addressId: string): boolean {
    const addresses = Store.readStore<Address[]>(this.STORAGE_KEY, []);
    const address = addresses.find((addr) => addr.id === addressId);

    if (!address) return false;

    // Remover padrão dos outros endereços do mesmo cliente
    addresses.forEach((addr) => {
      if (addr.customerId === address.customerId) {
        addr.isDefault = addr.id === addressId;
      }
    });

    Store.writeStore(this.STORAGE_KEY, addresses);
    return true;
  }

  // Validar CEP (simplificado)
  static validateZipCode(zipCode: string): boolean {
    const cleaned = zipCode.replace(/\D/g, "");
    return cleaned.length === 8;
  }

  // Validar telefone
  static validatePhone(phone: string): boolean {
    const cleaned = phone.replace(/\D/g, "");
    return cleaned.length >= 10 && cleaned.length <= 11;
  }

  // Validar endereço completo
  static validateAddress(address: Omit<Address, "id" | "customerId">): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!address.firstName?.trim()) errors.push("Nome é obrigatório");
    if (!address.lastName?.trim()) errors.push("Sobrenome é obrigatório");
    if (!address.address?.trim()) errors.push("Endereço é obrigatório");
    if (!address.city?.trim()) errors.push("Cidade é obrigatória");
    if (!address.state?.trim()) errors.push("Estado é obrigatório");
    if (!address.zipCode?.trim()) errors.push("CEP é obrigatório");
    if (!address.phone?.trim()) errors.push("Telefone é obrigatório");

    if (address.zipCode && !this.validateZipCode(address.zipCode)) {
      errors.push("CEP deve ter 8 dígitos");
    }

    if (address.phone && !this.validatePhone(address.phone)) {
      errors.push("Telefone deve ter 10 ou 11 dígitos");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
