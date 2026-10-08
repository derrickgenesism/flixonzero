const fs = require('fs');
let file = 'src/app/login/LoginForm.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/useEffect\(\(\) => \{[\s\S]*?\}\, \[localRef\]\);/, function(match) {
  return match.replace(', [localRef]);', ', [refCode]);');
});

fs.writeFileSync(file, content);
console.log('Fixed useEffect dependency in LoginForm');
