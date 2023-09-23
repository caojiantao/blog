const getConfig = require("vuepress-bar");

const { nav, sidebar } = getConfig({
  addReadMeToFirstGroup: false,
  filter: (meta) => !meta.individual,
});

// console.log(nav);
// console.log('------------------------------------------------------------')
// console.log(sidebar);

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
    lastUpdated: "上次更新",
    activeHeaderLinks: false,
    docsRepo: "caojiantao/blog",
    docsDir: "docs",
    docsBranch: "main",
    nav,
    sidebar,
  },
  plugins: {
    "@vuepress/last-updated": {
      transformer: (timestamp, lang) => {
        const moment = require("moment");
        moment.locale(lang);
        return moment(timestamp).format("L");
      },
    },
    "@vuepress/back-to-top": {},
    '@vuepress/search': {}
  },
};
