const fs = require('fs');
let file = 'src/app/movie/[id]/page.js';
let content = fs.readFileSync(file, 'utf8');

const target = `  const ppvEnabled = ppvPrice > 0 && !isFreeMovie;

  const isFreeMovie = movie.type === 'genesis_free_movie' || (movie.categories && (Array.isArray(movie.categories) ? movie.categories.includes('Free to Watch') : typeof movie.categories === 'string' && movie.categories.includes('Free to Watch')));`;

const replacement = `  const isFreeMovie = movie.type === 'genesis_free_movie' || (movie.categories && (Array.isArray(movie.categories) ? movie.categories.includes('Free to Watch') : typeof movie.categories === 'string' && movie.categories.includes('Free to Watch')));
  
  const ppvEnabled = ppvPrice > 0 && !isFreeMovie;`;

content = content.replace(target, replacement);

fs.writeFileSync(file, content);
console.log('Fixed initialization order error in movie page');
