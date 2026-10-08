const fs = require('fs');
let file = 'src/app/profiles/checkoutActions.js';
let content = fs.readFileSync(file, 'utf8');

// Fix 2: Add user_id check in checkExtraProfileTransactionStatus
content = content.replace(
  /const \{ data: transaction, error: txError \} = await supabase\s*\.from\('transactions'\)\s*\.select\('\*'\)\s*\.eq\('tx_ref', txRef\)\s*\.single\(\);/,
  `const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('tx_ref', txRef)
      .eq('user_id', user.id)
      .single();`
);

fs.writeFileSync(file, content);
console.log('Fixed profiles/checkoutActions.js');
