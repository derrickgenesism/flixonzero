const fs = require('fs');

// Fix ppv/initiate/route.js
let initCode = fs.readFileSync('src/app/api/ppv/initiate/route.js', 'utf8');
initCode = initCode.replace(
  `    // Record pending purchase
    await supabaseAdmin.from('ppv_purchases').upsert({
      user_id: user.id,
      movie_id: movieId,
      amount: ppvPrice,
      tx_ref,
      status: 'pending'
    }, { onConflict: 'user_id,movie_id' });`,
  `    // Record pending purchase — always INSERT a new row so each attempt has its own tx_ref.
    // If the user already has a successful/pending purchase, the webhook or verify endpoint handles it.
    await supabaseAdmin.from('ppv_purchases').insert({
      user_id: user.id,
      movie_id: movieId,
      amount: ppvPrice,
      tx_ref,
      status: 'pending'
    });`
);
fs.writeFileSync('src/app/api/ppv/initiate/route.js', initCode);
console.log('Fix 3a: ppv/initiate - upsert -> insert');

// Fix ppv/direct-charge/route.js
let dcCode = fs.readFileSync('src/app/api/ppv/direct-charge/route.js', 'utf8');
dcCode = dcCode.replace(
  `    // Record pending purchase
    await supabaseAdmin.from('ppv_purchases').upsert({
      user_id: user.id,
      movie_id: movieId,
      amount: ppvPrice,
      tx_ref,
      status: 'pending'
    }, { onConflict: 'user_id,movie_id' });`,
  `    // Record pending purchase — always INSERT a new row so each attempt has its own tx_ref.
    await supabaseAdmin.from('ppv_purchases').insert({
      user_id: user.id,
      movie_id: movieId,
      amount: ppvPrice,
      tx_ref,
      status: 'pending'
    });`
);
fs.writeFileSync('src/app/api/ppv/direct-charge/route.js', dcCode);
console.log('Fix 3b: ppv/direct-charge - upsert -> insert');
