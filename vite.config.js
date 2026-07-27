import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: "./" — относительные пути, чтобы работало и на GitHub Pages в подпапке.
export default defineConfig({
  plugins: [react()],
  base: "./",
});
