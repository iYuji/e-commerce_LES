import { Customer } from "../types";

// Resolve API base URL with env fallback
const API_BASE_URL: string =
  (typeof import.meta !== "undefined" &&
    (import.meta as any).env?.VITE_API_BASE_URL) ||
  "http://localhost:3002/api";

export interface CreateCustomerData {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  cpf?: string;
}

export interface UpdateCustomerData {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  cpf?: string;
}

export interface CustomersSearchResult {
  customers: Customer[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  message?: string;
  customer?: T;
  error?: string;
}

class CustomerApi {
  // Small helper to make requests with timeout and clearer errors
  private async makeRequest<T>(url: string, options?: RequestInit): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
        signal: controller.signal,
        ...options,
      });

      const contentType = response.headers.get("content-type") || "";
      const isJson = contentType.includes("application/json");
      const data = isJson ? await response.json() : (undefined as any);

      if (!response.ok) {
        const msg =
          (data && (data.message || data.error)) || response.statusText;
        throw new Error(
          `API ${response.status} ${response.statusText} at ${url}: ${msg}`
        );
      }

      return data as T;
    } catch (error: any) {
      if (error?.name === "AbortError") {
        throw new Error(
          "Tempo esgotado ao conectar na API de clientes (timeout)"
        );
      }
      throw error instanceof Error
        ? error
        : new Error("Erro desconhecido na API");
    } finally {
      clearTimeout(timeout);
    }
  }

  // Health check
  async getHealth(): Promise<{
    status: string;
    message?: string;
    timestamp?: string;
  }> {
    return this.makeRequest(`/health`);
  }

  // Buscar todos os clientes com filtros e paginação
  async getCustomers(
    search?: string,
    page: number = 1,
    limit: number = 10
  ): Promise<CustomersSearchResult> {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    params.append("page", page.toString());
    params.append("limit", limit.toString());

    return this.makeRequest<CustomersSearchResult>(
      `/customers?${params.toString()}`
    );
  }

  // Buscar cliente por ID
  async getCustomer(id: string): Promise<Customer> {
    return this.makeRequest<Customer>(`/customers/${id}`);
  }

  // Estatísticas do cliente
  async getCustomerStats(id: string): Promise<{
    totalOrders: number;
    totalSpent: number;
    totalItems: number;
    lastOrder: string | null;
    averageOrderValue: number;
  }> {
    return this.makeRequest(`/customers/${id}/stats`);
  }

  // Criar novo cliente
  async createCustomer(data: CreateCustomerData): Promise<Customer> {
    const response = await this.makeRequest<ApiResponse<Customer>>(
      "/customers",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
    return response.customer!;
  }

  // Atualizar cliente
  async updateCustomer(
    id: string,
    data: UpdateCustomerData
  ): Promise<Customer> {
    const response = await this.makeRequest<ApiResponse<Customer>>(
      `/customers/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      }
    );
    return response.customer!;
  }

  // Deletar cliente
  async deleteCustomer(id: string): Promise<void> {
    await this.makeRequest(`/customers/${id}`, {
      method: "DELETE",
    });
  }
}

export const customerApi = new CustomerApi();
export { API_BASE_URL };
