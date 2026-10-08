const fs = require('fs');
let file = 'src/app/api/referrals/convert/route.js';
let content = fs.readFileSync(file, 'utf8');

// Fix 1: user_profiles.id mismatch in referral convert
content = content.replace(
  /\.from\('user_profiles'\)\s*\.update\(\{ subscription_end_date: newEndDate \}\)\s*\.eq\('id', user\.id\)/g,
  `.from('user_profiles').update({ subscription_end_date: newEndDate }).eq('email', user.email)`
);

fs.writeFileSync(file, content);
console.log('Fixed api/referrals/convert/route.js');
