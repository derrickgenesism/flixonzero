const fs = require('fs');
let file = 'src/app/api/compression-jobs/[id]/cancel/route.js';
let content = fs.readFileSync(file, 'utf8');

const replacement = `import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/server';

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(req, { params }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { data: adminCheck } = await supabase.from('admin_users').select('id').eq('email', user.email).single();
    if (!adminCheck) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;

    const { data, error } = await supabaseAdmin
      .from('compression_jobs')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .in('status', ['pending', 'processing', 'failed']) // Can't cancel completed
      .select()
      .single();`;

content = content.replace(/import \{ NextResponse \} from 'next\/server';[\s\S]*?const \{ id \} = await params;/, replacement);

fs.writeFileSync(file, content);
console.log('Fixed zero auth in compression job cancel');
