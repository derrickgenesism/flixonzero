const fs = require('fs');
let file = 'src/app/movie/[id]/page.js';
let content = fs.readFileSync(file, 'utf8');

// Replace the last `}` from newLogic that I just injected!
// Since it's exactly: `|| globalFreeMode;\r\n  }` or `\n  }`
content = content.replace(/\|\| globalFreeMode;\r?\n\s*\}/, '|| globalFreeMode;');
fs.writeFileSync(file, content);
console.log('Removed dangling brace');
