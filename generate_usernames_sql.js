const fs = require('fs');
const data = JSON.parse(fs.readFileSync('src/data/flixon_export.json', 'utf8'));

let sql = '-- SUPABASE USERNAME SUPPORT SCRIPT\n\n';

sql += 'CREATE TABLE IF NOT EXISTS user_profiles (\n';
sql += '  id SERIAL PRIMARY KEY,\n';
sql += '  username TEXT UNIQUE NOT NULL,\n';
sql += '  email TEXT UNIQUE NOT NULL\n';
sql += ');\n\n';

sql += '-- Insert the existing WordPress usernames and emails\n';
sql += 'INSERT INTO user_profiles (username, email) VALUES\n';

const validUsers = data.users.filter(u => u.email && u.username);
const values = validUsers.map(u => {
  const email = u.email.replace(/'/g, "''");
  const username = u.username.replace(/'/g, "''");
  return `('${username}', '${email}')`;
});

sql += values.join(',\n') + '\nON CONFLICT (email) DO NOTHING;\n\n';

sql += '-- Create a secure function to look up emails by username\n';
sql += 'CREATE OR REPLACE FUNCTION get_email_by_username(p_username TEXT) \n';
sql += 'RETURNS TEXT \n';
sql += 'LANGUAGE plpgsql \n';
sql += 'SECURITY DEFINER \n'; // Runs with admin privileges to bypass RLS
sql += 'AS $$\n';
sql += 'DECLARE\n';
sql += '  v_email TEXT;\n';
sql += 'BEGIN\n';
sql += '  SELECT email INTO v_email FROM user_profiles WHERE username = p_username;\n';
sql += '  RETURN v_email;\n';
sql += 'END;\n';
sql += '$$;\n';

fs.writeFileSync('../setup_usernames.sql', sql);
console.log('setup_usernames.sql generated successfully!');
