import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(req, { params }) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from('compression_jobs')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .in('status', ['pending', 'processing', 'failed']) // Can't cancel completed
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, job: data });
  } catch (error) {
    console.error('Cancel error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
