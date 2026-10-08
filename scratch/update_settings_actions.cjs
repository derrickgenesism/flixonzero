const fs = require('fs');
let file = 'src/app/admin/(protected)/settings/actions.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "const checkboxKeys = ['free_mode_enabled', 'referrals_enabled', 'ppv_enabled', 'promo_enabled', 'profiles_enabled', 'series_enabled']",
  "const checkboxKeys = ['free_mode_enabled', 'referrals_enabled', 'ppv_enabled', 'promo_enabled', 'profiles_enabled', 'series_enabled', 'google_auth_enabled']"
);

content = content.replace(
  "      'free_mode_enabled',",
  "      'free_mode_enabled',\n      'google_auth_enabled',"
);

fs.writeFileSync(file, content);
console.log('Added google_auth_enabled to settings actions');
