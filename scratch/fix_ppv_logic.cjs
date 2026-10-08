const fs = require('fs');
let file = 'src/app/movie/[id]/page.js';
let content = fs.readFileSync(file, 'utf8');

const regex = /const ppvEnabled = ppvPrice > 0 && movie\.type !== 'genesis_free_movie';/g;
content = content.replace(regex, `const ppvEnabled = ppvPrice > 0 && !isFreeMovie;`);

fs.writeFileSync(file, content);
console.log('Fixed PPV logic on free movies');
