const fs = require('fs');
let file = 'src/app/login/LoginForm.js';
let content = fs.readFileSync(file, 'utf8');

const regex = /\{\/\* Divider \*\/\}([\s\S]*?)<\/form>/;

content = content.replace(regex, (match) => {
  return `{googleAuthEnabled && (
        <>
          ${match}
        </>
      )}`;
});

fs.writeFileSync(file, content);
console.log('Successfully wrapped Divider and Google form');
