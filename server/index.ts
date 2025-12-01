import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import chatRouter from "./routes/chat.js";
import recommendationsRouter from "./routes/recommendations.js";

// Carrega variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Middlewares
app.use(cors());
app.use(express.json());

// Log de requisições
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Rotas
app.use("/api/chat", chatRouter);
app.use("/api/recommendations", recommendationsRouter);

// Rota de health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Gemini AI Server is running",
    timestamp: new Date().toISOString(),
  });
});

// Rota 404
app.use((req, res) => {
  res.status(404).json({
    error: "Rota não encontrada",
    path: req.path,
  });
});

// Tratamento de erros
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("❌ Erro no servidor:", err);
    res.status(500).json({
      error: "Erro interno do servidor",
      message: err.message,
    });
  }
);

// Inicia o servidor
app.listen(PORT, () => {
  console.log("");
  console.log("🚀 ============================================");
  console.log(`🤖 Servidor Gemini AI rodando na porta ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`💚 Health check: http://localhost:${PORT}/api/health`);
  console.log("🚀 ============================================");
  console.log("");
});
