import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  base: "./",

  server: {
    host: true,
    port: 5173,
    allowedHosts: [
      "z-m24c04a-653",
      "z-d25d82w-001k",
      "desktop-s16moin"
    ]
  }
});
