const fs = require('fs');
let file = 'src/components/SearchInput.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/clean\.slice\(0, 2\)\.join\('.*?'\)/g, "clean.slice(0, 2).join(' \u2022 ')");

fs.writeFileSync(file, content);
console.log('Fixed separator in SearchInput.js');
