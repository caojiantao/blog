const path = require('path')
const fs = require('fs');
const markdownIt = require("markdown-it");
const meta = require("markdown-it-meta");

let md = new markdownIt();
md.use(meta);

let rootPath = path.join(__dirname, '../../posts');

let sidebar = {}
let sidebarItemMap = {}

let nav = []
let rewrites = {}

function scanPostList(dir) {
  let files = fs.readdirSync(dir);
  for (let file of files) {
    let filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    const isDirectory = stat.isDirectory();
    if (isDirectory) {
      scanPostList(filePath);
    } else if (file.endsWith('.md')) {
      filePath = filePath.replaceAll('\\', '/');
      let i = filePath.indexOf('docs') + 5;
      let file = fs.readFileSync(filePath, "utf-8");
      md.render(file);
      rewrites[filePath.substring(i)] = md?.meta?.permalink + '.md';

      let splits = filePath.substring(i).split('/');
      let items = getSidebarItems(splits.slice(0, splits.length - 1));
      items.push({
        text: md?.meta?.title,
        link: `/${md?.meta?.permalink}.html`,
      })
    }
  }
}

function getSidebarItems(splits) {
  let array = sidebarItemMap[splits.join('/')];
  if (array) {
    return array;
  }
  if (splits.length == 1) {
    if (!sidebar['/']) {
      sidebar['/'] = []
    }
    sidebarItemMap[splits.join('/')] = sidebar['/'];
    return sidebar['/'];
  }
  parentItems = getSidebarItems(splits.slice(0, splits.length - 1));
  let item = {
    text: splits[splits.length - 1].substring(4),
    collapsed: true,
    items: [],
  }
  parentItems.push(item)
  sidebarItemMap[splits.join('/')] = item.items;
  return item.items;
}

scanPostList(rootPath);

module.exports = {
  nav,
  sidebar,
  rewrites,
}