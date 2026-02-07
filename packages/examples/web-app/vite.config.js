import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@dac/core-geometry": path.resolve(__dirname, "../../core-geometry/src"),

      "@dac/core-scene": path.resolve(__dirname, "../../core-scene/src"),

      "@dac/core-commands": path.resolve(__dirname, "../../core-commands/src"),

      "@dac/core-workspace": path.resolve(
        __dirname,
        "../../core-workspace/src",
      ),

      "@dac/renderer-canvas": path.resolve(
        __dirname,
        "../../renderer-canvas/src",
      ),
    },
  },
});
