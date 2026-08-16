const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./src/data/flixon_export.json', 'utf8'));
let sql = '-- RESTORE SCRIPT\n\n';
data.movies.forEach(m => {
  if(m.video_url) {
    const title = (m.title || '').replace(/'/g, "''");
    const video = m.video_url.replace(/'/g, "''");
    sql += "UPDATE movies SET title = '', video_url = '' WHERE id = ;\n";
  }
});
fs.writeFileSync('../restore_movies.sql', sql);
console.log('Generated restore_movies.sql');
