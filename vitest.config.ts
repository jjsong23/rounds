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
    // Test files share the on-disk SQLite dev database; running them in
    // parallel processes causes write-lock contention and timeouts, since
    // SQLite (via better-sqlite3) only supports one writer at a time.
    fileParallelism: false,
  },
});
