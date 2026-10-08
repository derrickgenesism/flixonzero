const fs = require('fs');
let file = 'src/app/profiles/actions.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace("import { cookies } from 'next/headers';\r\nimport { revalidatePath } from 'next/cache';", "import { cookies } from 'next/headers';");
content = content.replace("import { cookies } from 'next/headers';\nimport { revalidatePath } from 'next/cache';", "import { cookies } from 'next/headers';");

fs.writeFileSync(file, content);
console.log('Fixed syntax error in profiles actions');
