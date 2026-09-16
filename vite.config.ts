import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Relative base so the build works at the GitHub Pages subpath (/sm-steering/)
// and anywhere else it is served from.
export default defineConfig({
  plugins: [react()],
  base: "./",
});
