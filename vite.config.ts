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
    define: {
      __API_BASE__: JSON.stringify(
        env.VITE_API_BASE_URL || "http://localhost:3002/api"
      ),
    },
  };
});
