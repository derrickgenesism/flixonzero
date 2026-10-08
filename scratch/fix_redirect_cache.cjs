const fs = require('fs');
let file = 'src/app/api/video/stream/[token]/route.js';
let content = fs.readFileSync(file, 'utf8');

const regex = /return NextResponse\.redirect\(resolved\.videoUrl, \{ status: 302 \}\);/;
const replacement = `const response = NextResponse.redirect(resolved.videoUrl, { status: 302 });
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  return response;`;

if (content.match(regex)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync(file, content);
  console.log('Added Cache-Control to 302 redirect');
} else {
  console.log('Regex did not match');
}
