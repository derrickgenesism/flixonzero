const fs = require('fs');
let code = fs.readFileSync('src/app/checkout/actions.js', 'utf8');

// Add ownership validation: ensure the transaction belongs to the authenticated user
code = code.replace(
  `  // 1. Check local DB first
  const { data: transaction, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('tx_ref', tx_ref)
    .single();

  if (error || !transaction) {
    return { status: 'not_found' };
  }`,
  `  // 1. Check local DB first — and validate ownership to prevent cross-user access
  const { data: transaction, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('tx_ref', tx_ref)
    .single();

  if (error || !transaction) {
    return { status: 'not_found' };
  }

  // Security: ensure this transaction belongs to the authenticated user
  if (transaction.user_id !== user.id) {
    console.error('[checkTransactionStatus] User', user.id, 'tried to verify tx belonging to', transaction.user_id);
    return { status: 'not_found' };
  }`
);

fs.writeFileSync('src/app/checkout/actions.js', code);
console.log('Fix 5: Ownership check added to checkTransactionStatus');
