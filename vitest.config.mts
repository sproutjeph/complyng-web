import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    alias: {
      "server-only": new URL("./__tests__/stubs/server-only.ts", import.meta.url).pathname,
    },
  },
});
