import copy from "rollup-plugin-copy";
import { defineConfig } from "vite";
import { resolve } from "path";
import { svelte } from "@sveltejs/vite-plugin-svelte";

// https://vitejs.dev/config/
export default defineConfig({
  root: "./frontend",
  build: {
    // must be false because rollup-plugin-copy is called before
    // the dir is emptied
    emptyOutDir: false,
    sourcemap: true,
    outDir: resolve("frontend", "dist"),
    chunkSizeWarningLimit: 600000,
    rollupOptions: {
      input: {
        main: resolve("frontend", "index.html"),
        test: resolve("frontend", "test.html"),
        unzip: resolve("frontend", "unzip", "index.html"),
        wc: resolve("frontend", "wc", "index.html"),
        image_resize_optimize: resolve(
          "frontend",
          "image-resize-optimize",
          "index.html"
        ),
        goplayground: resolve("frontend", "goplayground", "index.html"),
        github_success: resolve("frontend", "github_success.html"),
        notepad2: resolve("frontend", "notepad2", "index.html"),
        calc: resolve("frontend", "calc", "index.html"),
        qrscanner: resolve("frontend", "qrscanner", "index.html"),
        // gist editor
        gisteditor: resolve("frontend", "gisteditor", "index.html"),
        gistedit: resolve("frontend", "gisteditor", "edit.html"),
        nogist: resolve("frontend", "gisteditor", "nogist.html"),
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

      plugins: [
        copy({
          verbose: true,
          targets: [
            {
              src: "./frontend/notepad2/**/*.bmp",
              dest: resolve("dist", "notepad2"),
            },
            {
              src: "./frontend/libarchive/**/*",
              dest: resolve("dist", "libarchive"),
            },
          ],
        }),
      ],
    },
  },
  server: {
    // must be same as proxyURLStr in runServerDev
    port: 3025,
  },
  plugins: [svelte()],
});
