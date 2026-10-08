const fs = require('fs');

let pageCode = fs.readFileSync('src/app/page.js', 'utf8');

// 1. Fix new arrivals logic
pageCode = pageCode.replace(
  `const newArrivals = isSectionEnabled('New Arrivals') ? safeMovies.filter(m => !m.is_coming_soon).slice(0, 15) : [];`,
  `const newArrivals = isSectionEnabled('New Arrivals') ? [...safeMovies].filter(m => !m.is_coming_soon).sort((a,b) => (b.categories?.includes('New Arrival') ? 1 : 0) - (a.categories?.includes('New Arrival') ? 1 : 0)).slice(0, 15) : [];`
);

// 2. Fix free movies logic
pageCode = pageCode.replace(
  `const freeMovies = isSectionEnabled('Free') ? safeMovies.filter(m => m.type === 'genesis_free_movie' && !m.is_coming_soon).slice(0, 15) : [];`,
  `const freeMovies = isSectionEnabled('Free') ? safeMovies.filter(m => (m.type === 'genesis_free_movie' || m.categories?.includes('Free to Watch')) && !m.is_coming_soon).slice(0, 15) : [];`
);

// 3. Highlight the Free row
pageCode = pageCode.replace(
  `<MovieRow title="Free" movies={freeMovies} href="/?category=Free" />`,
  `<MovieRow title="?? Free to Watch" movies={freeMovies} href="/?category=Free" accentColor="#4ade80" />`
);

fs.writeFileSync('src/app/page.js', pageCode);
console.log('page.js updated');
