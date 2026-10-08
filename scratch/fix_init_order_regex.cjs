const fs = require('fs');
let file = 'src/app/movie/[id]/page.js';
let content = fs.readFileSync(file, 'utf8');

const regex = /const ppvEnabled = ppvPrice > 0 && !isFreeMovie;[\s\S]*?const isFreeMovie = movie\.type === 'genesis_free_movie'[\s\S]*?includes\('Free to Watch'\)\)\);/;
const replacement = `const isFreeMovie = movie.type === 'genesis_free_movie' || (movie.categories && (Array.isArray(movie.categories) ? movie.categories.includes('Free to Watch') : typeof movie.categories === 'string' && movie.categories.includes('Free to Watch')));\n  const ppvEnabled = ppvPrice > 0 && !isFreeMovie;`;

content = content.replace(regex, replacement);

fs.writeFileSync(file, content);
console.log('Fixed initialization order error via regex');
