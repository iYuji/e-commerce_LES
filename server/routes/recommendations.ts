import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();

// Configuração ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Inicializa Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Carrega dados
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

function loadOrders() {
  try {
    const ordersPath = path.join(__dirname, "../../src/store/orders.json");
    if (fs.existsSync(ordersPath)) {
      return JSON.parse(fs.readFileSync(ordersPath, "utf-8"));
    }
  } catch (error) {
    console.error("Erro ao carregar orders:", error);
  }
  return [];
}

/**
 * GET /api/recommendations
 * Recomendações personalizadas com IA
 */
router.get("/", async (req, res) => {
  try {
    const { customerId, type = "hybrid", limit = 10 } = req.query;

    console.log(
      `🎯 Recomendações: type=${type}, customerId=${customerId}, limit=${limit}`
    );

    const cards = loadCards();
    const orders = loadOrders();

    // Se não for tipo gemini/hybrid, retorna recomendações simples
    if (type === "popular") {
      const popular = cards
        .sort((a: any, b: any) => b.price - a.price)
        .slice(0, Number(limit));

      return res.json({
        recommendations: popular,
        count: popular.length,
        type: "popular",
      });
    }

    // Busca histórico do cliente
    let customerHistory = "";
    if (customerId) {
      const customerOrders = orders.filter(
        (o: any) => o.customerId === customerId
      );
      const purchasedCards = customerOrders.flatMap((o: any) => o.items || []);
      customerHistory = `Histórico de compras: ${JSON.stringify(
        purchasedCards.slice(0, 10)
      )}`;
    }

    // Usa Gemini para gerar recomendações
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 512,
      },
    });

    const prompt = `Você é um sistema de recomendação de cartas Pokemon.

CATÁLOGO:
${JSON.stringify(cards.slice(0, 30), null, 2)}

${customerHistory ? customerHistory : "Cliente novo sem histórico"}

TAREFA:
Recomende ${limit} cartas Pokemon baseado em:
1. Popularidade e raridade
2. Variedade de tipos
3. Histórico do cliente (se disponível)
4. Boa distribuição de preços

RETORNE APENAS um array JSON com os IDs das cartas recomendadas:
["id1", "id2", "id3", ...]`;

    const result = await model.generateContent(prompt);
    let geminiResponse = result.response.text();

    // Remove markdown se houver
    geminiResponse = geminiResponse
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    let recommendedIds: string[] = [];
    try {
      recommendedIds = JSON.parse(geminiResponse);
    } catch (parseError) {
      console.warn("⚠️ Erro ao parsear IDs, usando fallback");
      // Fallback: cartas aleatórias
      recommendedIds = cards.slice(0, Number(limit)).map((c: any) => c.id);
    }

    const recommendations = cards
      .filter((card: any) => recommendedIds.includes(card.id))
      .slice(0, Number(limit))
      .map((card: any, index: number) => ({
        ...card,
        recommendationScore: 1 - index * 0.1, // Score decrescente
        recommendationReasons: [
          "Recomendado por IA",
          "Baseado em suas preferências",
        ],
      }));

    res.json({
      recommendations,
      count: recommendations.length,
      type: "gemini",
      customerId: customerId || null,
    });
  } catch (error: any) {
    console.error("❌ Erro nas recomendações:", error);
    res.status(500).json({
      error: "Erro ao gerar recomendações",
      message: error.message,
    });
  }
});

/**
 * GET /api/recommendations/popular
 * Cartas mais populares
 */
router.get("/popular", (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const cards = loadCards();

    const popular = cards
      .sort((a: any, b: any) => {
        // Prioriza raridade e preço
        const rarityScore: any = {
          Legendary: 5,
          Epic: 4,
          Rare: 3,
          Uncommon: 2,
          Common: 1,
        };
        return (rarityScore[b.rarity] || 0) - (rarityScore[a.rarity] || 0);
      })
      .slice(0, Number(limit));

    res.json({
      recommendations: popular,
      count: popular.length,
      type: "popular",
    });
  } catch (error: any) {
    console.error("❌ Erro ao buscar populares:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/recommendations/similar/:cardId
 * Cartas similares a uma específica
 */
router.get("/similar/:cardId", (req, res) => {
  try {
    const { cardId } = req.params;
    const { limit = 10 } = req.query;
    const cards = loadCards();

    const targetCard = cards.find((c: any) => c.id === cardId);
    if (!targetCard) {
      return res.status(404).json({ error: "Carta não encontrada" });
    }

    // Busca cartas do mesmo tipo ou raridade
    const similar = cards
      .filter(
        (c: any) =>
          c.id !== cardId &&
          (c.type === targetCard.type || c.rarity === targetCard.rarity)
      )
      .slice(0, Number(limit))
      .map((card: any, index: number) => ({
        ...card,
        recommendationScore: 0.9 - index * 0.05,
        recommendationReasons: [
          card.type === targetCard.type
            ? `Mesmo tipo: ${card.type}`
            : `Mesma raridade: ${card.rarity}`,
        ],
      }));

    res.json({
      recommendations: similar,
      count: similar.length,
      type: "similar",
    });
  } catch (error: any) {
    console.error("❌ Erro ao buscar similares:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/recommendations/customer/:customerId
 * Recomendações para cliente específico
 */
router.get("/customer/:customerId", async (req, res) => {
  try {
    const { customerId } = req.params;
    const { type = "hybrid", limit = 10 } = req.query;

    console.log(`👤 Recomendações para cliente: ${customerId}`);

    const cards = loadCards();
    const orders = loadOrders();

    // Busca histórico do cliente
    const customerOrders = orders.filter(
      (o: any) => o.customerId === customerId
    );
    const purchasedCardIds = customerOrders.flatMap((o: any) =>
      (o.items || []).map((item: any) => item.cardId || item.id)
    );

    // Filtra cartas que o cliente ainda não comprou
    let availableCards = cards.filter(
      (c: any) => !purchasedCardIds.includes(c.id)
    );

    // Se for tipo gemini, usa IA
    if (type === "gemini" || type === "hybrid") {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `Baseado nas compras anteriores do cliente:
${JSON.stringify(purchasedCardIds.slice(0, 5))}

Recomendar cartas similares ou complementares do catálogo:
${JSON.stringify(
  availableCards
    .slice(0, 20)
    .map((c: any) => ({ id: c.id, name: c.name, type: c.type }))
)}

Retorne apenas array de IDs: ["id1", "id2", ...]`;

      try {
        const result = await model.generateContent(prompt);
        let response = result.response
          .text()
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "")
          .trim();
        const recommendedIds = JSON.parse(response);

        availableCards = availableCards.filter((c: any) =>
          recommendedIds.includes(c.id)
        );
      } catch (aiError) {
        console.warn("⚠️ Erro na IA, usando fallback");
      }
    }

    const recommendations = availableCards
      .slice(0, Number(limit))
      .map((card: any, index: number) => ({
        ...card,
        recommendationScore: 0.95 - index * 0.05,
        recommendationReasons: [
          "Personalizado para você",
          "Baseado no seu histórico",
        ],
      }));

    res.json({
      recommendations,
      count: recommendations.length,
      type,
      customerId,
    });
  } catch (error: any) {
    console.error("❌ Erro nas recomendações do cliente:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
