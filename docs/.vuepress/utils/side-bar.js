const fs = require("fs")
const path = require("path")

const getSidebar = () => {
  let sideBar = [];
  let dirname = path.dirname(path.dirname(__dirname));
  let dirList = fs.readdirSync(dirname);
  dirList.forEach(dir => {
    if (dir == ".vuepress" || dir == 'README.md') {
      return;
    }
    let menu = {
      title: dir,
      children: []
    }
    let fileList = fs.readdirSync(`${dirname}/${dir}`);
    fileList.forEach(file => {
      menu.children.push([
        `/${dir}/${file.replace(".md", ".html")}`,
        file.replace(".md", "")
      ]);
    });
    sideBar.push(menu);
  })
  return sideBar;
}

module.exports = getSidebar