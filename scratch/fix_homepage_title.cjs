const fs = require('fs');
let file = 'src/app/page.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace('title="?? Free to Watch"', 'title="Free to Watch"');

fs.writeFileSync(file, content);
console.log('Fixed MovieRow title on homepage');
