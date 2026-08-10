require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data: transaction, error: txError } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (txError) {
    console.error("Fetch error:", txError);
    return;
  }
  
  console.log("Transaction ID:", transaction.id);

  const { error: updateError } = await supabase
    .from('transactions')
    .update({ 
      status: 'successful', 
      updated_at: new Date().toISOString()
    })
    .eq('id', transaction.id);

  if (updateError) {
    console.error("Update error:", updateError);
  } else {
    console.log("Update success!");
  }
}
main();
