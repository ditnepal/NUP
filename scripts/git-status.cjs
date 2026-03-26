const { execSync } = require('child_process');
console.log(execSync('git status').toString());
console.log('---');
console.log(execSync('git diff --name-status').toString());
