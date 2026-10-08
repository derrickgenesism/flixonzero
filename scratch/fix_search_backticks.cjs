const fs = require('fs');
let file = 'src/app/search/page.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace('<style>{', '<style>{`');
content = content.replace('}</style>', '`}</style>');

fs.writeFileSync(file, content);
console.log('Fixed backticks for style tag');
