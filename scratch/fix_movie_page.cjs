const fs = require('fs');
let file = 'src/app/movie/[id]/page.js';
let content = fs.readFileSync(file, 'utf8');

const regex1 = /const typeLabel = movie\.type === 'genesis_free_movie' \? 'Free' : movie\.type === 'gsm_series' \? 'Series' : 'Premium';/g;
content = content.replace(regex1, `const isFreeMovie = movie.type === 'genesis_free_movie' || (movie.categories && (Array.isArray(movie.categories) ? movie.categories.includes('Free to Watch') : typeof movie.categories === 'string' && movie.categories.includes('Free to Watch')));
  const typeLabel = isFreeMovie ? 'Free' : movie.type === 'gsm_series' ? 'Series' : 'Premium';`);

const regex2 = /const typeBadgeStyle = movie\.type === 'genesis_free_movie'/g;
content = content.replace(regex2, `const typeBadgeStyle = isFreeMovie`);

fs.writeFileSync(file, content);
console.log('Fixed movie page labels');
