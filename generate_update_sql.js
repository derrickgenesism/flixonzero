const fs = require('fs');
const data = JSON.parse(fs.readFileSync('src/data/flixon_export.json', 'utf8'));

let sql = '-- SUPABASE MOVIE UPDATE SCRIPT\n\n';

sql += 'INSERT INTO movies (id, title, description, type, thumbnail_url, video_url, created_at) VALUES\n';
const values = data.movies.map(m => {
  const title = (m.title || '').replace(/'/g, "''");
  const desc = (m.description || '').replace(/'/g, "''");
  const type = (m.type || '').replace(/'/g, "''");
  const thumb = (m.thumbnail_url || '').replace(/'/g, "''");
  const video = (m.video_url || '').replace(/'/g, "''");
  return `(${m.id}, '${title}', '${desc}', '${type}', '${thumb}', '${video}', '${m.created_at}')`;
});
sql += values.join(',\n') + '\nON CONFLICT (id) DO UPDATE SET \n  video_url = EXCLUDED.video_url,\n  thumbnail_url = EXCLUDED.thumbnail_url;\n\n';

fs.writeFileSync('../update_movies.sql', sql);
console.log('update_movies.sql generated successfully.');
