import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/FPL-optimizer/",
  plugins: [react()],
  test: {
    environment: "node",
    globals: true,
  },
});
