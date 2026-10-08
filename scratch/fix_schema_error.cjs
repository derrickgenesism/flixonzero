const fs = require('fs');
let file1 = 'src/lib/cache.js';
let file2 = 'src/app/actions/fetchMovies.js';

let content1 = fs.readFileSync(file1, 'utf8');
let content2 = fs.readFileSync(file2, 'utf8');

const BAD_COLS = "id, title, description, thumbnail_url, type, categories, release_year, imdb_rating, created_at, actors, is_coming_soon, series_id, season_number, episode_number";
const GOOD_COLS = "id, title, description, thumbnail_url, type, categories, release_year, created_at, actors, series_id, season_number, episode_number";

content1 = content1.replace(new RegExp(BAD_COLS, 'g'), GOOD_COLS);
content2 = content2.replace(new RegExp(BAD_COLS, 'g'), GOOD_COLS);

fs.writeFileSync(file1, content1);
fs.writeFileSync(file2, content2);
console.log('Fixed missing columns error');
