import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    // Allow your project folders; no server folder included

    // Block sensitive files
    // deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**"],
  },

  build: {
    outDir: "dist",
  },

  plugins: [react()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
