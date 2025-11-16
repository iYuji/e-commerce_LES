/**
 * Serviço de Recomendação com IA
 * Implementa múltiplos algoritmos de recomendação:
 * - Filtragem Colaborativa (User-based)
 * - Filtragem Baseada em Conteúdo
 * - Recomendações Populares
 * - Recomendações Híbridas
 */

class RecommendationService {
  constructor(prisma) {
    this.prisma = prisma;
  }

  /**
   * Calcula similaridade de cosseno entre dois vetores
   */
  cosineSimilarity(vecA, vecB) {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    
    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Calcula similaridade de Jaccard entre dois conjuntos
   */
  jaccardSimilarity(setA, setB) {
    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    return union.size === 0 ? 0 : intersection.size / union.size;
  }

  /**
   * Extrai características de uma carta para vetorização
   */
  extractCardFeatures(card) {
    // Normaliza características em um vetor numérico
    const rarityMap = { 'Common': 1, 'Uncommon': 2, 'Rare': 3, 'Legendary': 4, 'Mythic': 5 };
    const typeMap = {
      'Electric': 1, 'Fire': 2, 'Water': 3, 'Grass': 4, 'Psychic': 5,
      'Fighting': 6, 'Normal': 7, 'Flying': 8, 'Poison': 9, 'Ground': 10,
      'Rock': 11, 'Bug': 12, 'Ghost': 13, 'Steel': 14, 'Ice': 15,
      'Dragon': 16, 'Dark': 17, 'Fairy': 18
    };
    
    return {
      rarity: rarityMap[card.rarity] || 1,
      type: typeMap[card.type] || 0,
      price: card.price,
      stock: card.stock,
      vector: [
        rarityMap[card.rarity] || 1,
        typeMap[card.type] || 0,
        Math.log10(card.price + 1), // Log para normalizar preço
        Math.min(card.stock / 100, 1) // Normaliza estoque
      ]
    };
  }

  /**
   * 1. FILTRAGEM BASEADA EM CONTEÚDO
   * Recomenda cartas similares baseadas nas características
   */
  async getContentBasedRecommendations(cardId, limit = 10) {
    try {
      const targetCard = await this.prisma.card.findUnique({ where: { id: cardId } });
      if (!targetCard) return [];

      const targetFeatures = this.extractCardFeatures(targetCard);
      const allCards = await this.prisma.card.findMany({
        where: {
          id: { not: cardId },
          stock: { gt: 0 } // Apenas cartas em estoque
        }
      });

      const recommendations = allCards.map(card => {
        const cardFeatures = this.extractCardFeatures(card);
        const similarity = this.cosineSimilarity(targetFeatures.vector, cardFeatures.vector);
        
        return {
          card,
          score: similarity,
          reasons: [
            card.type === targetCard.type ? 'Mesmo tipo' : null,
            card.rarity === targetCard.rarity ? 'Mesma raridade' : null,
            Math.abs(card.price - targetCard.price) < targetCard.price * 0.3 ? 'Preço similar' : null
          ].filter(Boolean)
        };
      });

      return recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(r => ({
          ...r.card,
          recommendationScore: r.score,
          recommendationReasons: r.reasons
        }));
    } catch (error) {
      console.error('Error in content-based recommendations:', error);
      return [];
    }
  }

  /**
   * 2. FILTRAGEM COLABORATIVA (User-based)
   * Encontra usuários similares e recomenda cartas que eles compraram
   */
  async getCollaborativeRecommendations(customerId, limit = 10) {
    try {
      // Busca histórico de compras do cliente
      const customerOrders = await this.prisma.order.findMany({
        where: { customerId },
        include: {
          orderItems: {
            include: { card: true }
          }
        }
      });

      if (customerOrders.length === 0) {
        // Se não tem histórico, retorna recomendações populares
        return this.getPopularRecommendations(limit);
      }

      // Cria perfil do cliente (cartas que ele comprou)
      const customerCardIds = new Set();
      customerOrders.forEach(order => {
        order.orderItems.forEach(item => {
          customerCardIds.add(item.cardId);
        });
      });

      // Busca todos os outros clientes e seus pedidos
      const allCustomers = await this.prisma.customer.findMany({
        where: { id: { not: customerId } },
        include: {
          orders: {
            include: {
              orderItems: {
                include: { card: true }
              }
            }
          }
        }
      });

      // Calcula similaridade com outros clientes
      const similarCustomers = allCustomers.map(otherCustomer => {
        const otherCardIds = new Set();
        otherCustomer.orders.forEach(order => {
          order.orderItems.forEach(item => {
            otherCardIds.add(item.cardId);
          });
        });

        const similarity = this.jaccardSimilarity(customerCardIds, otherCardIds);
        return {
          customer: otherCustomer,
          similarity,
          cardIds: otherCardIds
        };
      });

      // Ordena por similaridade e pega os top N
      const topSimilar = similarCustomers
        .filter(c => c.similarity > 0)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5);

      // Coleta cartas dos clientes similares que o cliente ainda não comprou
      const recommendedCardIds = new Set();
      const cardScores = new Map();

      topSimilar.forEach(({ cardIds, similarity }) => {
        cardIds.forEach(cardId => {
          if (!customerCardIds.has(cardId)) {
            recommendedCardIds.add(cardId);
            const currentScore = cardScores.get(cardId) || 0;
            cardScores.set(cardId, currentScore + similarity);
          }
        });
      });

      // Busca as cartas recomendadas
      const recommendedCards = await this.prisma.card.findMany({
        where: {
          id: { in: Array.from(recommendedCardIds) },
          stock: { gt: 0 }
        }
      });

      // Adiciona scores e ordena
      const recommendations = recommendedCards.map(card => ({
        ...card,
        recommendationScore: cardScores.get(card.id) || 0,
        recommendationReasons: ['Clientes com gostos similares compraram esta carta']
      }));

      return recommendations
        .sort((a, b) => b.recommendationScore - a.recommendationScore)
        .slice(0, limit);
    } catch (error) {
      console.error('Error in collaborative recommendations:', error);
      return [];
    }
  }

  /**
   * 3. RECOMENDAÇÕES POPULARES
   * Baseado em vendas e popularidade
   */
  async getPopularRecommendations(limit = 10) {
    try {
      // Busca todas as cartas vendidas
      const orderItems = await this.prisma.orderItem.findMany({
        include: {
          card: true
        }
      });

      // Calcula popularidade (quantidade vendida)
      const cardPopularity = new Map();
      orderItems.forEach(item => {
        const current = cardPopularity.get(item.cardId) || 0;
        cardPopularity.set(item.cardId, current + item.quantity);
      });

      // Busca todas as cartas em estoque
      const allCards = await this.prisma.card.findMany({
        where: { stock: { gt: 0 } }
      });

      // Adiciona scores de popularidade
      const recommendations = allCards.map(card => ({
        ...card,
        recommendationScore: cardPopularity.get(card.id) || 0,
        recommendationReasons: cardPopularity.get(card.id) 
          ? [`${cardPopularity.get(card.id)} unidades vendidas`]
          : ['Carta popular no catálogo']
      }));

      // Se não há vendas, ordena por raridade e preço
      if (cardPopularity.size === 0) {
        const rarityOrder = { 'Legendary': 5, 'Rare': 4, 'Uncommon': 3, 'Common': 2 };
        return recommendations
          .sort((a, b) => {
            const rarityDiff = (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0);
            if (rarityDiff !== 0) return rarityDiff;
            return b.price - a.price;
          })
          .slice(0, limit);
      }

      return recommendations
        .sort((a, b) => b.recommendationScore - a.recommendationScore)
        .slice(0, limit);
    } catch (error) {
      console.error('Error in popular recommendations:', error);
      return [];
    }
  }

  /**
   * 4. RECOMENDAÇÕES BASEADAS NO HISTÓRICO DO CLIENTE
   * Analisa padrões de compra do cliente
   */
  async getHistoryBasedRecommendations(customerId, limit = 10) {
    try {
      const orders = await this.prisma.order.findMany({
        where: { customerId },
        include: {
          orderItems: {
            include: { card: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      if (orders.length === 0) {
        return this.getPopularRecommendations(limit);
      }

      // Analisa preferências do cliente
      const typeFrequency = new Map();
      const rarityFrequency = new Map();
      const priceRange = { min: Infinity, max: 0 };
      const purchasedCardIds = new Set();

      orders.forEach(order => {
        order.orderItems.forEach(item => {
          purchasedCardIds.add(item.cardId);
          const card = item.card;
          
          typeFrequency.set(card.type, (typeFrequency.get(card.type) || 0) + item.quantity);
          rarityFrequency.set(card.rarity, (rarityFrequency.get(card.rarity) || 0) + item.quantity);
          priceRange.min = Math.min(priceRange.min, card.price);
          priceRange.max = Math.max(priceRange.max, card.price);
        });
      });

      // Encontra tipo e raridade preferidos
      const favoriteType = Array.from(typeFrequency.entries())
        .sort((a, b) => b[1] - a[1])[0]?.[0];
      const favoriteRarity = Array.from(rarityFrequency.entries())
        .sort((a, b) => b[1] - a[1])[0]?.[0];

      // Busca cartas similares que o cliente ainda não comprou
      const recommendations = await this.prisma.card.findMany({
        where: {
          id: { notIn: Array.from(purchasedCardIds) },
          stock: { gt: 0 },
          OR: [
            favoriteType ? { type: favoriteType } : {},
            favoriteRarity ? { rarity: favoriteRarity } : {},
            {
              price: {
                gte: priceRange.min * 0.7,
                lte: priceRange.max * 1.3
              }
            }
          ]
        }
      });

      // Calcula scores baseados em preferências
      const scoredRecommendations = recommendations.map(card => {
        let score = 0;
        const reasons = [];

        if (card.type === favoriteType) {
          score += 3;
          reasons.push(`Você gosta de cartas do tipo ${favoriteType}`);
        }
        if (card.rarity === favoriteRarity) {
          score += 2;
          reasons.push(`Você prefere cartas ${favoriteRarity}`);
        }
        if (card.price >= priceRange.min * 0.8 && card.price <= priceRange.max * 1.2) {
          score += 1;
          reasons.push('Preço dentro da sua faixa de compra');
        }

        return {
          ...card,
          recommendationScore: score,
          recommendationReasons: reasons
        };
      });

      return scoredRecommendations
        .sort((a, b) => b.recommendationScore - a.recommendationScore)
        .slice(0, limit);
    } catch (error) {
      console.error('Error in history-based recommendations:', error);
      return [];
    }
  }

  /**
   * 5. RECOMENDAÇÕES HÍBRIDAS (Combina múltiplos algoritmos)
   * Combina diferentes métodos para melhor precisão
   */
  async getHybridRecommendations(customerId, limit = 10) {
    try {
      const [contentBased, collaborative, historyBased, popular] = await Promise.all([
        customerId ? this.getHistoryBasedRecommendations(customerId, limit * 2) : [],
        customerId ? this.getCollaborativeRecommendations(customerId, limit * 2) : [],
        customerId ? this.getHistoryBasedRecommendations(customerId, limit * 2) : [],
        this.getPopularRecommendations(limit * 2)
      ]);

      // Combina e pontua recomendações
      const cardScores = new Map();
      const cardReasons = new Map();

      // Peso para cada algoritmo
      const weights = {
        content: 0.2,
        collaborative: 0.3,
        history: 0.3,
        popular: 0.2
      };

      [contentBased, collaborative, historyBased, popular].forEach((recommendations, index) => {
        const weight = Object.values(weights)[index];
        recommendations.forEach(card => {
          const currentScore = cardScores.get(card.id) || 0;
          const cardScore = (card.recommendationScore || 1) * weight;
          cardScores.set(card.id, currentScore + cardScore);
          
          const currentReasons = cardReasons.get(card.id) || [];
          cardReasons.set(card.id, [
            ...currentReasons,
            ...(card.recommendationReasons || [])
          ]);
        });
      });

      // Busca todas as cartas únicas recomendadas
      const uniqueCardIds = Array.from(cardScores.keys());
      const cards = await this.prisma.card.findMany({
        where: {
          id: { in: uniqueCardIds },
          stock: { gt: 0 }
        }
      });

      // Adiciona scores e razões
      const recommendations = cards.map(card => ({
        ...card,
        recommendationScore: cardScores.get(card.id) || 0,
        recommendationReasons: [...new Set(cardReasons.get(card.id) || [])]
      }));

      return recommendations
        .sort((a, b) => b.recommendationScore - a.recommendationScore)
        .slice(0, limit);
    } catch (error) {
      console.error('Error in hybrid recommendations:', error);
      return [];
    }
  }

  /**
   * Método principal: obtém recomendações personalizadas
   */
  async getRecommendations(customerId = null, type = 'hybrid', limit = 10) {
    try {
      switch (type) {
        case 'content':
          // Requer cardId, não customerId
          return [];
        case 'collaborative':
          return customerId 
            ? await this.getCollaborativeRecommendations(customerId, limit)
            : await this.getPopularRecommendations(limit);
        case 'history':
          return customerId
            ? await this.getHistoryBasedRecommendations(customerId, limit)
            : await this.getPopularRecommendations(limit);
        case 'popular':
          return await this.getPopularRecommendations(limit);
        case 'hybrid':
        default:
          return await this.getHybridRecommendations(customerId, limit);
      }
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return [];
    }
  }
}

module.exports = RecommendationService;


