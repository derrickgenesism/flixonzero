import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function cleanup() {
  const failedRefs = [
    'flixon_81530760-769b-4e1c-802d-731493778995_1789213346195',
    'flixon_e23453a3-81ae-4338-a307-d060a3e5154b_1789047885831',
    'flixon_e23453a3-81ae-4338-a307-d060a3e5154b_1789047595863',
    'flixon_f4fd606a-e131-400b-80e6-072605e539d5_1789046104754',
    'flixon_f4fd606a-e131-400b-80e6-072605e539d5_1789046036009',
    'flixon_1e426328-dbb5-4953-af2f-08b02a07bf9f_1788805204324'
  ];
  const { error } = await supabase.from('transactions').update({ status: 'failed' }).in('tx_ref', failedRefs);
  if (error) console.error('Cleanup error:', error);
  else console.log('Cleaned up', failedRefs.length, 'stuck pending transactions -> marked failed');
}
cleanup();
