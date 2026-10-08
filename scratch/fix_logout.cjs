const fs = require('fs');
let file = 'src/app/profiles/actions.js';
let content = fs.readFileSync(file, 'utf8');

const regex = /export async function logoutAndClearProfile\(\) \{[\s\S]*?const supabase = await createClient\(\);[\s\S]*?await supabase\.auth\.signOut\(\);[\s\S]*?\}/;
const replacement = `import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function logoutAndClearProfile() {
  const cookieStore = await cookies();
  cookieStore.delete('flixon_profile_id');
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/');
}`;

if (content.match(/export async function logoutAndClearProfile/)) {
  content = content.replace(/import \{ createClient \} from '@\/utils\/supabase\/server';/, `import { createClient } from '@/utils/supabase/server';\nimport { redirect } from 'next/navigation';\nimport { revalidatePath } from 'next/cache';`);
  content = content.replace(/export async function logoutAndClearProfile\(\) \{[\s\S]*?await supabase\.auth\.signOut\(\);\s*\}/, `export async function logoutAndClearProfile() {
  const cookieStore = await cookies();
  cookieStore.delete('flixon_profile_id');
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/');
}`);
  fs.writeFileSync(file, content);
  console.log('Fixed logout logic');
}
