const fs = require('fs');
let file = 'src/app/admin/(protected)/settings/actions.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  `const checkboxKeys = ['referrals_enabled', 'ppv_enabled', 'promo_enabled', 'profiles_enabled', 'series_enabled']`,
  `const checkboxKeys = ['free_mode_enabled', 'referrals_enabled', 'ppv_enabled', 'promo_enabled', 'profiles_enabled', 'series_enabled']`
);

content = content.replace(
  `'tmdb_api_key',`,
  `'free_mode_enabled',\n    'tmdb_api_key',`
);

fs.writeFileSync(file, content);
console.log('actions.js updated');
