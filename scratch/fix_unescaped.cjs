const fs = require('fs');
let file = 'src/app/search/page.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace('Search results for "{query}"', 'Search results for &quot;{query}&quot;');

fs.writeFileSync(file, content);
console.log('Fixed unescaped entities');
