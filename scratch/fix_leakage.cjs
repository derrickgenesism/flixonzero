const fs = require('fs');
let file = 'src/app/actions/fetchMovies.js';
let content = fs.readFileSync(file, 'utf8');

const SAFE_COLS = "id, title, description, thumbnail_url, type, categories, release_year, imdb_rating, created_at, actors, is_coming_soon, series_id, season_number, episode_number";

content = content.replace(/\.select\('\*', \{ count: 'exact' \}\)/g, `.select('${SAFE_COLS}', { count: 'exact' })`);
content = content.replace(/\.select\('movie_id, created_at, movies\(\*\)', \{ count: 'exact' \}\)/g, `.select('movie_id, created_at, movies(${SAFE_COLS})', { count: 'exact' })`);

fs.writeFileSync(file, content);
console.log('Fixed data leakage in fetchMovies.js');
