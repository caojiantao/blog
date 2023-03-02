const getConfig = require("vuepress-bar");
const slugify = require("transliteration").slugify;

const { sidebar } = getConfig();

for (let menu of sidebar) {
  menu.children = menu.children
    .filter(item => item)
    .map(item => {
      return slugify(item, { ignore: ["/", "."] });
    });
}

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
    "permalink-pinyin": true,
  },
};
