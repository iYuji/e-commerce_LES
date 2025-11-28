/**
 * Serviço de Recomendação com IA Generativa (Gemini)
 * Implementa recomendações inteligentes usando Google Gemini AI
 * Mantém métodos tradicionais como fallback
 */

class RecommendationService {
  constructor(prisma) {
    this.prisma = prisma;
    this.geminiApiKey = 'AIzaSyD9aIcT6EuLyQM-Mm68-XlG1qJxuleEeeA';
    this.geminiModel = null;
    this.initializeGemini();
  }

  /**
   * Inicializa o cliente Gemini (lazy initialization)
   */
  async initializeGemini() {
    try {
      // Importação dinâmica do Gemini (CommonJS)
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(this.geminiApiKey);
      
      // Usa gemini-1.5-flash (mais rápido e estável)
      this.geminiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      console.log('✅ Gemini AI inicializado com modelo gemini-1.5-flash');
      
      return true;
    } catch (error) {
      console.error('❌ Erro ao inicializar Gemini AI:', error.message);
      console.error('Stack trace:', error.stack);
      console.log('⚠️ Usando métodos tradicionais como fallback');
      this.geminiModel = null;
      return false;
    }
  }

  /**
   * Garante que o Gemini está inicializado antes de usar
   */
  async ensureGeminiInitialized() {
    if (this.geminiModel) {
      return true;
    }
    
    // Tenta inicializar se ainda não foi feito
    if (!this._initializing) {
      this._initializing = true;
      await this.initializeGemini();
      this._initializing = false;
    }
    
    return this.geminiModel !== null;
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
   * 5. RECOMENDAÇÕES COM GEMINI AI
   * Usa IA generativa para criar recomendações inteligentes e personalizadas
   */
  async getGeminiRecommendations(customerId, limit = 10) {
    try {
      // Garante que o Gemini está inicializado
      const isInitialized = await this.ensureGeminiInitialized();
      
      // Se Gemini não está disponível, usa método tradicional
      if (!isInitialized || !this.geminiModel) {
        console.log('⚠️ Gemini não disponível, usando método híbrido tradicional');
        return this.getHybridRecommendationsTraditional(customerId, limit);
      }

      // Busca dados do cliente e histórico
      let customerData = null;
      let purchaseHistory = [];
      
      if (customerId) {
        const customer = await this.prisma.customer.findUnique({
          where: { id: customerId },
          include: {
            orders: {
              include: {
                orderItems: {
                  include: { card: true }
                }
              },
              orderBy: { createdAt: 'desc' },
              take: 10
            }
          }
        });

        if (customer) {
          customerData = {
            name: customer.name,
            email: customer.email
          };

          customer.orders.forEach(order => {
            order.orderItems.forEach(item => {
              purchaseHistory.push({
                cardName: item.card.name,
                cardType: item.card.type,
                cardRarity: item.card.rarity,
                price: item.card.price,
                quantity: item.quantity
              });
            });
          });
        }
      }

      // Busca todas as cartas disponíveis em estoque
      const availableCards = await this.prisma.card.findMany({
        where: { stock: { gt: 0 } },
        take: 100 // Limita para não sobrecarregar o prompt
      });

      // Prepara dados para o Gemini
      const purchasedCardIds = new Set();
      if (customerId && purchaseHistory.length > 0) {
        const orders = await this.prisma.order.findMany({
          where: { customerId },
          include: {
            orderItems: { select: { cardId: true } }
          }
        });
        orders.forEach(order => {
          order.orderItems.forEach(item => {
            purchasedCardIds.add(item.cardId);
          });
        });
      }

      // Filtra cartas já compradas
      const candidateCards = availableCards.filter(card => !purchasedCardIds.has(card.id));

      // Verifica se há cartas candidatas
      if (candidateCards.length === 0) {
        console.log('⚠️ Nenhuma carta candidata disponível, usando método tradicional');
        return this.getHybridRecommendationsTraditional(customerId, limit);
      }

      // Cria prompt para o Gemini
      const prompt = this.buildGeminiPrompt(customerData, purchaseHistory, candidateCards, limit);
      
      console.log('🤖 Enviando prompt para Gemini AI...');
      console.log(`📊 Cartas candidatas: ${candidateCards.length}, Limite: ${limit}`);

      // Chama o Gemini com tratamento de erro melhorado
      let text = '';
      try {
        const result = await this.geminiModel.generateContent(prompt);
        const response = await result.response;
        text = response.text();
        console.log('✅ Resposta recebida do Gemini:', text.substring(0, 200) + '...');
      } catch (geminiError) {
        console.error('❌ Erro ao chamar Gemini API:', geminiError.message);
        console.error('Detalhes:', geminiError);
        throw geminiError;
      }

      // Parseia a resposta do Gemini
      const recommendedCardIds = this.parseGeminiResponse(text, candidateCards, limit);
      console.log(`📋 IDs recomendados pelo Gemini: ${recommendedCardIds.join(', ')}`);

      // Busca as cartas recomendadas
      const recommendedCards = await this.prisma.card.findMany({
        where: {
          id: { in: recommendedCardIds },
          stock: { gt: 0 }
        }
      });

      console.log(`✅ ${recommendedCards.length} cartas encontradas das ${recommendedCardIds.length} recomendadas`);

      // Se não encontrou cartas suficientes, complementa com método tradicional
      if (recommendedCards.length < limit) {
        console.log(`⚠️ Apenas ${recommendedCards.length} cartas encontradas, complementando com método tradicional...`);
        const traditionalRecs = await this.getHybridRecommendationsTraditional(customerId, limit - recommendedCards.length);
        const existingIds = new Set(recommendedCards.map(c => c.id));
        const additionalRecs = traditionalRecs.filter(c => !existingIds.has(c.id));
        recommendedCards.push(...additionalRecs);
      }

      // Adiciona scores e razões baseadas na IA
      const recommendations = recommendedCards.map((card, index) => ({
        ...card,
        recommendationScore: 1 - (index * 0.05), // Score decrescente baseado na ordem
        recommendationReasons: [
          'Recomendação personalizada gerada por IA (Gemini)',
          `Baseado em análise inteligente do seu perfil${customerData ? ` e histórico de compras` : ''}`
        ]
      }));

      return recommendations.slice(0, limit);
    } catch (error) {
      console.error('❌ Erro ao obter recomendações do Gemini:', error.message);
      console.error('Stack completo:', error.stack);
      // Fallback para método tradicional
      console.log('🔄 Usando fallback para método tradicional...');
      return this.getHybridRecommendationsTraditional(customerId, limit);
    }
  }

  /**
   * Constrói o prompt para o Gemini
   */
  buildGeminiPrompt(customerData, purchaseHistory, candidateCards, limit) {
    let prompt = `Você é um assistente especializado em recomendações de cartas colecionáveis (Pokémon Cards).

TAREFA: Analise o perfil do cliente e recomende ${limit} cartas que ele provavelmente gostaria de comprar.

`;

    if (customerData && purchaseHistory.length > 0) {
      prompt += `PERFIL DO CLIENTE:
- Nome: ${customerData.name}
- Histórico de compras recentes:
${purchaseHistory.map((item, idx) => 
  `${idx + 1}. ${item.cardName} (Tipo: ${item.cardType}, Raridade: ${item.cardRarity}, Preço: R$ ${item.price.toFixed(2)}, Quantidade: ${item.quantity})`
).join('\n')}

`;
    } else {
      prompt += `PERFIL DO CLIENTE: Cliente novo sem histórico de compras.\n\n`;
    }

    prompt += `CARTAS DISPONÍVEIS PARA RECOMENDAÇÃO:
${candidateCards.slice(0, 50).map((card, idx) => 
  `${idx + 1}. ID: ${card.id} | Nome: ${card.name} | Tipo: ${card.type} | Raridade: ${card.rarity} | Preço: R$ ${card.price.toFixed(2)} | Estoque: ${card.stock}`
).join('\n')}

INSTRUÇÕES IMPORTANTES:
1. Analise o padrão de compras do cliente (se houver histórico)
2. Identifique preferências por tipo, raridade e faixa de preço
3. Recomende exatamente ${limit} cartas que combinem com o perfil do cliente
4. Considere diversidade (diferentes tipos e raridades) se apropriado
5. Use APENAS IDs que existem na lista de cartas disponíveis acima
6. Retorne APENAS uma linha com os IDs numéricos separados por vírgula
7. Formato OBRIGATÓRIO: "IDs: id1,id2,id3,id4,..." (sem espaços, sem texto adicional)

EXEMPLO DE RESPOSTA CORRETA:
IDs: 1,5,12,23,45,67,89,102

RESPOSTA (apenas a linha com os IDs):`;

    return prompt;
  }

  /**
   * Parseia a resposta do Gemini para extrair IDs de cartas
   */
  parseGeminiResponse(text, candidateCards, limit = 10) {
    try {
      console.log('🔍 Parseando resposta do Gemini...');
      console.log('📝 Texto recebido:', text.substring(0, 500));
      
      // Cria um mapa de IDs para validação rápida
      const validIds = new Set(candidateCards.map(card => String(card.id)));
      console.log(`✅ ${validIds.size} IDs válidos para validação`);
      
      // Tenta múltiplos padrões para extrair IDs
      let ids = [];
      
      // Padrão 1: "IDs: id1,id2,id3" (sem espaços)
      const pattern1 = text.match(/IDs?:\s*([\d,]+)/i);
      if (pattern1) {
        ids = pattern1[1].split(',').map(id => id.trim()).filter(Boolean);
        console.log('✅ Padrão 1 encontrado:', ids.length, 'IDs');
      }
      
      // Padrão 2: "IDs: id1, id2, id3" (com espaços)
      if (ids.length === 0) {
        const pattern2 = text.match(/IDs?:\s*([\d,\s]+)/i);
        if (pattern2) {
          ids = pattern2[1].split(',').map(id => id.trim()).filter(Boolean);
          console.log('✅ Padrão 2 encontrado:', ids.length, 'IDs');
        }
      }
      
      // Padrão 3: Lista de números separados por vírgula em qualquer lugar
      if (ids.length === 0) {
        const pattern3 = text.match(/(\d+(?:\s*,\s*\d+){2,})/);
        if (pattern3) {
          ids = pattern3[1].split(',').map(id => id.trim()).filter(Boolean);
          console.log('✅ Padrão 3 encontrado:', ids.length, 'IDs');
        }
      }
      
      // Padrão 4: Números isolados no texto (primeiros números encontrados)
      if (ids.length === 0) {
        const allNumbers = text.match(/\b\d+\b/g);
        if (allNumbers) {
          ids = allNumbers.filter(id => validIds.has(id));
          console.log('✅ Padrão 4 encontrado:', ids.length, 'IDs válidos');
        }
      }
      
      // Valida e filtra apenas IDs válidos
      const validCardIds = ids
        .filter(id => validIds.has(String(id)))
        .slice(0, limit || 10);
      
      console.log(`✅ ${validCardIds.length} IDs válidos após filtragem`);
      
      if (validCardIds.length > 0) {
        return validCardIds;
      }

      // Se não encontrou IDs válidos, tenta encontrar nomes de cartas
      console.log('⚠️ Tentando encontrar cartas por nome...');
      const cardIdsByName = [];
      candidateCards.forEach(card => {
        const cardNameLower = card.name.toLowerCase();
        if (text.toLowerCase().includes(cardNameLower) && !cardIdsByName.includes(card.id)) {
          cardIdsByName.push(card.id);
        }
      });

      if (cardIdsByName.length > 0) {
        console.log(`✅ ${cardIdsByName.length} cartas encontradas por nome`);
        return cardIdsByName.slice(0, limit || 10);
      }

      // Fallback: retorna as primeiras cartas disponíveis ordenadas por raridade
      console.log('⚠️ Usando fallback: cartas ordenadas por raridade');
      const rarityOrder = { 'Legendary': 5, 'Mythic': 4, 'Rare': 3, 'Uncommon': 2, 'Common': 1 };
      return candidateCards
        .sort((a, b) => (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0))
        .slice(0, limit || 10)
        .map(card => card.id);
    } catch (error) {
      console.error('❌ Erro ao parsear resposta do Gemini:', error);
      console.error('Stack:', error.stack);
      // Fallback: retorna as primeiras cartas disponíveis
      return candidateCards.slice(0, limit || 10).map(card => card.id);
    }
  }

  /**
   * 6. RECOMENDAÇÕES HÍBRIDAS TRADICIONAIS (Fallback)
   * Combina diferentes métodos para melhor precisão (método antigo)
   */
  async getHybridRecommendationsTraditional(customerId, limit = 10) {
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
   * Agora usa Gemini AI como método padrão para 'hybrid'
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
        case 'gemini':
          // Método explícito para usar Gemini
          return await this.getGeminiRecommendations(customerId, limit);
        case 'hybrid':
        default:
          // Usa Gemini como método principal, com fallback automático
          return await this.getGeminiRecommendations(customerId, limit);
      }
    } catch (error) {
      console.error('Error getting recommendations:', error);
      // Fallback para método tradicional em caso de erro
      if (type === 'hybrid' || type === 'gemini') {
        return await this.getHybridRecommendationsTraditional(customerId, limit);
      }
      return [];
    }
  }
}

module.exports = RecommendationService;

