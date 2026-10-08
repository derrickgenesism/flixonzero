const fs = require('fs');
let file = 'src/app/admin/(protected)/settings/page.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(`<form action={updateSettings}>`, `<form action={saveSettings}>`);

fs.writeFileSync(file, content);
console.log('Fixed form action in page.js');
