/**
 * API Service para Recomendações com IA
 */

const API_BASE_URL = 'http://localhost:3002/api';

export interface RecommendationCard {
  id: string;
  name: string;
  type: string;
  rarity: string;
  price: number;
  stock: number;
  image?: string;
  description?: string;
  recommendationScore?: number;
  recommendationReasons?: string[];
}

export interface RecommendationResponse {
  recommendations: RecommendationCard[];
  count: number;
  type?: string;
  customerId?: string | null;
}

class RecommendationApi {
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
      console.error('API request failed:', error);
      throw error;
    }
  }

  /**
   * Busca recomendações personalizadas
   */
  async getRecommendations(
    customerId?: string,
    type: 'hybrid' | 'collaborative' | 'history' | 'popular' = 'hybrid',
    limit: number = 10
  ): Promise<RecommendationResponse> {
    const params = new URLSearchParams();
    if (customerId) params.append('customerId', customerId);
    params.append('type', type);
    params.append('limit', limit.toString());

    return this.makeRequest<RecommendationResponse>(
      `${API_BASE_URL}/recommendations?${params.toString()}`
    );
  }

  /**
   * Busca cartas mais populares
   */
  async getPopularRecommendations(limit: number = 10): Promise<RecommendationResponse> {
    return this.makeRequest<RecommendationResponse>(
      `${API_BASE_URL}/recommendations/popular?limit=${limit}`
    );
  }

  /**
   * Busca cartas similares a uma carta específica
   */
  async getSimilarRecommendations(
    cardId: string,
    limit: number = 10
  ): Promise<RecommendationResponse> {
    return this.makeRequest<RecommendationResponse>(
      `${API_BASE_URL}/recommendations/similar/${cardId}?limit=${limit}`
    );
  }

  /**
   * Busca recomendações para um cliente específico
   */
  async getCustomerRecommendations(
    customerId: string,
    type: 'hybrid' | 'collaborative' | 'history' | 'popular' = 'hybrid',
    limit: number = 10
  ): Promise<RecommendationResponse> {
    const params = new URLSearchParams();
    params.append('type', type);
    params.append('limit', limit.toString());

    return this.makeRequest<RecommendationResponse>(
      `${API_BASE_URL}/recommendations/customer/${customerId}?${params.toString()}`
    );
  }
}

export const recommendationApi = new RecommendationApi();


