const fs = require('fs');
let file = 'src/app/movie/[id]/VideoPlayer.js';
let content = fs.readFileSync(file, 'utf8');

// Replace: <source src={streamUrl} type="video/mp4" />
// With: <source src={streamUrl} />
content = content.replace('<source src={streamUrl} type="video/mp4" />', '<source src={streamUrl} />');

fs.writeFileSync(file, content);
console.log('Removed hardcoded MP4 type');
