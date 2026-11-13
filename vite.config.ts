import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  plugins: [
    tailwindcss(),
    tsconfigPaths(),
    tanstackStart({ server: { entry: "server" } }),
    react(),
  ],
  server: {
    watch: {
      ignored: [
        "**/dist/**",
        "**/dataset/**",
        "**/docs/**",
        "**/.tanstack/**",
        "**/coverage/**",
        "**/.git/**",
        "**/data/**",
        "**/*.db*",
        "**/*.db-wal",
        "**/*.db-shm",
      ],
    },
  },
  optimizeDeps: {
    include: [
      "gsap",
      "@gsap/react",
      "lucide-react",
      "clsx",
      "tailwind-merge",
      "@tanstack/react-router",
      "@tanstack/router-core",
      "@tanstack/router-core/isServer",
      "@tanstack/router-core/ssr/client",
      "@tanstack/react-query",
      "date-fns",
      "class-variance-authority",
      "zod",
      "react-resizable-panels",
      "sonner",
      "react-markdown",
      "dompurify",
      "@vercel/speed-insights/react",
    ],
    exclude: [
      "better-sqlite3",
      "drizzle-orm/better-sqlite3",
      "@tanstack/react-start",
      "@tanstack/react-start/server",
      "@tanstack/start-server-core",
    ],
  },
  ssr: {
    noExternal: ["gsap", "@gsap/react", "@vercel/speed-insights"],
    external: ["better-sqlite3", "drizzle-orm/better-sqlite3"],
  },
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      onwarn(warning, warn) {
        if (
          warning.code === "UNUSED_EXTERNAL_IMPORT" ||
          warning.code === "MODULE_LEVEL_DIRECTIVE" ||
          warning.code === "INVALID_ANNOTATION" ||
          warning.message?.includes("use client") ||
          warning.message?.includes("never used") ||
          warning.message?.includes("contains an annotation that Rollup cannot interpret")
        ) {
          return;
        }
        warn(warning);
      },
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (
              id.includes("jspdf") ||
              id.includes("html-to-image") ||
              id.includes("html2canvas")
            ) {
              return "vendor-pdf";
            }
            if (id.includes("gsap")) {
              return "vendor-animation";
            }
            if (id.includes("@tanstack/react-router") || id.includes("@tanstack/react-query")) {
              return "vendor-tanstack";
            }
            if (id.includes("@radix-ui")) {
              return "vendor-radix";
            }
            if (id.includes("lucide-react")) {
              return "vendor-icons";
            }
          }
        },
      },
    },
  },
});
