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
const counts = {};
for (const f of files) {
  const dateStr = f.mtime.toISOString().substring(0, 13); // Group by hour
  counts[dateStr] = (counts[dateStr] || 0) + 1;
}
console.log(counts);
