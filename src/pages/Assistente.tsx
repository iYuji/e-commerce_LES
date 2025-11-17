import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  Chip,
  Card,
  CardContent,
  Grid,
  IconButton,
  Collapse,
} from "@mui/material";
import {
  Send,
  SmartToy,
  Person,
  Clear,
  ThumbUp,
  ThumbDown,
  ContentCopy,
  ExpandMore,
  ExpandLess,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import * as Store from "../store/index";
import { Card as CardType } from "../types";

interface Message {
  id: string;
  text: string;
  sender: "user" | "assistant";
  timestamp: Date;
  cards?: CardType[];
  helpful?: boolean;
}

const suggestedQuestions = [
  "Quais são as cartas mais raras disponíveis?",
  "Mostre-me cartas do tipo Fogo",
  "Qual é a carta mais cara da loja?",
  "Preciso de cartas para iniciantes",
  "Quais cartas estão em promoção?",
  "Como funcionam os cupons de desconto?",
];

const Assistente: React.FC = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [cards] = useState<CardType[]>(Store.getCards());

  useEffect(() => {
    // Mensagem de boas-vindas
    const welcomeMessage: Message = {
      id: "1",
      text: "Olá! Sou seu assistente de cartas colecionáveis. Posso ajudá-lo a encontrar cartas, explicar raridades, sugerir combinações e muito mais. Como posso ajudá-lo hoje?",
      sender: "assistant",
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const simulateAIResponse = (userMessage: string): Message => {
    const lowerMessage = userMessage.toLowerCase();
    let responseText = "";
    let relatedCards: CardType[] = [];

    // Gatilhos de busca (para nome de carta)
    const searchTriggers = [
      "procura",
      "procurar",
      "buscar",
      "encontrar",
      "mostrar",
      "mostre",
      "me mostra",
      "me mostre",
      "ver",
    ];
    const hasSearchIntent = searchTriggers.some((t) =>
      lowerMessage.includes(t)
    );

    // Palavras que indicam que o usuário fala de raridade (não de nome)
    const rarityWords = [
      "comum",
      "comuns",
      "common",
      "incomum",
      "uncommon",
      "rara",
      "raras",
      "rare",
      "épica",
      "epica",
      "epic",
      "lendária",
      "lendaria",
      "legendary",
    ];
    const talksAboutRarity = rarityWords.some((w) =>
      lowerMessage.includes(w)
    );

    // ================= RARIDADE =================
    if (
      lowerMessage.includes("comum") || // pega "comum" e "comuns"
      lowerMessage.includes("comuns") ||
      lowerMessage.includes("common")
    ) {
      const commonCards = cards
        .filter((card) => card.rarity.toLowerCase() === "common")
        .slice(0, 12);
      relatedCards = commonCards;
      responseText =
        commonCards.length > 0
          ? "Estas são algumas cartas Comuns disponíveis na loja. Ótimas para começar ou completar o deck."
          : "No momento não temos cartas Comuns em estoque.";
    } else if (
      lowerMessage.includes("incomum") ||
      lowerMessage.includes("uncommon")
    ) {
      const uncommonCards = cards
        .filter((card) => card.rarity.toLowerCase() === "uncommon")
        .slice(0, 12);
      relatedCards = uncommonCards;
      responseText =
        uncommonCards.length > 0
          ? "Encontrei estas cartas Incomuns para você. Elas costumam ter efeitos interessantes e bom custo-benefício."
          : "No momento não temos cartas Incomuns em estoque.";
    } else if (
      lowerMessage.includes("mais rara") ||
      lowerMessage.includes("mais raras") ||
      lowerMessage.includes("raras") ||
      lowerMessage.includes("rara") ||
      lowerMessage.includes("rare")
    ) {
      const rareCards = cards
        .filter((card) => {
          const r = card.rarity.toLowerCase();
          return (
            r === "rare" ||
            r === "super rare" ||
            r === "ultra rare" ||
            r === "epic" ||
            r === "legendary"
          );
        })
        .slice(0, 12);
      relatedCards = rareCards;
      responseText =
        rareCards.length > 0
          ? "Aqui estão algumas das cartas mais raras da nossa coleção!"
          : "No momento não temos cartas raras em estoque.";
    } else if (
      lowerMessage.includes("épica") ||
      lowerMessage.includes("epica") ||
      lowerMessage.includes("epic")
    ) {
      const epicCards = cards
        .filter((card) => card.rarity.toLowerCase() === "epic")
        .slice(0, 12);
      relatedCards = epicCards;
      responseText =
        epicCards.length > 0
          ? "Separei algumas cartas Épicas para você. Elas costumam ser bem valorizadas."
          : "No momento não temos cartas Épicas em estoque.";
    } else if (
      lowerMessage.includes("lendária") ||
      lowerMessage.includes("lendaria") ||
      lowerMessage.includes("legendary")
    ) {
      const legendaryCards = cards
        .filter((card) => card.rarity.toLowerCase() === "legendary")
        .slice(0, 12);
      relatedCards = legendaryCards;
      responseText =
        legendaryCards.length > 0
          ? "Aqui estão algumas das cartas Lendárias mais raras da nossa coleção!"
          : "No momento não temos cartas Lendárias em estoque.";
    }

    // =============== TIPOS (Fogo/Água/Elétrico) =================
    else if (
      lowerMessage.includes("tipo fogo") ||
      lowerMessage.includes("tipo fire") ||
      lowerMessage === "fogo" ||
      lowerMessage === "fire" ||
      lowerMessage.includes("cartas de fogo") ||
      lowerMessage.includes("cartas fire")
    ) {
      const fireCards = cards
        .filter((card) => card.type.toLowerCase().includes("fire"))
        .slice(0, 12);
      relatedCards = fireCards;
      responseText =
        fireCards.length > 0
          ? `Encontrei ${fireCards.length} carta(s) do tipo Fogo.`
          : "No momento não encontrei cartas do tipo Fogo em estoque.";
    } else if (
      lowerMessage.includes("tipo água") ||
      lowerMessage.includes("tipo agua") ||
      lowerMessage.includes("tipo water") ||
      lowerMessage === "água" ||
      lowerMessage === "agua" ||
      lowerMessage === "water" ||
      lowerMessage.includes("cartas de água") ||
      lowerMessage.includes("cartas de agua") ||
      lowerMessage.includes("cartas water")
    ) {
      const waterCards = cards
        .filter((card) => card.type.toLowerCase().includes("water"))
        .slice(0, 12);
      relatedCards = waterCards;
      responseText =
        waterCards.length > 0
          ? `Encontrei ${waterCards.length} carta(s) do tipo Água.`
          : "No momento não encontrei cartas do tipo Água em estoque.";
    } else if (
      lowerMessage.includes("tipo elétrico") ||
      lowerMessage.includes("tipo eletrico") ||
      lowerMessage.includes("tipo electric") ||
      lowerMessage === "elétrico" ||
      lowerMessage === "eletrico" ||
      lowerMessage === "electric"
    ) {
      const electricCards = cards
        .filter((card) => card.type.toLowerCase().includes("electric"))
        .slice(0, 12);
      relatedCards = electricCards;
      responseText =
        electricCards.length > 0
          ? `Encontrei ${electricCards.length} carta(s) do tipo Elétrico.`
          : "No momento não encontrei cartas do tipo Elétrico em estoque.";
    }

    // =============== CARTA MAIS CARA =================
    else if (
      lowerMessage.includes("mais cara") ||
      lowerMessage.includes("mais caro") ||
      lowerMessage.includes("cara") ||
      lowerMessage.includes("preço") ||
      lowerMessage.includes("preco") ||
      lowerMessage.includes("expensive")
    ) {
      const expensiveCards = [...cards]
        .sort((a, b) => b.price - a.price)
        .slice(0, 6);
      relatedCards = expensiveCards;
      responseText =
        "Estas são as cartas mais valiosas da nossa coleção! O preço reflete a raridade e demanda no mercado.";
    }

    // =============== INICIANTES =================
    else if (
      lowerMessage.includes("iniciante") ||
      lowerMessage.includes("beginner") ||
      lowerMessage.includes("começ")
    ) {
      const beginnerCards = cards
        .filter(
          (card) =>
            card.rarity.toLowerCase() === "common" ||
            card.rarity.toLowerCase() === "uncommon"
        )
        .slice(0, 12);
      relatedCards = beginnerCards;
      responseText =
        "Para iniciantes, recomendo começar com cartas Common e Uncommon. São mais acessíveis e perfeitas para aprender o jogo!";
    }

    // =============== CUPONS =================
    else if (
      lowerMessage.includes("cupom") ||
      lowerMessage.includes("cupons") ||
      lowerMessage.includes("coupon") ||
      lowerMessage.includes("cupões") ||
      lowerMessage.includes("cupoens") || // erro comum
      lowerMessage.includes("cupom de desconto") ||
      lowerMessage.includes("cupons de desconto")
    ) {
      responseText =
        "Você pode usar cupons no carrinho de compras. Basta digitar o código no campo **“Cupom de desconto”** e clicar em aplicar.\n\nAlguns exemplos de cupons:\n• **WELCOME10** – 10% de desconto na primeira compra\n• **SAVE5** – R$ 5 de desconto em qualquer pedido\n• **LEGENDARY20** – 20% em cartas lendárias selecionadas\n\nCada cupom pode ter regras específicas (valor mínimo, validade, produtos elegíveis).";
    }

    // =============== PROMOÇÃO / DESCONTO =================
    else if (
      lowerMessage.includes("promoção") ||
      lowerMessage.includes("promocao") ||
      lowerMessage.includes("desconto") ||
      lowerMessage.includes("oferta")
    ) {
      const promotionCards = cards
        .filter((card) => card.price < 50)
        .slice(0, 12);
      relatedCards = promotionCards;
      responseText =
        promotionCards.length > 0
          ? "Temos várias cartas com preços especiais! Aproveite estas ofertas enquanto o estoque durar."
          : "No momento não há cartas em promoção.";
    }

    // =============== LISTAR TIPOS DISPONÍVEIS =================
    else if (
      lowerMessage.includes("tipo") ||
      lowerMessage.includes("element")
    ) {
      const types = [...new Set(cards.map((card) => card.type))];
      responseText = `Temos cartas dos seguintes tipos: ${types.join(
        ", "
      )}. Cada tipo tem suas próprias características e estratégias únicas. Sobre qual tipo você gostaria de saber mais?`;
    }

    // =============== ESTOQUE =================
    else if (
      lowerMessage.includes("estoque") ||
      lowerMessage.includes("stock")
    ) {
      const inStockCards = cards.filter((card) => card.stock > 0);
      responseText = `Temos ${inStockCards.length} cartas diferentes em estoque no momento. Posso ajudá-lo a encontrar algo específico?`;
    }

    // =============== BUSCA POR NOME =================
    // Só entra aqui se tiver intenção de busca E não estiver falando de raridade
    else if (hasSearchIntent && !talksAboutRarity) {
      const words = lowerMessage.split(/\s+/);
      const stopWords = [
        "a",
        "o",
        "as",
        "os",
        "de",
        "da",
        "do",
        "das",
        "dos",
        "uma",
        "um",
        "carta",
        "cartas",
        "pokemon",
        "pokémon",
        "procura",
        "procurar",
        "buscar",
        "encontrar",
        "mostrar",
        "mostre",
        "ver",
        "quero",
        "gostaria",
        "me",
        "para",
        "tipo",
      ];

      const keywords = words.filter((w) => !stopWords.includes(w));
      let searchTerm = keywords.join(" ").trim();
      if (!searchTerm) {
        searchTerm = lowerMessage.trim();
      }

      const matchedCards = cards.filter((card) =>
        card.name.toLowerCase().includes(searchTerm)
      );

      relatedCards = matchedCards.slice(0, 6);

      if (matchedCards.length > 0) {
        responseText = `Encontrei ${matchedCards.length} carta(s) relacionada(s) a "${searchTerm}". Veja algumas opções abaixo:`;
      } else {
        responseText = `Não encontrei nenhuma carta com o nome relacionado a "${searchTerm}". Tente usar outro nome ou verificar a ortografia.`;
      }
    }

    // =============== RESPOSTA GENÉRICA =================
    else {
      const randomCards = [...cards]
        .sort(() => 0.5 - Math.random())
        .slice(0, 2);
      relatedCards = randomCards;
      responseText =
        "Interessante pergunta! Enquanto isso, que tal dar uma olhada nestas cartas populares? Se precisar de algo específico, posso ajudar com informações sobre raridades, tipos, preços ou recomendações personalizadas.";
    }

    return {
      id: Date.now().toString(),
      text: responseText,
      sender: "assistant",
      timestamp: new Date(),
      cards: relatedCards,
    };
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsTyping(true);

    // Simular delay de digitação
    setTimeout(() => {
      const aiResponse = simulateAIResponse(inputText);
      setMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleSuggestedQuestion = (question: string) => {
    setInputText(question);
    setTimeout(() => handleSendMessage(), 100);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: Date.now().toString(),
        text: "Chat limpo! Como posso ajudá-lo novamente?",
        sender: "assistant",
        timestamp: new Date(),
      },
    ]);
  };

  const handleCopyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleCardClick = (card: CardType) => {
    navigate(`/card/${card.id}`);
  };

  const handleFeedback = (messageId: string, helpful: boolean) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? { ...msg, helpful } : msg))
    );
  };

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <Paper
        elevation={2}
        sx={{
          p: 2,
          borderRadius: 0,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar sx={{ bgcolor: "primary.main" }}>
              <SmartToy />
            </Avatar>
            <Box>
              <Typography variant="h6">Assistente de Cartas IA</Typography>
              <Typography variant="body2" color="text.secondary">
                Sempre online • Respondendo rapidamente
              </Typography>
            </Box>
          </Box>
          <Box>
            <IconButton onClick={handleClearChat} title="Limpar chat">
              <Clear />
            </IconButton>
            <IconButton
              onClick={() => setIsMinimized(!isMinimized)}
              title="Minimizar"
            >
              {isMinimized ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>
        </Box>
      </Paper>

      <Collapse in={!isMinimized}>
        {/* Messages Area */}
        <Box
          sx={{
            flex: 1,
            overflow: "auto",
            p: 2,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          {/* Suggested Questions */}
          {messages.length <= 1 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Perguntas Frequentes
                </Typography>
                <Grid container spacing={1}>
                  {suggestedQuestions.map((question, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Chip
                        label={question}
                        variant="outlined"
                        clickable
                        onClick={() => handleSuggestedQuestion(question)}
                        sx={{ width: "100%", height: "auto", p: 1 }}
                      />
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* Messages */}
          <List sx={{ flex: 1 }}>
            {messages.map((message) => (
              <ListItem
                key={message.id}
                sx={{
                  flexDirection: "column",
                  alignItems:
                    message.sender === "user" ? "flex-end" : "flex-start",
                  gap: 1,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 1,
                    maxWidth: "80%",
                    flexDirection:
                      message.sender === "user" ? "row-reverse" : "row",
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor:
                        message.sender === "user"
                          ? "secondary.main"
                          : "primary.main",
                      width: 32,
                      height: 32,
                    }}
                  >
                    {message.sender === "user" ? <Person /> : <SmartToy />}
                  </Avatar>

                  <Paper
                    elevation={1}
                    sx={{
                      p: 2,
                      bgcolor:
                        message.sender === "user"
                          ? "primary.main"
                          : "background.paper",
                      color:
                        message.sender === "user"
                          ? "primary.contrastText"
                          : "text.primary",
                      borderRadius: 2,
                      position: "relative",
                    }}
                  >
                    <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
                      {message.text}
                    </Typography>

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mt: 1,
                      }}
                    >
                      <Typography variant="caption" sx={{ opacity: 0.7 }}>
                        {message.timestamp.toLocaleTimeString()}
                      </Typography>

                      <Box sx={{ display: "flex", gap: 0.5 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleCopyMessage(message.text)}
                          sx={{ opacity: 0.7 }}
                        >
                          <ContentCopy fontSize="small" />
                        </IconButton>

                        {message.sender === "assistant" && (
                          <>
                            <IconButton
                              size="small"
                              onClick={() => handleFeedback(message.id, true)}
                              color={
                                message.helpful === true ? "success" : "default"
                              }
                              sx={{ opacity: 0.7 }}
                            >
                              <ThumbUp fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() =>
                                handleFeedback(message.id, false)
                              }
                              color={
                                message.helpful === false ? "error" : "default"
                              }
                              sx={{ opacity: 0.7 }}
                            >
                              <ThumbDown fontSize="small" />
                            </IconButton>
                          </>
                        )}
                      </Box>
                    </Box>
                  </Paper>
                </Box>

                {/* Cards suggestions */}
                {message.cards && message.cards.length > 0 && (
                  <Grid container spacing={2} sx={{ mt: 1, maxWidth: "80%" }}>
                    {message.cards.map((card) => (
                      <Grid item xs={12} sm={6} md={4} key={card.id}>
                        <Card
                          sx={{
                            cursor: "pointer",
                            transition: "transform 0.2s",
                            "&:hover": { transform: "translateY(-2px)" },
                          }}
                          onClick={() => handleCardClick(card)}
                        >
                          <CardContent sx={{ p: 2 }}>
                            <Typography
                              variant="subtitle2"
                              fontWeight="bold"
                              gutterBottom
                            >
                              {card.name}
                            </Typography>
                            <Box sx={{ display: "flex", gap: 0.5, mb: 1 }}>
                              <Chip label={card.type} size="small" />
                              <Chip label={card.rarity} size="small" />
                            </Box>
                            <Typography variant="h6" color="primary">
                              R$ {card.price.toFixed(2)}
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mt: 1 }}
                            >
                              Estoque: {card.stock}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </ListItem>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <ListItem sx={{ alignItems: "flex-start" }}>
                <ListItemAvatar>
                  <Avatar
                    sx={{ bgcolor: "primary.main", width: 32, height: 32 }}
                  >
                    <SmartToy />
                  </Avatar>
                </ListItemAvatar>
                <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Digitando...
                  </Typography>
                </Paper>
              </ListItem>
            )}
          </List>

          <div ref={messagesEndRef} />
        </Box>

        {/* Input Area */}
        <Paper
          elevation={3}
          sx={{
            p: 2,
            borderRadius: 0,
            borderTop: 1,
            borderColor: "divider",
          }}
        >
          <Box sx={{ display: "flex", gap: 1, alignItems: "flex-end" }}>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              placeholder="Digite sua pergunta sobre cartas..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              variant="outlined"
              size="small"
            />
            <Button
              variant="contained"
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isTyping}
              sx={{ minWidth: "auto", p: 1 }}
            >
              <Send />
            </Button>
          </Box>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 1, display: "block" }}
          >
            Pressione Enter para enviar • Shift+Enter para nova linha
          </Typography>
        </Paper>
      </Collapse>
    </Box>
  );
};

export default Assistente;
