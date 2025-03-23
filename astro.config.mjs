// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import compress from "astro-compress";
import svgr from "vite-plugin-svgr";

// https://astro.build/config
export default defineConfig({
  integrations: [react(), compress()],
  vite: {
    plugins: [tailwindcss(), svgr()],
  },
  site: process.env.SITE_URL || "http://localhost:4321",
});
