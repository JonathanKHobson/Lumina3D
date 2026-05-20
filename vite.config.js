import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        game: fileURLToPath(new URL("index.html", import.meta.url)),
        editor: fileURLToPath(new URL("editor/index.html", import.meta.url))
      }
    }
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("src", import.meta.url))
    }
  },
  server: {
    fs: {
      allow: [root]
    }
  }
});
