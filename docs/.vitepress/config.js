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
      options: {
        translations: {
          button: {
            buttonText: '搜索文档',
            buttonAriaLabel: '搜索文档',
          },
          modal: {
            noResultsText: "无法找到相关结果",
            resetButtonTitle: "清除查询条件",
            footer: {
              selectText: "选择",
              navigateText: "切换",
            }
          }
        }
      }
    },
    nav: nav,
    sidebar: sidebar,
    socialLinks: [
      { icon: 'github', link: 'https://github.com/caojiantao' }
    ],
    outline: {
      level: [2, 6],
      label: '目录'
    },
  },
  rewrites: rewrites,
};
