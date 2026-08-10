const fs = require('fs');

const data = JSON.parse(fs.readFileSync('src/data/flixon_export.json', 'utf8'));

// Supabase CSV requires at least: email, encrypted_password, created_at
let csv = 'email,encrypted_password,created_at\n';

data.users.forEach(user => {
  if (user.email && user.password_hash) {
    // Convert WordPress bcrypt prefix to standard bcrypt prefix for Supabase GoTrue
    const standardHash = user.password_hash.replace('$wp$2y$', '$2y$');
    const email = user.email.replace(/"/g, '""');
    const created_at = user.registered_at || new Date().toISOString();
    
    csv += `"${email}","${standardHash}","${created_at}"\n`;
  }
});

fs.writeFileSync('../users_import.csv', csv);
console.log('users_import.csv generated successfully!');
