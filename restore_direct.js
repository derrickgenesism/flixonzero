require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const data = JSON.parse(fs.readFileSync('./src/data/flixon_export.json', 'utf8'));

async function restore() {
  let count = 0;
  for (const m of data.movies) {
    if (m.video_url || m.title) {
      const updateObj = {};
      if (m.title) updateObj.title = m.title;
      if (m.video_url) updateObj.video_url = m.video_url;
      
      const { error } = await supabase.from('movies').update(updateObj).eq('id', m.id);
      if (error) {
        console.error('Error updating ' + m.id + ':', error.message);
      } else {
        count++;
        if (count % 50 === 0) console.log('Restored ' + count + ' movies...');
      }
    }
  }
  console.log('Finished restoring! Total restored:', count);
}

restore();
