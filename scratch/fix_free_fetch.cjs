const fs = require('fs');
let file = 'src/app/actions/fetchMovies.js';
let content = fs.readFileSync(file, 'utf8');

const regex = /\} else if \(category === 'Free'\) \{\s*query = query\.eq\('type', 'genesis_free_movie'\)\.order\('created_at', \{ ascending: false \}\);\s*\}/;
const replacement = `} else if (category === 'Free') {
    const all = await getCachedMovies();
    const free = all.filter(m => m.type === 'genesis_free_movie' || m.categories?.includes('Free to Watch'));
    return {
      movies: free.slice(from, to + 1),
      total: free.length
    };
  }`;

if (content.match(regex)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync(file, content);
  console.log('Fixed Free category fetching');
} else {
  console.log('Could not match Free category regex');
}
