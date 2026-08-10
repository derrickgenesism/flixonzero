const fs = require('fs');

const data = JSON.parse(fs.readFileSync('src/data/flixon_export.json', 'utf8'));

let sql = '-- SUPABASE USER IMPORT SCRIPT\n';
sql += '-- This script securely imports all your WordPress users directly into Supabase Auth.\n\n';
sql += 'INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)\nVALUES\n';

const validUsers = data.users.filter(u => u.email && u.password_hash);

const values = validUsers.map(user => {
  // Convert WordPress bcrypt prefix to standard bcrypt prefix for Supabase GoTrue
  const standardHash = user.password_hash.replace('$wp$2y$', '$2y$');
  const email = user.email.replace(/'/g, "''");
  const createdAt = user.registered_at || new Date().toISOString();
  
  return `(gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', '${email}', '${standardHash}', now(), '{"provider": "email", "providers": ["email"]}', '{}', '${createdAt}', '${createdAt}', '', '', '', '')`;
});

sql += values.join(',\n') + '\nON CONFLICT DO NOTHING;\n\n';

// After inserting users, we need to create their identities so they can log in via email provider
sql += 'INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)\n';
sql += 'SELECT gen_random_uuid(), id::text, id, format(\'{"sub":"%s","email":"%s"}\', id::text, email)::jsonb, \'email\', created_at, created_at, updated_at\n';
sql += 'FROM auth.users\n';
sql += 'WHERE NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = auth.users.id);\n';

fs.writeFileSync('import_users.sql', sql);
console.log('import_users.sql generated successfully!');
