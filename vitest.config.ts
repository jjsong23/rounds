import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "node",
    // Vitest doesn't load .env on its own (unlike Next.js) — without this,
    // DATABASE_URL is undefined in every test file.
    setupFiles: ["dotenv/config"],
    // Kept from when local dev used SQLite (single-writer); harmless to
    // leave for Postgres too.
    fileParallelism: false,
  },
});
