const fs = require('fs');

let pageCode = fs.readFileSync('src/app/movie/[id]/page.js', 'utf8');

// Replace VJ_NAMES array and detectVJ function
pageCode = pageCode.replace(
  `const VJ_NAMES = ['VJ Junior', 'VJ Emmy', 'VJ Ice P', 'VJ ICE P', 'VJ Jingo', 'VJ Mark', 'VJ Kamil'];\n\nfunction detectVJ(categories) {\n  if (!Array.isArray(categories)) return null;\n  return VJ_NAMES.find(vj => categories.some(c => c.toLowerCase().includes(vj.toLowerCase().replace('vj ', 'vj')))) || null;\n}`,
  `function detectVJ(categories) {\n  if (!Array.isArray(categories)) return null;\n  return categories.find(c => c.toLowerCase().startsWith('vj '));\n}`
);

// We need to fix the places where VJ_NAMES is used to filter out VJ categories
pageCode = pageCode.replace(
  `const genre = Array.isArray(movie?.categories) ? movie.categories.filter(c => !VJ_NAMES.some(vj => c.toLowerCase().includes(vj.toLowerCase().replace('vj ', 'vj')))).join(', ') : '';`,
  `const genre = Array.isArray(movie?.categories) ? movie.categories.filter(c => !c.toLowerCase().startsWith('vj ')).join(', ') : '';`
);

pageCode = pageCode.replace(
  `'genre': cats.filter(c => !VJ_NAMES.some(vj => c.toLowerCase().includes(vj.toLowerCase().replace('vj ', 'vj')))),`,
  `'genre': cats.filter(c => !c.toLowerCase().startsWith('vj ')),`
);

fs.writeFileSync('src/app/movie/[id]/page.js', pageCode);
console.log('movie page updated for dynamic VJs');
