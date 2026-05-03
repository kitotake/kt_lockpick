import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Pour FiveM NUI : build en mode relatif (pas de base absolue)
  base: "./",
  build: {
    outDir: "dist",
    // Garder les assets groupés pour faciliter l'intégration FiveM
    assetsDir: "assets",
    rollupOptions: {
      output: {
        // Un seul chunk pour simplifier l'intégration NUI
        manualChunks: undefined,
      },
    },
  },
});
