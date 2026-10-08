const fs = require('fs');
let file = 'src/lib/cache.js';
let content = fs.readFileSync(file, 'utf8');

const SAFE_COLS = "id, title, description, thumbnail_url, type, categories, release_year, imdb_rating, created_at, actors, is_coming_soon, series_id, season_number, episode_number";

content = content.replace(/getAnonClient\(\)\.from\('movies'\)\.select\('\*'\)\.order/g, `getAnonClient().from('movies').select('${SAFE_COLS}').order`);
// For getCachedMovieById we should keep video_url if needed, but actually the movie page fetches it securely in the server component or we just don't cache video_url publicly! Let's keep it safe.
content = content.replace(/getAnonClient\(\)\.from\('movies'\)\.select\('\*'\)\.eq\('id', id\)/g, `getAnonClient().from('movies').select('${SAFE_COLS}, video_url').eq('id', id)`);

fs.writeFileSync(file, content);
console.log('Fixed cache data leakage');
