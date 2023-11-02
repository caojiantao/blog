const getConfig = require("vuepress-bar");

const { nav, sidebar } = getConfig({
  addReadMeToFirstGroup: false,
  filter: meta => !meta.hideSideBar,
});

module.exports = {
  title: "涛涛小站",
  description: "曹建涛的个人博客",
  locales: {
    "/": {
      lang: "zh-CN",
    },
  },
  themeConfig: {
    repo: "caojiantao",
    editLinks: true,
    editLinkText: "编辑此页",
    activeHeaderLinks: false,
    docsRepo: "caojiantao/blog",
    docsDir: "docs",
    docsBranch: "main",
    nav,
    sidebar,
  },
  plugins: {
    "@vuepress/back-to-top": {},
    '@vuepress/search': {},
    'sitemap': {
      hostname: 'https://caojiantao.site'
    }
  },
};
