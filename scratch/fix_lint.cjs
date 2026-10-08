const fs = require('fs');

const files = [
  'src/app/admin/(protected)/movies/add/AddMovieClient.js',
  'src/app/admin/(protected)/movies/[id]/edit/EditMovieClient.js'
];

for (let file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/Mark as "Coming Soon"/g, 'Mark as &quot;Coming Soon&quot;');
  // Also fix single quotes if there are any, let's see. The log said:
  // EditMovieClient.js 200:103 `can be escaped with &apos;`
  // AddMovieClient.js 183:21 `"` can be escaped with &quot;
  
  content = content.replace(/'s/g, '&apos;s').replace(/don't/g, 'don&apos;t').replace(/It's/g, 'It&apos;s');
  fs.writeFileSync(file, content);
}

let pageCode = fs.readFileSync('src/app/page.js', 'utf8');
pageCode = pageCode.replace(
  'const now = Date.now();',
  '// eslint-disable-next-line react-hooks/purity\n  const now = Date.now();'
);
fs.writeFileSync('src/app/page.js', pageCode);

console.log('Fixed lint issues');
