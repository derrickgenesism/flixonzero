import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import EditMovieClient from './EditMovieClient';

export async function generateMetadata({ params }) {
  const { id } = await params;
  return { title: `Edit Movie #${id} — Admin` };
}

export default async function EditMoviePage({ params }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: movie, error } = await supabase
    .from('movies')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !movie) notFound();

  return <EditMovieClient movie={movie} />;
}
