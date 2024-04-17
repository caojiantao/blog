import { nav, rewrites, sidebar } from './utils/nav'

// .vitepress/config.js
export default {
  title: "涛涛小站",
  description: "曹建涛的个人博客",
  locales: {
    "/": {
      lang: "zh-CN",
    },
  },
  ignoreDeadLinks: true,
  themeConfig: {
    repo: "caojiantao",
    logo: 'logo.jpg',
    editLinks: true,
    editLinkText: "编辑此页",
    footer: {
      message: '基于 MIT 许可发布',
      copyright: '版权所有 © 2023-2024 曹建涛'
    },
    i18nRouting: true,
    search: {
      provider: 'local',
    },
    // nav: nav,
    sidebar: sidebar,
    socialLinks: [
      { icon: 'github', link: 'https://github.com/caojiantao' }
    ],
  },
  rewrites: rewrites,
};
