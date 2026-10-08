const fs = require('fs');
let file = 'src/app/movie/[id]/page.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(`const { data: profile } = await supabase.from('user_profiles').select('subscription_end_date').eq('email', user.email).single();
    if (profile?.subscription_end_date && new Date(profile.subscription_end_date) > new Date()) {`, `const { data: userProfile } = await supabase.from('user_profiles').select('subscription_end_date').eq('email', user.email).single();
    if (userProfile?.subscription_end_date && new Date(userProfile.subscription_end_date) > new Date()) {`);

fs.writeFileSync(file, content);
console.log('Fixed profile variable collision');
