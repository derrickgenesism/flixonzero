const fs = require('fs');
let file = 'src/components/MovieCard.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  `const typeLabel = type === 'genesis_free_movie' ? 'Free'\r\n    : (type === 'gsm_series' || is_series) ? 'Series'\r\n    : 'Premium';`,
  `const isFree = type === 'genesis_free_movie' || (categories && (Array.isArray(categories) ? categories.includes('Free to Watch') : typeof categories === 'string' && categories.includes('Free to Watch')));
  const typeLabel = isFree ? 'Free'
    : (type === 'gsm_series' || is_series) ? 'Series'
    : 'Premium';`
);

content = content.replace(
  `const typeLabel = type === 'genesis_free_movie' ? 'Free'\n    : (type === 'gsm_series' || is_series) ? 'Series'\n    : 'Premium';`,
  `const isFree = type === 'genesis_free_movie' || (categories && (Array.isArray(categories) ? categories.includes('Free to Watch') : typeof categories === 'string' && categories.includes('Free to Watch')));
  const typeLabel = isFree ? 'Free'
    : (type === 'gsm_series' || is_series) ? 'Series'
    : 'Premium';`
);

content = content.replace(
  `const badgeClass = type === 'genesis_free_movie' ? 'gms-card-badge--free'\r\n    : (type === 'gsm_series' || is_series) ? 'gms-card-badge--series'\r\n    : 'gms-card-badge--premium';`,
  `const badgeClass = isFree ? 'gms-card-badge--free'
    : (type === 'gsm_series' || is_series) ? 'gms-card-badge--series'
    : 'gms-card-badge--premium';`
);

content = content.replace(
  `const badgeClass = type === 'genesis_free_movie' ? 'gms-card-badge--free'\n    : (type === 'gsm_series' || is_series) ? 'gms-card-badge--series'\n    : 'gms-card-badge--premium';`,
  `const badgeClass = isFree ? 'gms-card-badge--free'
    : (type === 'gsm_series' || is_series) ? 'gms-card-badge--series'
    : 'gms-card-badge--premium';`
);

fs.writeFileSync(file, content);
console.log('Fixed MovieCard labels');
