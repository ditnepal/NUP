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
const recent = files.filter(f => f.mtime > new Date('2026-03-26T07:34:00Z') && f.mtime < new Date('2026-03-26T13:30:00Z'));
console.log(`Files modified between 07:34 and 13:30: ${recent.length}`);
for (const f of recent) {
  console.log(`${f.file} - ${f.mtime}`);
}
