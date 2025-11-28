/**
 * API Service para Chat com IA
 */

const API_BASE_URL = 'http://localhost:3002/api';

export interface ChatResponse {
  text: string;
  cards: ChatCard[];
}

export interface ChatCard {
  id: string;
  name: string;
  type: string;
  rarity: string;
  price: number;
  stock: number;
  image?: string;
  description?: string;
}

class ChatApi {
  private async makeRequest<T>(url: string, options?: RequestInit): Promise<T> {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Chat API request failed:', error);
      throw error;
    }
  }

  /**
   * Envia uma mensagem para o chat e recebe resposta da IA
   * @param message - Mensagem do usuário
   * @param customerId - ID do cliente (opcional, para contexto personalizado)
   */
  async sendMessage(message: string, customerId?: string): Promise<ChatResponse> {
    return this.makeRequest<ChatResponse>(`${API_BASE_URL}/chat`, {
      method: 'POST',
      body: JSON.stringify({ message, customerId }),
    });
  }
}

export const chatApi = new ChatApi();

