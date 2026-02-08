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

      "@dac/core-machine": path.resolve(__dirname, "../../core-machine/src"),

      "@dac/adapter-serial": path.resolve(
        __dirname,
        "../../adapters/adapter-serial/src",
      ),

      "@dac/core-config": path.resolve(__dirname, "../../core-config/src"),

      "@dac/core-auth": path.resolve(__dirname, "../../core-auth/src"),
    },
  },
});
