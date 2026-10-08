const fs = require('fs');
let pageCode = fs.readFileSync('src/app/page.js', 'utf8');

const newArrivalsRegex = /const newArrivals = isSectionEnabled\('New Arrivals'\) \? safeMovies\.filter\(m => !m\.is_coming_soon\)\.slice\(0, 15\) : \[\];/;
const freeMoviesRegex = /const freeMovies = isSectionEnabled\('Free'\) \? safeMovies\.filter\(m => m\.type === 'genesis_free_movie' && !m\.is_coming_soon\)\.slice\(0, 15\) : \[\];/;

const newArrivalsReplacement = `const now = Date.now();
  const newArrivals = isSectionEnabled('New Arrivals') ? [...safeMovies].filter(m => !m.is_coming_soon).sort((a, b) => {
    const isANew = a.categories?.some(c => {
      if (c === 'New Arrival') return true;
      if (c.startsWith('NewArrival:')) {
        const ts = parseInt(c.split(':')[1], 10);
        return ts > now;
      }
      return false;
    }) ? 1 : 0;
    
    const isBNew = b.categories?.some(c => {
      if (c === 'New Arrival') return true;
      if (c.startsWith('NewArrival:')) {
        const ts = parseInt(c.split(':')[1], 10);
        return ts > now;
      }
      return false;
    }) ? 1 : 0;
    
    return isBNew - isANew;
  }).slice(0, 15) : [];`;

const freeMoviesReplacement = `const freeMovies = isSectionEnabled('Free') ? safeMovies.filter(m => (m.type === 'genesis_free_movie' || m.categories?.includes('Free to Watch')) && !m.is_coming_soon).slice(0, 15) : [];`;

pageCode = pageCode.replace(newArrivalsRegex, newArrivalsReplacement);
pageCode = pageCode.replace(freeMoviesRegex, freeMoviesReplacement);
pageCode = pageCode.replace(
  `<MovieRow title="Free" movies={freeMovies} href="/?category=Free" />`,
  `<MovieRow title="?? Free to Watch" movies={freeMovies} href="/?category=Free" accentColor="#4ade80" />`
);

fs.writeFileSync('src/app/page.js', pageCode);
console.log('page.js updated');
