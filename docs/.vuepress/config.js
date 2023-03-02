const getSidebar = require("./utils/side-bar.js")

let sidebar = getSidebar();


module.exports = {
  title: "涛涛小站",
  description: "曹建涛的个人博客",
  locales: {
    "/": {
      lang: "zh-CN"
    }
  },
  markdown: {
    lineNumbers: true,
    extendMarkdown: md => {
    }
  },
  themeConfig: {
    repo: "caojiantao",
    editLinks: true,
    editLinkText: "编辑此页",
    lastUpdated: "上次更新",
    search: false,
    activeHeaderLinks: false,
    docsRepo: "caojiantao/blog",
    docsDir: "docs",
    docsBranch: "main",
    sidebar: sidebar,
  },
  plugins: {
    "@vuepress/last-updated": {
      transformer: (timestamp, lang) => {
        const moment = require("moment");
        moment.locale(lang);
        return moment(timestamp).format("L");
      },
    },
    "@vuepress/back-to-top": true,
  },
};
