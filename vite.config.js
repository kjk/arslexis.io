import copy from "rollup-plugin-copy";
import { defineConfig } from "vite";
import { resolve } from "path";
import { svelte } from "@sveltejs/vite-plugin-svelte";

// https://vitejs.dev/config/
export default defineConfig({
  root: "./web",
  build: {
    // emptyOutDir: true,
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
        test: resolve("web", "test.html"),
        unzip: resolve("web", "unzip", "index.html"),
        wc: resolve("web", "wc", "index.html"),
        image_resize_optimize: resolve(
          "web",
          "image-resize-optimize",
          "index.html"
        ),
        goplayground: resolve("web", "goplayground", "index.html"),
        github_success: resolve("web", "github_success.html"),
        notepad2: resolve("web", "notepad2", "index.html"),
        calc: resolve("web", "calc", "index.html"),
        qrscanner: resolve("web", "qrscanner", "index.html"),
        // gist editor
        gisteditor: resolve("web", "gisteditor", "index.html"),
        gistedit: resolve("web", "gisteditor", "edit.html"),
        nogist: resolve("web", "gisteditor", "nogist.html"),
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
          langxml: ["@codemirror/lang-xml"],
          langjson: ["@codemirror/lang-json"],
          langsvelte: ["@replit/codemirror-lang-svelte"],

          langrust: ["@codemirror/lang-rust"],
          langsql: ["@codemirror/lang-sql"],
          langpython: ["@codemirror/lang-python"],
          langphp: ["@codemirror/lang-php"],
          langcpp: ["@codemirror/lang-cpp"],

          langlegacy: [
            "@codemirror/legacy-modes/mode/lua",
            "@codemirror/legacy-modes/mode/go",
            "@codemirror/legacy-modes/mode/diff",
            "@codemirror/legacy-modes/mode/css",
            "@codemirror/legacy-modes/mode/octave",
            "@codemirror/legacy-modes/mode/shell",
            "@codemirror/legacy-modes/mode/clike",
            "@codemirror/legacy-modes/mode/ruby",
          ],
          cmlangs: [
            // "@codemirror/lang-angular",
            // "@codemirror/lang-wast",
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
