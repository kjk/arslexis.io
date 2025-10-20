import copy from "rollup-plugin-copy";
import { defineConfig } from "vite";
import { resolve } from "path";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { visualizer } from "rollup-plugin-visualizer";
import tailwindcss from "@tailwindcss/vite";

function manualChunks(id) {
  if (id.includes("codemirror")) {
    if (id.includes("node_modules/codemirror")) {
      return "cm";
    }
    if (id.includes("@codemirror/lang-javascript")) {
      return "langjavascript";
    }
    if (id.includes("@codemirror/lang-html")) {
      return "langhtml";
    }
    if (id.includes("@codemirror/lang-css")) {
      return "langcss";
    }
    if (id.includes("@codemirror/lang-java")) {
      return "langjava";
    }
    if (id.includes("@codemirror/lang-vue")) {
      return "langvue";
    }
    if (id.includes("@codemirror/lang-markdown")) {
      return "langmarkdown";
    }
    if (id.includes("@codemirror/lang-xml")) {
      return "langxml";
    }
    if (id.includes("@codemirror/lang-json")) {
      return "langjson";
    }
    if (id.includes("@replit/codemirror-lang-svelte")) {
      return "langsvelte";
    }
    if (id.includes("@codemirror/lang-rust")) {
      return "langrust";
    }
    if (id.includes("@codemirror/lang-sql")) {
      return "langsql";
    }
    if (id.includes("@codemirror/lang-python")) {
      return "langpython";
    }
    if (id.includes("@codemirror/lang-php")) {
      return "langphp";
    }
    if (id.includes("@codemirror/lang-cpp")) {
      return "langcpp";
    }
    if (id.includes("@codemirror/legacy-modes")) {
      return "langlegacy";
    }
    if (id.includes("@codemirror/theme-one-dark")) {
      return "cmlangs";
    }
  }
}

let inputOpts = {
  main: resolve("src", "index.html"),
  test: resolve("src", "test.html"),
  unzip: resolve("src", "unzip", "index.html"),
  wc: resolve("src", "wc", "index.html"),
  fm: resolve("src", "fm", "index.html"),
  bookmarks: resolve("src", "bookmarks", "index.html"),
  image_resize_optimize: resolve("src", "image-resize-optimize", "index.html"),
  goplayground: resolve("src", "goplayground", "index.html"),
  github_success: resolve("src", "github_success.html"),
  notepad2: resolve("src", "notepad2", "index.html"),
  calc: resolve("src", "calc", "index.html"),
  qrscanner: resolve("src", "qrscanner", "index.html"),
  // gist editor
  gisteditor: resolve("src", "gisteditor", "index.html"),
  gistedit: resolve("src", "gisteditor", "edit.html"),
  nogist: resolve("src", "gisteditor", "nogist.html"),
};

// https://vitejs.dev/config/
export default defineConfig({
  root: "./src",
  build: {
    // must be false because rollup-plugin-copy is called before
    // the dir is emptied
    emptyOutDir: false,
    sourcemap: true,
    outDir: resolve("dist"),
    chunkSizeWarningLimit: 600000,
    rollupOptions: {
      input: inputOpts,

      output: {
        manualChunks,
      },

      plugins: [
        copy({
          verbose: true,
          targets: [
            {
              src: "./src/notepad2/**/*.bmp",
              dest: resolve("dist", "notepad2"),
            },
            {
              src: "./src/libarchive/**/*",
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
  plugins: [
    svelte(),
    tailwindcss(),
    visualizer({
      filename: `./dist/bundlestats.html`,
      sourcemap: true,
    }),
  ],
});
