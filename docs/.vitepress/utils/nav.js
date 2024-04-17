const { slugify } = require('transliteration')
const path = require('path')
const fs = require('fs');
const markdownIt = require("markdown-it");
const meta = require("markdown-it-meta");
const moment = require('moment')

let md = new markdownIt();
md.use(meta);

let rootPath = path.join(__dirname, '../../posts');

let files = fs.readdirSync(rootPath);

let sidebar = {}
let sidebarItemMap = {}

let nav = []
let rewrites = {}

const getFileSort = (filePath) => {
  const stat = fs.statSync(filePath);
  const isDirectory = stat.isDirectory();
  if (isDirectory) {
    return moment(0);
  }
  let md = new markdownIt();
  md.use(meta);
  let file = fs.readFileSync(filePath, "utf-8");
  md.render(file);
  return moment(md?.meta?.date);
}

const getNextSidebar = (prefix, dir) => {
  let files = fs.readdirSync(dir);
  files.sort((a, b) => {
    let m1 = getFileSort(path.join(dir, a));
    let m2 = getFileSort(path.join(dir, b));
    return m1.diff(m2);
  });
  let bars = []
  for (let file of files) {
    let filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    const isDirectory = stat.isDirectory();
    let file2 = slugify(file);
    if (isDirectory) {
      let bar = {
        title: file.replace(/(nav-)?(\d+-)?(\.md)?/g, ''),
        collapsible: true,
      }
      bar.children = getNextSidebar(`${prefix}/${file2}`, filePath);
      bars.push(bar);
    } else {
      bars.push(`${prefix}/${file2}`)
    }
  }
  return bars;
}

const getFirstPage = (bar) => {
  if (typeof (bar) == 'string') {
    return bar;
  } else if (Array.isArray(bar)) {
    return getFirstPage(bar[0]);
  } else {
    return getFirstPage(bar.children);
  }
}

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

for (let file of files) {
  let filePath = path.join(rootPath, file);
  const stat = fs.statSync(filePath);
  const isDirectory = stat.isDirectory();
  let file2 = slugify(file);
  let prefix = `/${file2}`;
  if (isDirectory) {
    sidebar[prefix] = getNextSidebar(prefix, filePath);
  } else {
    sidebar[prefix] = `/${file2}`
  }
  nav.push({
    text: file.replace(/(nav-)?(\d+-)?(\.md)?/g, ''),
    link: getFirstPage(sidebar[prefix]),
  })
}

module.exports = {
  nav,
  sidebar,
  rewrites,
}