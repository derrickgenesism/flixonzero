const fs = require('fs');
let file = 'src/app/checkout/actions.js';
let content = fs.readFileSync(file, 'utf8');

// Fix 1: user_profiles.id mismatch in processDirectCharge
content = content.replace(
  /\.from\('user_profiles'\)[\s\S]*?\.eq\('id', user\.id\)/,
  `.from('user_profiles').select('email, username').eq('email', user.email)`
);

// Fix 2: Add user_id check in checkTransactionStatus
content = content.replace(
  /const \{ data: transaction, error: txError \} = await supabase\s*\.from\('transactions'\)\s*\.select\('\*'\)\s*\.eq\('tx_ref', tx_ref\)\s*\.single\(\);/,
  `const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('tx_ref', tx_ref)
      .eq('user_id', user.id)
      .single();`
);

fs.writeFileSync(file, content);
console.log('Fixed checkout/actions.js');
