const fs = require('fs');
let file = 'src/app/admin/(protected)/movies/add/AddMovieClient.js';
let content = fs.readFileSync(file, 'utf8');
const idx = content.indexOf('VJ (Translator)');
console.log('Index:', idx);
console.log(content.substring(idx - 100, idx + 800));
