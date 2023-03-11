import { defineConfig } from "vite";
import { resolve } from "path";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import copy from "rollup-plugin-copy";

// https://vitejs.dev/config/
export default defineConfig({
  root: "./web",
  build: {
    sourcemap: true,
    outDir: resolve("dist"),
    chunkSizeWarningLimit: 600000,
    rollupOptions: {
      plugins: [
        copy({
          targets: [
            { src: "./web/notepad2/*.bmp", dest: resolve("dist", "notepad2") },
          ],
        }),
      ],
      input: {
        main: resolve("web", "index.html"),

        // notepad2
        notepad2: resolve("web", "notepad2", "index.html"),
      },
      output: {
        manualChunks: {
          cm: ["codemirror"],
          langjavascript: ["@codemirror/lang-javascript"],
          langhtml: ["@codemirror/lang-html"],
          langcss: ["@codemirror/lang-css"],
          langjava: ["@codemirror/lang-java"],
          langvue: ["@codemirror/lang-vue"],
          langmarkdown: ["@codemirror/lang-markdown"],
          cmlangs: [
            "@codemirror/lang-angular",
            "@codemirror/lang-wast",
            "@codemirror/lang-xml",
            "@codemirror/lang-rust",
            "@codemirror/lang-sql",
            "@codemirror/lang-python",
            "@codemirror/lang-php",
            "@codemirror/lang-cpp",
            "@codemirror/lang-json",
            // TODO: why this doesn't work
            // "@codemirror/legacy-modes",
            "@codemirror/theme-one-dark",
          ],
        },
      },
    },
  },
  server: {
    // must be same as proxyURLStr in runServerDev
    port: 3025,
  },
  plugins: [svelte()],
});
