const fs = require('fs');
let file = 'src/components/SearchInput.js';
let content = fs.readFileSync(file, 'utf8');

const regex = /return movie\.type === 'genesis_free_movie' \? 'Free Movie' : movie\.type === 'gsm_series' \? 'Series' : 'Premium Movie';/g;
content = content.replace(regex, `const isFree = movie.type === 'genesis_free_movie' || (movie.categories && (Array.isArray(movie.categories) ? movie.categories.includes('Free to Watch') : typeof movie.categories === 'string' && movie.categories.includes('Free to Watch')));
                    return isFree ? 'Free Movie' : movie.type === 'gsm_series' ? 'Series' : 'Premium Movie';`);

fs.writeFileSync(file, content);
console.log('Fixed SearchInput labels');
