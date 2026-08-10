import { createClient } from '@/utils/supabase/server';
import Navbar from '@/components/Navbar';
import PaginatedMovieGrid from '@/components/PaginatedMovieGrid';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: col } = await supabase.from('collections').select('name, description').eq('slug', slug).single();
  if (!col) return { title: 'Collection — Flixon' };
  return {
    title: `${col.name} — Flixon`,
    description: col.description || `A curated collection on Flixon`
  };
}

export default async function CollectionPage({ params }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: collection } = await supabase
    .from('collections')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (!collection) notFound();

  const { data: items } = await supabase
    .from('collection_items')
    .select('sort_order, movies(*)')
    .eq('collection_id', collection.id)
    .order('sort_order', { ascending: true });

  const movies = (items || []).map(i => i.movies).filter(Boolean);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <main style={{ paddingTop: '88px', maxWidth: '1200px', margin: '0 auto', padding: '88px 40px 60px' }}>
        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <Link href="/" style={{ color: 'var(--text3)', textDecoration: 'none', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '20px' }}>
            ← Back to Home
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ width: '56px', height: '56px', background: 'rgba(229,9,20,0.1)', border: '2px solid rgba(229,9,20,0.3)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px' }}>
              🗂️
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--acc)', marginBottom: '6px' }}>Collection</div>
              <h1 style={{ fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: '900', margin: '0 0 6px', color: '#fff', letterSpacing: '-0.5px' }}>
                {collection.name}
              </h1>
              {collection.description && (
                <p style={{ fontSize: '15px', color: 'var(--text2)', margin: 0 }}>{collection.description}</p>
              )}
            </div>
          </div>
          <div style={{ marginTop: '16px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text3)', fontWeight: '500', background: 'var(--bg2)', padding: '4px 12px', borderRadius: '20px', border: '1px solid var(--border)' }}>
              {movies.length} title{movies.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {movies.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text2)' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📂</div>
            <p>This collection is empty.</p>
          </div>
        ) : (
          <PaginatedMovieGrid 
            title="" 
            initialMovies={movies} 
            totalCount={movies.length} 
          />
        )}
      </main>
    </div>
  );
}
