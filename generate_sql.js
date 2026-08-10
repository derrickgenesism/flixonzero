const fs = require('fs');
const data = JSON.parse(fs.readFileSync('src/data/flixon_export.json', 'utf8'));

let sql = '-- SUPABASE SETUP SCRIPT FOR FLIXON\n\n';

sql += 'CREATE TABLE IF NOT EXISTS movies (\n';
sql += '  id BIGINT PRIMARY KEY,\n';
sql += '  title TEXT NOT NULL,\n';
sql += '  description TEXT,\n';
sql += '  type TEXT,\n';
sql += '  thumbnail_url TEXT,\n';
sql += '  video_url TEXT,\n';
sql += '  created_at TIMESTAMPTZ\n';
sql += ');\n\n';

sql += 'CREATE TABLE IF NOT EXISTS admin_settings (\n';
sql += '  id SERIAL PRIMARY KEY,\n';
sql += '  setting_key TEXT UNIQUE NOT NULL,\n';
sql += '  setting_value TEXT NOT NULL\n';
sql += ');\n\n';

sql += 'CREATE TABLE IF NOT EXISTS user_subscriptions (\n';
sql += '  id SERIAL PRIMARY KEY,\n';
sql += '  user_id UUID REFERENCES auth.users(id),\n';
sql += '  plan_id TEXT,\n';
sql += '  expiry_date TIMESTAMPTZ,\n';
sql += '  created_at TIMESTAMPTZ DEFAULT now()\n';
sql += ');\n\n';

sql += 'CREATE TABLE IF NOT EXISTS transactions (\n';
sql += '  id SERIAL PRIMARY KEY,\n';
sql += '  tx_ref TEXT UNIQUE NOT NULL,\n';
sql += '  user_id UUID REFERENCES auth.users(id),\n';
sql += '  amount NUMERIC,\n';
sql += '  status TEXT,\n';
sql += '  created_at TIMESTAMPTZ DEFAULT now()\n';
sql += ');\n\n';

// Insert initial admin settings for Flutterwave
sql += "INSERT INTO admin_settings (setting_key, setting_value) VALUES\n";
sql += "('flutterwave_public_key', ''),\n";
sql += "('flutterwave_secret_key', ''),\n";
sql += "('flutterwave_webhook_secret', '')\n";
sql += "ON CONFLICT (setting_key) DO NOTHING;\n\n";

// Insert movies securely
sql += 'INSERT INTO movies (id, title, description, type, thumbnail_url, video_url, created_at) VALUES\n';
const values = data.movies.map(m => {
  const title = (m.title || '').replace(/'/g, "''");
  const desc = (m.description || '').replace(/'/g, "''");
  const type = (m.type || '').replace(/'/g, "''");
  const thumb = (m.thumbnail_url || '').replace(/'/g, "''");
  const video = (m.video_url || '').replace(/'/g, "''");
  return `(${m.id}, '${title}', '${desc}', '${type}', '${thumb}', '${video}', '${m.created_at}')`;
});
sql += values.join(',\n') + '\nON CONFLICT (id) DO NOTHING;\n\n';

fs.writeFileSync('setup.sql', sql);
console.log('setup.sql generated successfully.');
