const fs = require('fs');
let file = 'src/app/admin/(protected)/movies/[id]/edit/EditMovieClient.js';
let content = fs.readFileSync(file, 'utf8');

const startIdx = content.indexOf('<Field label="VJ (Translator)">');
const endIdx = content.indexOf('</Field>', content.indexOf('<label style={{ display: \'block\', fontSize: \'12px\'', startIdx));

if (startIdx === -1) {
  console.log('Could not find start index');
} else {
  // Wait, in EditMovieClient, there's no `</Field>` around Special Tags!
  // I added Special Tags as `<div> <label>Special Tags</label> ... </div>` right inside the `<Field label="Genres">` or something?
  // Let me find exactly where I am in the file.
}
