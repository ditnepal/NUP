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
const count = files.filter(f => f.mtime.toISOString().startsWith('2026-03-26T07:33')).length;
console.log(`Files modified at 07:33: ${count}`);
console.log(`Total files: ${files.length}`);
