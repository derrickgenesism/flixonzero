const fs = require('fs');
let code = fs.readFileSync('src/app/page.js', 'utf8');
code = code.replace(
  'export const revalidate = 3600;\n',
  '// Note: This page reads auth cookies so page-level ISR is not applied.\n// Data-level caching is handled in src/lib/cache.js via unstable_cache\n'
);
code = code.replace(
  'export const revalidate = 3600;\r\n',
  '// Note: This page reads auth cookies so page-level ISR is not applied.\r\n// Data-level caching is handled in src/lib/cache.js via unstable_cache\r\n'
);
fs.writeFileSync('src/app/page.js', code);
console.log('Done');
