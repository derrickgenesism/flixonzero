async function test() {
  console.log('Testing connection to Supabase...');
  try {
    const start = Date.now();
    const res = await fetch(process.env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/', {
      headers: { 'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY }
    });
    console.log('Status:', res.status, 'Time:', Date.now() - start + 'ms');
  } catch (err) {
    console.error('Fetch Error:', err.message);
  }
}
test();
