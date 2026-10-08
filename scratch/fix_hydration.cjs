const fs = require('fs');
let file = 'src/app/support/SupportClient.js';
let content = fs.readFileSync(file, 'utf8');

const regex = /new Date\(msg\.created_at\)\.toLocaleTimeString\(\[\]\, \{ hour: '2-digit', minute: '2-digit' \}\)/g;
content = content.replace(regex, `new Date(msg.created_at).toISOString().substring(11, 16) /* hydration safe */`);

fs.writeFileSync(file, content);
console.log('Fixed hydration mismatch in SupportClient');
