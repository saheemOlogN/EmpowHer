import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "url";

const clientRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, clientRoot, "");
  const apiPort = env.VITE_API_PORT || "4000";
  const clientPort = Number(env.VITE_CLIENT_PORT || 5173);

  return {
    root: clientRoot,
    plugins: [react()],
    server: {
      port: clientPort,
      strictPort: true,
      host: "127.0.0.1",
      proxy: {
        "/api": `http://127.0.0.1:${apiPort}`
      }
    },
    build: {
      outDir: "../dist",
      emptyOutDir: true
    }
  };
});
