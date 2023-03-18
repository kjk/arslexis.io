export default {
  title: "onlinetool.io",
  description: "Documentation for onlintool.io tools",
  cleanUrls: true,
  base: "/docs/",
  srcDir: "./markdown",
  outDir: "../dist/docs",

  themeConfig: {
    siteTitle: "onlinetool.io",
    editLink: {
      pattern: "https://github.com/kjk/onlinetool/edit/main/docs/:path",
    },
    sidebar: [
      {
        text: "notepad2",
        items: [
          { text: "About Notepad2", link: "/notepad2" },
          { text: "Differences", link: "/notepad2-differences" },
        ],
      },
      {
        text: "Gist Editor",
        items: [{ text: "About Gist Editor", link: "/gist-editor" }],
      },
      {
        text: "wc",
        items: [{ text: "About wc", link: "/wc" }],
      },
    ],
  },
};
