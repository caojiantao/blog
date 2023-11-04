const { slugify } = require('transliteration')
const path = require('path')
const fs = require('fs');
const markdownIt = require("markdown-it");
const meta = require("markdown-it-meta");
const moment = require('moment')

let rootPath = path.join(__dirname, '../..');

let files = fs.readdirSync(rootPath);

let sidebar = {}
let nav = []

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
  if (typeof(bar) == 'string') {
    return bar;
  } else if (Array.isArray(bar)) {
    return getFirstPage(bar[0]);
  } else {
    return getFirstPage(bar.children);
  }
}

for (let file of files) {
  if (file == '.vuepress' || file == 'README.md') {
    continue;
  }
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
}