import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    // Components render into a simulated DOM so tests can query them the way
    // a user would (by label, role, and text).
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["node_modules", ".next"],
  },
  resolve: {
    alias: {
      // Mirror the "@/..." import alias from tsconfig.json.
      "@": path.resolve(__dirname, "."),
    },
  },
});
