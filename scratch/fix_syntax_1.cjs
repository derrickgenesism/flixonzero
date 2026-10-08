const fs = require('fs');
let file = 'src/app/api/compression-jobs/[id]/cancel/route.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/const \{ data, error \} = await supabase\r?\n\s*\.from\('compression_jobs'\)\r?\n\s*\.update\(\{ status: 'cancelled' \}\)\r?\n\s*\.eq\('id', id\)\r?\n\s*\.in\('status', \['pending', 'processing', 'failed'\]\)\s*\/\/ Can't cancel completed\r?\n\s*\.select\(\)\r?\n\s*\.single\(\);/, '');

fs.writeFileSync(file, content);
console.log('Fixed syntax error in compression route');
