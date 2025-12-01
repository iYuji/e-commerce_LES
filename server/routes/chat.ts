import express from "express";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();

// Configuração ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega cards do localStorage simulado (JSON file)
function loadCards() {
  try {
    const cardsPath = path.join(__dirname, "../data/cards.json");
    if (fs.existsSync(cardsPath)) {
      return JSON.parse(fs.readFileSync(cardsPath, "utf-8"));
    }
  } catch (error) {
    console.error("Erro ao carregar cards:", error);
  }
  return [];
}

/**
 * POST /api/chat
 * Processa mensagens do chat usando Gemini AI
 */
router.post("/", async (req, res) => {
  console.log("📥 Requisição recebida");

  try {
    const { message, customerId } = req.body;
    console.log("📝 Message:", message);
    console.log("👤 CustomerId:", customerId);

    if (!message || typeof message !== "string") {
      console.log("⚠️ Mensagem inválida");
      return res.status(400).json({ error: "Mensagem inválida" });
    }

    console.log(
      `💬 Chat: "${message.substring(0, 50)}${
        message.length > 50 ? "..." : ""
      }"`
    );
    console.log(
      `🔑 API Key: ${
        process.env.GEMINI_API_KEY
          ? process.env.GEMINI_API_KEY.substring(0, 15) + "..."
          : "NOT FOUND"
      }`
    ); // Carrega catálogo de cartas
    console.log("📂 Carregando catálogo...");
    const cards = loadCards();
    console.log(`📦 ${cards.length} cartas carregadas`);

    // Chama Gemini API usando fetch direto
    console.log("🚀 Chamando Gemini API...");
    const apiKey = process.env.GEMINI_API_KEY;
    // gemini-2.0-flash NÃO tem "thinking" mode (diferente do 2.5-flash)
    const apiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    // Prompt focado em contexto semântico E personalidade
    const systemPrompt = `Você é um assistente Pokémon amigável e entusiasmado! Converse naturalmente, seja direto e recomende cartas que fazem sentido.

CATÁLOGO (${cards.length} cartas):
${cards
  .map((c: { id: any; name: any; type: any }) => `${c.id}:${c.name}(${c.type})`)
  .join(",")}

DICAS DE CONTEXTO:
- Voar/céu/paraquedas/altura → 17(Zapdos-elétrico),18(Articuno-gelo),19(Moltres-fogo),6(Rayquaza-dragão),12(Dragonite)
- Água/mar/mergulho/nadar → 3(Blastoise),7(Gyarados),15(Lapras),18(Articuno)
- Fogo/queimar/calor → 2(Charizard),19(Moltres)
- Elétrico/raio/choque → 1(Pikachu),17(Zapdos)
- Forte/poder/lendário → 5(Mewtwo),20(Mew),6(Rayquaza),2(Charizard)
- Barato/iniciante → 1(Pikachu-R$45),16(Eevee-R$38),11(Snorlax-R$52)

REGRAS:
- NUNCA comece com "Oh", "Nossa", "Excelente pergunta", "Que legal" ou frases genéricas
- Seja direto e vá direto ao ponto
- Varie o estilo de resposta para cada mensagem
- Use entusiasmo natural, não forçado
- Explique POR QUE as cartas fazem sentido com a pergunta

FORMATO: Responda SÓ o JSON (sem \`\`\`):
{"text":"sua resposta natural e variada","cardIds":["17","18","19"]}

Pergunta do cliente: ${message}
JSON:`;

    // Gera resposta com Gemini usando fetch
    console.log("🌐 Fazendo requisição HTTP para Gemini...");
    const geminiResponse = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: systemPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 256,
        },
      }),
    });

    console.log("📡 Response status:", geminiResponse.status);

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json();
      throw new Error(
        `Gemini API error: ${geminiResponse.status} - ${JSON.stringify(
          errorData
        )}`
      );
    }

    const geminiData: any = await geminiResponse.json();

    // Valida estrutura da resposta
    if (
      !geminiData.candidates ||
      !geminiData.candidates[0] ||
      !geminiData.candidates[0].content ||
      !geminiData.candidates[0].content.parts ||
      !geminiData.candidates[0].content.parts[0] ||
      !geminiData.candidates[0].content.parts[0].text
    ) {
      console.error(
        "❌ Resposta do Gemini com estrutura inválida:",
        JSON.stringify(geminiData, null, 2)
      );
      throw new Error("Gemini retornou resposta com estrutura inválida");
    }

    let geminiText = geminiData.candidates[0].content.parts[0].text;

    console.log("🤖 Gemini resposta bruta:", geminiText.substring(0, 100));

    let parsedResponse;
    try {
      let cleanText = geminiText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .replace(/^json\s*/i, "")
        .trim();

      if (cleanText.startsWith('{"text"')) {
        try {
          parsedResponse = JSON.parse(cleanText);
          console.log("✅ JSON parseado com sucesso");
        } catch (e) {
          const match = cleanText.match(/\{"text":"([^"]+)","cardIds":\[([^\]]*)\]\}/);
          if (match) {
            parsedResponse = {
              text: match[1],
              cardIds: match[2] ? match[2].replace(/"/g, '').split(',').filter(id => id.trim()) : []
            };
            console.log("✅ JSON extraído via regex");
          } else {
            throw e;
          }
        }
      } else {
        parsedResponse = {
          text: cleanText,
          cardIds: [],
        };
        console.log("⚠️ Resposta não é JSON, usando como texto");
      }
    } catch (parseError) {
      console.warn("⚠️ Erro ao parsear JSON:", parseError);
      parsedResponse = {
        text: geminiText,
        cardIds: [],
      };
    }

    // Busca cartas recomendadas
    let recommendedCards = parsedResponse.cardIds
      ? cards
          .filter((card: any) => parsedResponse.cardIds.includes(card.id))
          .slice(0, 8)
      : [];

    // Valida se as cartas recomendadas batem com o filtro da mensagem
    const lowerMessage = message.toLowerCase();

    // Detecta faixa de preço
    let minPrice: number | null = null;
    let maxPrice: number | null = null;

    const priceMatch1 = lowerMessage.match(/entre\s+(\d+)\s+e\s+(\d+)/);
    const priceMatch2 = lowerMessage.match(/(\d+)\s+a\s+(\d+)\s+reais?/);
    const priceMatch3 = lowerMessage.match(/até\s+(\d+)/);
    const priceMatch4 = lowerMessage.match(/acima\s+de\s+(\d+)/);
    const priceMatch5 = lowerMessage.match(/menos\s+de\s+(\d+)/);

    if (priceMatch1) {
      minPrice = parseFloat(priceMatch1[1]);
      maxPrice = parseFloat(priceMatch1[2]);
    } else if (priceMatch2) {
      minPrice = parseFloat(priceMatch2[1]);
      maxPrice = parseFloat(priceMatch2[2]);
    } else if (priceMatch3) {
      maxPrice = parseFloat(priceMatch3[1]);
    } else if (priceMatch4) {
      minPrice = parseFloat(priceMatch4[1]);
    } else if (priceMatch5) {
      maxPrice = parseFloat(priceMatch5[1]);
    }

    // Detecta se usuário pediu tipo específico
    const typeKeywords: { [key: string]: string[] } = {
      fire: ["fogo", "fire", "chamas", "queima"],
      water: ["água", "agua", "water", "mar", "oceano"],
      electric: ["elétrico", "eletrico", "electric", "raio", "trovão"],
      grass: ["grama", "grass", "planta", "folha"],
      psychic: ["psíquico", "psiquico", "psychic", "mental"],
      fighting: ["luta", "fighting", "lutador"],
      dark: ["dark", "sombrio", "noturno"],
      dragon: ["dragão", "dragon"],
      ghost: ["fantasma", "ghost"],
      normal: ["normal"],
    };

    let requestedType: string | null = null;
    for (const [type, keywords] of Object.entries(typeKeywords)) {
      if (keywords.some((kw) => lowerMessage.includes(kw))) {
        requestedType = type;
        break;
      }
    }

    // Aplica filtro de preço se detectado
    if (
      (minPrice !== null || maxPrice !== null) &&
      recommendedCards.length > 0
    ) {
      const priceFilteredCards = recommendedCards.filter((c: any) => {
        const price = parseFloat(
          c.price.toString().replace("R$", "").replace(",", ".").trim()
        );
        if (minPrice !== null && maxPrice !== null) {
          return price >= minPrice && price <= maxPrice;
        } else if (maxPrice !== null) {
          return price <= maxPrice;
        } else if (minPrice !== null) {
          return price >= minPrice;
        }
        return true;
      });

      if (priceFilteredCards.length < recommendedCards.length) {
        console.log(
          `⚠️ Gemini retornou cartas fora da faixa de preço. Filtrando ${
            minPrice !== null ? "R$" + minPrice : ""
          } ${minPrice !== null && maxPrice !== null ? "a" : ""} ${
            maxPrice !== null ? "R$" + maxPrice : ""
          }...`
        );
        const allPriceCards = cards.filter((c: any) => {
          const price = parseFloat(
            c.price.toString().replace("R$", "").replace(",", ".").trim()
          );
          if (minPrice !== null && maxPrice !== null) {
            return price >= minPrice && price <= maxPrice;
          } else if (maxPrice !== null) {
            return price <= maxPrice;
          } else if (minPrice !== null) {
            return price >= minPrice;
          }
          return true;
        });
        recommendedCards = allPriceCards.slice(0, 8);
        console.log(
          `✅ ${recommendedCards.length} cartas na faixa de preço selecionadas`
        );
      } else {
        recommendedCards = priceFilteredCards;
      }
    }

    // Se usuário pediu tipo específico, filtra apenas cartas daquele tipo
    if (requestedType && recommendedCards.length > 0) {
      const filteredCards = recommendedCards.filter((c: any) =>
        c.type.toLowerCase().includes(requestedType!)
      );

      // Se o Gemini retornou cartas erradas, busca as corretas
      if (filteredCards.length < recommendedCards.length) {
        console.log(
          `⚠️ Gemini retornou cartas de outros tipos. Filtrando apenas ${requestedType}...`
        );
        const allTypeCards = cards.filter((c: any) =>
          c.type.toLowerCase().includes(requestedType!)
        );
        recommendedCards = allTypeCards.slice(0, 8);
        console.log(
          `✅ ${recommendedCards.length} cartas do tipo ${requestedType} selecionadas`
        );
      } else {
        recommendedCards = filteredCards;
      }
    }

    // Se o Gemini não retornou IDs válidos, busca automaticamente baseado na mensagem
    if (recommendedCards.length === 0) {
      console.log(
        "⚠️ Gemini não retornou cardIds válidos, buscando automaticamente..."
      );

      // Busca por tipo
      if (requestedType) {
        recommendedCards = cards
          .filter((c: any) => c.type.toLowerCase().includes(requestedType))
          .slice(0, 8);
        console.log(
          `✅ Encontradas ${recommendedCards.length} cartas do tipo ${requestedType}`
        );
      }

      // Busca por raridade
      if (recommendedCards.length === 0) {
        const rarityKeywords: { [key: string]: string[] } = {
          common: ["comum", "common"],
          uncommon: ["incomum", "uncommon"],
          rare: ["rara", "rare", "raras"],
          epic: ["épica", "epic", "epica"],
          legendary: ["lendária", "legendary", "lendaria"],
        };

        for (const [rarity, keywords] of Object.entries(rarityKeywords)) {
          if (keywords.some((kw) => lowerMessage.includes(kw))) {
            recommendedCards = cards
              .filter((c: any) => c.rarity.toLowerCase() === rarity)
              .slice(0, 8);
            console.log(
              `✅ Encontradas ${recommendedCards.length} cartas ${rarity}`
            );
            break;
          }
        }
      }

      // Se ainda não encontrou, retorna cartas populares/aleatórias
      if (recommendedCards.length === 0) {
        recommendedCards = cards.slice(0, 6);
        console.log("✅ Retornando cartas populares (primeiras do catálogo)");
      }
    } else {
      console.log(
        `✅ ${recommendedCards.length} cartas recomendadas${
          requestedType ? ` do tipo ${requestedType}` : ""
        }`
      );
    }

    res.json({
      text: parsedResponse.text || geminiText || "Resposta do assistente",
      cards: recommendedCards.map((card: any) => ({
        id: card.id,
        name: card.name,
        type: card.type,
        rarity: card.rarity,
        price: card.price,
        stock: card.stock,
        image: card.image,
        description: card.description,
      })),
    });

    console.log(
      `✅ Resposta enviada: "${(parsedResponse.text || geminiText).substring(
        0,
        80
      )}..." com ${recommendedCards.length} cartas`
    );
  } catch (error: any) {
    console.error("❌ Erro no chat:", error);
    res.status(500).json({
      error: "Erro ao processar mensagem",
      message: error.message,
    });
  }
});

export default router;
