/**
 * Serviço de Chat com IA Generativa (Gemini)
 * Processa mensagens do usuário e gera respostas inteligentes sobre cartas
 */

class ChatService {
  constructor(prisma) {
    this.prisma = prisma;
    this.geminiApiKey = 'AIzaSyD9aIcT6EuLyQM-Mm68-XlG1qJxuleEeeA';
    this.geminiModel = null;
    this._initializing = false;
    this.initializeGemini();
  }

  /**
   * Inicializa o cliente Gemini
   */
  async initializeGemini() {
    try {
      console.log('🔄 Inicializando Gemini AI no Chat Service...');
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(this.geminiApiKey);
      
      // Usa gemini-1.5-flash (mais rápido e barato)
      this.geminiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      console.log('✅ Chat Service - Gemini AI inicializado com modelo gemini-1.5-flash');
      return true;
    } catch (error) {
      console.error('❌ Erro ao inicializar Gemini AI no Chat Service:', error.message);
      console.error('Stack:', error.stack);
      this.geminiModel = null;
      return false;
    }
  }

  /**
   * Garante que o Gemini está inicializado
   */
  async ensureGeminiInitialized() {
    if (this.geminiModel) {
      return true;
    }
    
    if (!this._initializing) {
      this._initializing = true;
      await this.initializeGemini();
      this._initializing = false;
    }
    
    return this.geminiModel !== null;
  }

  /**
   * Processa uma mensagem do usuário e retorna resposta inteligente com cartas relacionadas
   */
  async processMessage(userMessage, customerId = null) {
    try {
      // Garante que o Gemini está inicializado
      const isInitialized = await this.ensureGeminiInitialized();
      
      if (!isInitialized || !this.geminiModel) {
        console.log('⚠️ Gemini não disponível no Chat Service, usando fallback');
        return this.getFallbackResponse(userMessage);
      }

      // Busca todas as cartas disponíveis
      const allCards = await this.prisma.card.findMany({
        where: { stock: { gt: 0 } },
        take: 100 // Limita para não sobrecarregar o prompt
      });

      // Busca histórico do cliente se disponível
      let customerHistory = null;
      if (customerId) {
        const orders = await this.prisma.order.findMany({
          where: { customerId },
          include: {
            orderItems: {
              include: { card: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        });

        if (orders.length > 0) {
          customerHistory = orders.map(order => ({
            date: order.createdAt,
            items: order.orderItems.map(item => ({
              cardName: item.card.name,
              quantity: item.quantity
            }))
          }));
        }
      }

      // Cria o prompt para o Gemini
      const prompt = this.buildChatPrompt(userMessage, allCards, customerHistory);

      console.log('🤖 Processando mensagem do chat com Gemini...');
      console.log(`📝 Mensagem do usuário: "${userMessage}"`);
      console.log(`📊 Total de cartas no contexto: ${allCards.length}`);

      // Chama o Gemini
      let aiResponse;
      try {
        const result = await this.geminiModel.generateContent(prompt);
        const response = await result.response;
        aiResponse = response.text();
        console.log('✅ Resposta do Gemini recebida');
        console.log(`📄 Resposta (primeiros 200 chars): ${aiResponse.substring(0, 200)}...`);
      } catch (geminiError) {
        console.error('❌ Erro ao chamar Gemini API:', geminiError.message);
        console.error('Stack:', geminiError.stack);
        throw geminiError; // Re-lança para ser capturado pelo catch externo
      }

      // Extrai cartas mencionadas ou relacionadas da resposta
      let relatedCards = this.extractRelatedCards(aiResponse, allCards, userMessage);

      // Se não encontrou cartas mas a pergunta é sobre raridade, força busca por raridade
      if (relatedCards.length === 0) {
        const lowerMessage = userMessage.toLowerCase();
        const rarityMap = {
          'common': ['comum', 'common', 'comuns'],
          'uncommon': ['incomum', 'uncommon', 'incomuns'],
          'rare': ['rara', 'rare', 'raras', 'raros'],
          'legendary': ['lendária', 'lendaria', 'legendary', 'lendárias', 'lendarias', 'lendário', 'lendarios'],
          'mythic': ['mítica', 'mitica', 'mythic', 'míticas', 'miticas'],
          'epic': ['épica', 'epica', 'epic', 'épicas', 'epicas']
        };

        for (const [rarity, words] of Object.entries(rarityMap)) {
          if (words.some(word => lowerMessage.includes(word.toLowerCase()))) {
            relatedCards = allCards.filter(c => c.rarity.toLowerCase() === rarity).slice(0, 8);
            console.log(`📋 Forçando busca por raridade: ${rarity}, encontradas ${relatedCards.length} cartas`);
            break;
          }
        }
      }

      // Converte para formato JSON serializável
      const cardsData = relatedCards.slice(0, 8).map(card => ({
        id: card.id,
        name: card.name,
        type: card.type,
        rarity: card.rarity,
        price: Number(card.price),
        stock: Number(card.stock),
        image: card.image || null,
        description: card.description || null,
      }));

      return {
        text: aiResponse,
        cards: cardsData
      };

    } catch (error) {
      console.error('❌ Erro ao processar mensagem com Gemini:', error);
      console.error('Stack completo:', error.stack);
      
      // Sempre tenta o fallback que tem lógica inteligente para raridades
      const fallbackResponse = await this.getFallbackResponse(userMessage);
      console.log('🔄 Usando resposta de fallback:', {
        textLength: fallbackResponse.text?.length || 0,
        cardsCount: fallbackResponse.cards?.length || 0
      });
      return fallbackResponse;
    }
  }

  /**
   * Constrói o prompt para o Gemini baseado na mensagem do usuário
   */
  buildChatPrompt(userMessage, cards, customerHistory) {
    let prompt = `Você é um assistente especializado em cartas colecionáveis (Pokémon Cards) de uma loja online.

CONTEXTO DA LOJA:
- Você ajuda clientes a encontrar cartas, entender raridades, tipos, preços e fazer recomendações
- Seja amigável, prestativo e use linguagem natural em português brasileiro
- Quando mencionar cartas específicas, use os nomes exatos que estão no catálogo

`;

    if (customerHistory && customerHistory.length > 0) {
      prompt += `HISTÓRICO DO CLIENTE:
${customerHistory.map((order, idx) => 
  `Compra ${idx + 1} (${new Date(order.date).toLocaleDateString('pt-BR')}): ${order.items.map(i => `${i.quantity}x ${i.cardName}`).join(', ')}`
).join('\n')}

`;
    }

    prompt += `CATÁLOGO DE CARTAS DISPONÍVEIS:
${cards.slice(0, 50).map((card, idx) => 
  `${idx + 1}. ${card.name} - Tipo: ${card.type}, Raridade: ${card.rarity}, Preço: R$ ${card.price.toFixed(2)}, Estoque: ${card.stock}`
).join('\n')}

TIPOS DE CARTAS DISPONÍVEIS: ${[...new Set(cards.map(c => c.type))].join(', ')}
RARIDADES DISPONÍVEIS: ${[...new Set(cards.map(c => c.rarity))].join(', ')}

MENSAGEM DO CLIENTE: "${userMessage}"

INSTRUÇÕES IMPORTANTES:
1. Responda de forma natural e conversacional em português brasileiro
2. Se o cliente perguntar sobre RARIDADES (ex: "cartas raras", "cartas lendárias", "cartas comuns"):
   - Identifique a raridade mencionada (Common, Uncommon, Rare, Legendary, Mythic, Epic)
   - Liste algumas cartas dessa raridade do catálogo acima
   - Explique brevemente o que torna essas cartas especiais
   - Mencione quantas cartas dessa raridade estão disponíveis
3. Se perguntar sobre TIPOS (ex: "cartas de fogo", "tipo água"):
   - Liste cartas do tipo mencionado
   - Explique características do tipo
4. Se o cliente mencionar um nome de carta específico (ex: "Pikachu"):
   - Procure no catálogo acima e forneça informações detalhadas sobre essa carta
   - Mencione tipo, raridade, preço e estoque
5. Se perguntar sobre preços, seja específico com valores do catálogo
6. SEMPRE mencione nomes de cartas do catálogo quando relevante
7. Seja útil e prestativo, mas não invente informações que não estão no catálogo

MAPEAMENTO DE RARIDADES:
- "Comum" ou "Common" = Common
- "Incomum" ou "Uncommon" = Uncommon  
- "Rara" ou "Rare" = Rare
- "Lendária" ou "Legendary" = Legendary
- "Mítica" ou "Mythic" = Mythic
- "Épica" ou "Epic" = Epic

RESPOSTA:`;

    return prompt;
  }

  /**
   * Extrai cartas relacionadas da resposta do Gemini e da mensagem do usuário
   */
  extractRelatedCards(aiResponse, allCards, userMessage) {
    const relatedCards = [];
    const lowerResponse = aiResponse.toLowerCase();
    const lowerMessage = userMessage.toLowerCase();

    // Busca por nomes de cartas mencionados
    allCards.forEach(card => {
      const cardNameLower = card.name.toLowerCase();
      
      // Se a carta é mencionada na resposta ou na mensagem do usuário
      if (lowerResponse.includes(cardNameLower) || lowerMessage.includes(cardNameLower)) {
        if (!relatedCards.find(c => c.id === card.id)) {
          relatedCards.push(card);
        }
      }
    });

    // Se não encontrou cartas específicas, tenta buscar por tipo ou raridade mencionados
    // PRIORIDADE: Raridade primeiro (mais comum nas perguntas)
    const rarityWords = {
      'common': ['comum', 'common', 'comuns'],
      'uncommon': ['incomum', 'uncommon', 'incomuns'],
      'rare': ['rara', 'rare', 'raras', 'raros'],
      'legendary': ['lendária', 'lendaria', 'legendary', 'lendárias', 'lendarias', 'lendário', 'lendarios'],
      'mythic': ['mítica', 'mitica', 'mythic', 'míticas', 'miticas'],
      'epic': ['épica', 'epica', 'epic', 'épicas', 'epicas']
    };

    // Verifica se a mensagem ou resposta menciona raridade
    let foundRarity = false;
    for (const [rarity, words] of Object.entries(rarityWords)) {
      const mentioned = words.some(word => {
        const wordLower = word.toLowerCase();
        // Busca na mensagem original e na resposta do Gemini
        return lowerMessage.includes(wordLower) || 
               lowerResponse.includes(wordLower) ||
               lowerMessage.includes(`cartas ${wordLower}`) ||
               lowerMessage.includes(`carta ${wordLower}`);
      });
      
      if (mentioned) {
        const rarityCards = allCards.filter(c => c.rarity.toLowerCase() === rarity);
        relatedCards.push(...rarityCards.slice(0, 8)); // Mais cartas para raridades
        foundRarity = true;
        break; // Para na primeira raridade encontrada
      }
    }

    // Se não encontrou por raridade, tenta por tipo
    if (!foundRarity && relatedCards.length === 0) {
      const types = ['fire', 'water', 'electric', 'grass', 'psychic', 'fighting', 'normal', 'flying', 'poison', 'ground', 'rock', 'bug', 'ghost', 'steel', 'ice', 'dragon', 'dark', 'fairy'];

      types.forEach(type => {
        const typeWords = {
          'fire': ['fogo', 'fire'],
          'water': ['água', 'agua', 'water'],
          'electric': ['elétrico', 'eletrico', 'electric'],
          'grass': ['grama', 'grass', 'planta'],
          'psychic': ['psíquico', 'psiquico', 'psychic'],
          'fighting': ['lutador', 'fighting', 'luta'],
          'normal': ['normal'],
          'flying': ['voador', 'flying', 'voo'],
          'poison': ['veneno', 'poison'],
          'ground': ['terra', 'ground'],
          'rock': ['pedra', 'rock'],
          'bug': ['inseto', 'bug'],
          'ghost': ['fantasma', 'ghost'],
          'steel': ['aço', 'aco', 'steel'],
          'ice': ['gelo', 'ice'],
          'dragon': ['dragão', 'dragao', 'dragon'],
          'dark': ['sombrio', 'dark', 'trevas'],
          'fairy': ['fada', 'fairy']
        };

        if (typeWords[type]?.some(word => lowerResponse.includes(word) || lowerMessage.includes(word))) {
          const typeCards = allCards.filter(c => c.type.toLowerCase().includes(type));
          relatedCards.push(...typeCards.slice(0, 6));
        }
      });
    }

    // Remove duplicatas
    const uniqueCards = [];
    const seenIds = new Set();
    relatedCards.forEach(card => {
      if (!seenIds.has(card.id)) {
        seenIds.add(card.id);
        uniqueCards.push(card);
      }
    });

    return uniqueCards;
  }

  /**
   * Resposta de fallback quando o Gemini não está disponível
   */
  async getFallbackResponse(userMessage) {
    const lowerMessage = userMessage.toLowerCase();
    const cards = await this.prisma.card.findMany({
      where: { stock: { gt: 0 } },
      take: 100
    });

    // Mapeamento de raridades
    const rarityMap = {
      'common': ['comum', 'common', 'comuns'],
      'uncommon': ['incomum', 'uncommon', 'incomuns'],
      'rare': ['rara', 'rare', 'raras', 'raros'],
      'legendary': ['lendária', 'lendaria', 'legendary', 'lendárias', 'lendarias', 'lendário', 'lendarios'],
      'mythic': ['mítica', 'mitica', 'mythic', 'míticas', 'miticas'],
      'epic': ['épica', 'epica', 'epic', 'épicas', 'epicas']
    };

    // Verifica se é pergunta sobre raridade
    let matchedRarity = null;
    for (const [rarity, words] of Object.entries(rarityMap)) {
      if (words.some(word => lowerMessage.includes(word.toLowerCase()))) {
        matchedRarity = rarity;
        break;
      }
    }

    if (matchedRarity) {
      const rarityCards = cards.filter(card => 
        card.rarity.toLowerCase() === matchedRarity
      );

      const rarityNames = {
        'common': 'Comuns',
        'uncommon': 'Incomuns',
        'rare': 'Raras',
        'legendary': 'Lendárias',
        'mythic': 'Míticas',
        'epic': 'Épicas'
      };

      const cardsData = rarityCards.slice(0, 12).map(card => ({
        id: card.id,
        name: card.name,
        type: card.type,
        rarity: card.rarity,
        price: Number(card.price),
        stock: Number(card.stock),
        image: card.image || null,
        description: card.description || null,
      }));

      return {
        text: rarityCards.length > 0
          ? `Encontrei ${rarityCards.length} carta(s) ${rarityNames[matchedRarity]} disponíveis na loja! Estas são algumas opções:`
          : `No momento não temos cartas ${rarityNames[matchedRarity]} em estoque.`,
        cards: cardsData
      };
    }

    // Busca por tipo
    const typeMap = {
      'fire': ['fogo', 'fire'],
      'water': ['água', 'agua', 'water'],
      'electric': ['elétrico', 'eletrico', 'electric'],
      'grass': ['grama', 'grass', 'planta'],
    };

    let matchedType = null;
    for (const [type, words] of Object.entries(typeMap)) {
      if (words.some(word => lowerMessage.includes(word.toLowerCase()))) {
        matchedType = type;
        break;
      }
    }

    if (matchedType) {
      const typeCards = cards.filter(card => 
        card.type.toLowerCase().includes(matchedType)
      );

      const cardsData = typeCards.slice(0, 12).map(card => ({
        id: card.id,
        name: card.name,
        type: card.type,
        rarity: card.rarity,
        price: Number(card.price),
        stock: Number(card.stock),
        image: card.image || null,
        description: card.description || null,
      }));

      return {
        text: typeCards.length > 0
          ? `Encontrei ${typeCards.length} carta(s) do tipo ${matchedType.charAt(0).toUpperCase() + matchedType.slice(1)}. Veja algumas opções:`
          : `No momento não encontrei cartas do tipo ${matchedType} em estoque.`,
        cards: cardsData
      };
    }

    // Busca simples por nome
    const matchedCards = cards.filter(card => 
      card.name.toLowerCase().includes(lowerMessage.trim())
    );

    if (matchedCards.length > 0) {
      const cardsData = matchedCards.slice(0, 6).map(card => ({
        id: card.id,
        name: card.name,
        type: card.type,
        rarity: card.rarity,
        price: Number(card.price),
        stock: Number(card.stock),
        image: card.image || null,
        description: card.description || null,
      }));

      return {
        text: `Encontrei ${matchedCards.length} carta(s) relacionada(s) a "${userMessage}". Veja algumas opções abaixo:`,
        cards: cardsData
      };
    }

    // Resposta genérica
    const randomCards = [...cards].sort(() => 0.5 - Math.random()).slice(0, 2);
    const cardsData = randomCards.map(card => ({
      id: card.id,
      name: card.name,
      type: card.type,
      rarity: card.rarity,
      price: Number(card.price),
      stock: Number(card.stock),
      image: card.image || null,
      description: card.description || null,
    }));

    return {
      text: "Desculpe, estou tendo dificuldades técnicas no momento. Enquanto isso, que tal dar uma olhada nestas cartas populares? Se precisar de algo específico, posso ajudar com informações sobre raridades, tipos, preços ou recomendações personalizadas.",
      cards: cardsData
    };
  }
}

module.exports = ChatService;

