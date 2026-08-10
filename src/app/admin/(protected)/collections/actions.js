'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export async function createCollection(formData) {
  const name        = formData.get('name');
  const rawSlug     = formData.get('slug')?.trim();
  const description = formData.get('description');
  const movieIds    = formData.getAll('movie_ids').map(Number);
  const slug        = rawSlug || slugify(name);

  const { data: col } = await supabase
    .from('collections')
    .insert({ name, slug, description, is_active: true })
    .select()
    .single();

  if (col && movieIds.length > 0) {
    await supabase.from('collection_items').insert(
      movieIds.map((movie_id, sort_order) => ({ collection_id: col.id, movie_id, sort_order }))
    );
  }

  revalidatePath('/admin/collections');
}

export async function deleteCollection(formData) {
  const id = formData.get('id');
  await supabase.from('collection_items').delete().eq('collection_id', id);
  await supabase.from('collections').delete().eq('id', id);
  revalidatePath('/admin/collections');
}
