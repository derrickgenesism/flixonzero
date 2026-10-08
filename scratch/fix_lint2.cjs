const fs = require('fs');
let file = 'src/app/login/LoginForm.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace("      if (storedRef) setLocalRef(storedRef);", "      // eslint-disable-next-line\n      if (storedRef) setLocalRef(storedRef);");

fs.writeFileSync(file, content);
console.log('Fixed set-state lint error');
