import copy from "rollup-plugin-copy";
import { defineConfig } from "vite";
import { resolve } from "path";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { visualizer } from "rollup-plugin-visualizer";

// https://vitejs.dev/config/
export default defineConfig({
  root: "./src",
  build: {
    // must be false because rollup-plugin-copy is called before
    // the dir is emptied
    emptyOutDir: false,
    sourcemap: true,
    outDir: resolve("..", "server", "dist"),
    chunkSizeWarningLimit: 600000,
    rollupOptions: {
      input: {
        main: resolve("src", "index.html"),
        test: resolve("src", "test.html"),
        unzip: resolve("src", "unzip", "index.html"),
        wc: resolve("src", "wc", "index.html"),
        fm: resolve("src", "fm", "index.html"),
        image_resize_optimize: resolve(
          "src",
          "image-resize-optimize",
          "index.html"
        ),
        goplayground: resolve("src", "goplayground", "index.html"),
        github_success: resolve("src", "github_success.html"),
        notepad2: resolve("src", "notepad2", "index.html"),
        calc: resolve("src", "calc", "index.html"),
        qrscanner: resolve("src", "qrscanner", "index.html"),
        // gist editor
        gisteditor: resolve("src", "gisteditor", "index.html"),
        gistedit: resolve("src", "gisteditor", "edit.html"),
        nogist: resolve("src", "gisteditor", "nogist.html"),
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
              src: "./src/notepad2/**/*.bmp",
              dest: resolve("..", "server", "dist", "notepad2"),
            },
            {
              src: "./src/libarchive/**/*",
              dest: resolve("..", "server", "dist", "libarchive"),
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
  plugins: [
    svelte(),
    visualizer({
      filename: `../server/dist/bundlestats.html`,
      sourcemap: true,
    }),
  ],
});
