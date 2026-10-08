const fs = require('fs');
let file = 'src/components/Hero.js';
let content = fs.readFileSync(file, 'utf8');

const regex1 = /const typeLabel = movie\.type === 'genesis_free_movie'\s*\?\s*'Free'\s*:\s*movie\.type === 'gsm_series'\s*\?\s*'Series'\s*:\s*'Premium';/g;
content = content.replace(regex1, `const isFree = movie.type === 'genesis_free_movie' || (movie.categories && (Array.isArray(movie.categories) ? movie.categories.includes('Free to Watch') : typeof movie.categories === 'string' && movie.categories.includes('Free to Watch')));
        const typeLabel = isFree ? 'Free' : movie.type === 'gsm_series' ? 'Series' : 'Premium';`);

const regex2 = /const badgeClass = movie\.type === 'genesis_free_movie'\s*\?\s*'flx-hero__badge--free'\s*:\s*movie\.type === 'gsm_series'\s*\?\s*'flx-hero__badge--series'\s*:\s*'flx-hero__badge--premium';/g;
content = content.replace(regex2, `const badgeClass = isFree ? 'flx-hero__badge--free' : movie.type === 'gsm_series' ? 'flx-hero__badge--series' : 'flx-hero__badge--premium';`);

fs.writeFileSync(file, content);
console.log('Fixed Hero labels');
