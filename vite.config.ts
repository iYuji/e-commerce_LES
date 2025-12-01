import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react()],
    server: {
      port: 3000,
      open: true,
    },
    // Nota: API_BASE é usada apenas para funcionalidades de IA (Chat e Recomendações)
    // que dependem do Google Gemini. O resto do app usa 100% localStorage.
    define: {
      __API_BASE__: JSON.stringify(
        env.VITE_API_BASE_URL || "http://localhost:3002/api"
      ),
    },
  };
});
