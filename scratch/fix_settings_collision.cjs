const fs = require('fs');
let file = 'src/app/movie/[id]/page.js';
let content = fs.readFileSync(file, 'utf8');

// The original one was:
//   // PPV price from settings
//   const settings = await getCachedSettings();
content = content.replace(`  // PPV price from settings\r\n  const settings = await getCachedSettings();\r\n`, `  // PPV price from settings\r\n`);
content = content.replace(`  // PPV price from settings\n  const settings = await getCachedSettings();\n`, `  // PPV price from settings\n`);

fs.writeFileSync(file, content);
console.log('Removed duplicate settings declaration');
