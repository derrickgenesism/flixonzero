const fs = require('fs');
let file = 'src/app/admin/(protected)/transactions/TransactionsClient.js';
let content = fs.readFileSync(file, 'utf8');

// Strip corrupted emoji
content = content.replace(/ðŸ"Ž/g, '');
content = content.replace(/??/g, '');
content = content.replace(/Diagnose/, 'Diagnose'); // Ensure it just says Diagnose

// Replace tx_ref td
content = content.replace(
  /<td style={{ padding: '12px', fontSize: '12px', color: 'var\(--text3\)' }}>\s*\{tx\.tx_ref\}\s*<\/td>/g,
  "<td style={{ padding: '12px', fontSize: '12px', color: 'var(--text3)', wordBreak: 'break-all', maxWidth: '150px' }}>\n                    {tx.tx_ref}\n                  </td>"
);

// Replace user email td
content = content.replace(
  /<td style={{ padding: '12px' }}>\s*\{tx\.user_profiles\?\.email \|\| tx\.user_id\}\s*<\/td>/g,
  "<td style={{ padding: '12px', wordBreak: 'break-all', maxWidth: '180px' }}>\n                    {tx.user_profiles?.email || tx.user_id}\n                  </td>"
);

fs.writeFileSync(file, content);
console.log('Fixed file via Node');
