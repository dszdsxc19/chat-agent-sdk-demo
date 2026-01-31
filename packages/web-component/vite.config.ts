import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    react(),
    dts({ rollupTypes: false, tsconfigPath: "./tsconfig.app.json" }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "AgentWidget",
      fileName: "agent-widget",
    },
    rollupOptions: {
      // Bundle all dependencies
      external: [],
    },
  },
  define: {
    "process.env.NODE_ENV": '"production"',
  },
});
