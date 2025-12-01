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
import { chatApi } from "../api/chatApi";

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
  "Quais as cartas mais caras da loja?",
  "Preciso de cartas para iniciantes",
  "Quais cartas estão em promoção?",
  "Me recomende cartas de pokémons populares",
];

const CHAT_STORAGE_KEY = "chatHistory";

const Assistente: React.FC = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Carrega histórico do localStorage ao montar
  useEffect(() => {
    const savedHistory = localStorage.getItem(CHAT_STORAGE_KEY);

    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        // Converte timestamps de string para Date
        const messagesWithDates = parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
        setMessages(messagesWithDates);
      } catch (error) {
        console.error("Erro ao carregar histórico do chat:", error);
        initializeWelcomeMessage();
      }
    } else {
      initializeWelcomeMessage();
    }
  }, []);

  // Salva histórico no localStorage sempre que mensagens mudarem
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  const initializeWelcomeMessage = () => {
    const welcomeMessage: Message = {
      id: "1",
      text: "Olá! Sou seu assistente de cartas colecionáveis. Posso ajudá-lo a encontrar cartas, explicar raridades, sugerir combinações e muito mais. Como posso ajudá-lo hoje?",
      sender: "assistant",
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
    const messageToSend = inputText;
    setInputText("");
    setIsTyping(true);

    try {
      // Busca customerId da sessão se disponível
      const session = Store.getSession();
      const customerId = session?.userId || undefined;

      // Chama a API de chat com Gemini
      const response = await chatApi.sendMessage(messageToSend, customerId);

      // Converte ChatCard para CardType
      const cards: CardType[] = response.cards.map((card) => ({
        id: card.id,
        name: card.name,
        type: card.type,
        rarity: card.rarity,
        price: card.price,
        stock: card.stock,
        image: card.image,
        description: card.description,
        category: null, // Campo obrigatório do tipo Card
      }));

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: response.text,
        sender: "assistant",
        timestamp: new Date(),
        cards: cards,
      };

      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      console.error("❌ Erro ao chamar API Gemini:", error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `⚠️ Erro ao processar sua mensagem: ${
          error instanceof Error ? error.message : "Erro desconhecido"
        }. Verifique se o servidor backend está rodando na porta 3002.`,
        sender: "assistant",
        timestamp: new Date(),
        cards: [],
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setInputText(question);
    setTimeout(() => handleSendMessage(), 100);
  };

  const handleClearChat = () => {
    const resetMessage: Message = {
      id: Date.now().toString(),
      text: "Chat limpo! Como posso ajudá-lo novamente?",
      sender: "assistant",
      timestamp: new Date(),
    };
    setMessages([resetMessage]);
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify([resetMessage]));
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
                              onClick={() => handleFeedback(message.id, false)}
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
