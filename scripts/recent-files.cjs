const fs = require('fs');
const path = require('path');

function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        walk(path.join(dir, file), fileList);
      }
    } else {
      fileList.push({ file: path.join(dir, file), mtime: stat.mtime });
    }
  }
  return fileList;
}

const files = walk('.');
files.sort((a, b) => b.mtime - a.mtime);
console.log(files.slice(0, 50).map(f => `${f.file} - ${f.mtime}`).join('\n'));
