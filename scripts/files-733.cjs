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
const modifiedAt733 = files.filter(f => f.mtime.toISOString().startsWith('2026-03-26T07:33'));
console.log(modifiedAt733.map(f => f.file).slice(0, 50).join('\n'));
