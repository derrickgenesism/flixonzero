const fs = require('fs');

let pageCode = fs.readFileSync('src/app/movie/[id]/page.js', 'utf8');

// Update access logic to recognize the new category
pageCode = pageCode.replace(
  `if (movie.type === 'genesis_free_movie') {`,
  `if (movie.type === 'genesis_free_movie' || (movie.categories && movie.categories.includes('Free to Watch'))) {`
);

// Update paywall message to reflect free nature accurately
pageCode = pageCode.replace(
  `{movie.type === 'genesis_free_movie' ? (`,
  `{(movie.type === 'genesis_free_movie' || (movie.categories && movie.categories.includes('Free to Watch'))) ? (`
);

fs.writeFileSync('src/app/movie/[id]/page.js', pageCode);
console.log('movie page updated');
