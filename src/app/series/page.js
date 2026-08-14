import { createClient } from '@/utils/supabase/server';
import Navbar from '@/components/Navbar';
import PaginatedSeriesGrid from '@/components/PaginatedSeriesGrid';
import { notFound } from 'next/navigation';

export const metadata = {
  title: 'TV Series — Flixon',
};

export default async function AllSeriesPage() {
  const supabase = await createClient();

  const { data: settings } = await supabase
    .from('admin_settings')
    .select('setting_value')
    .eq('setting_key', 'series_enabled')
    .maybeSingle();
  
  if (settings?.setting_value !== 'true') {
    notFound(); // Hide if disabled
  }

  // Fetch initial series
  const { data: series, count } = await supabase
    .from('series')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(0, 23);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />

      <main style={{ paddingTop: '100px', paddingBottom: '60px', position: 'relative', zIndex: 10 }}>
        {/* Safe padding if we want to add CategoryBar later */}
        <div style={{ paddingTop: '20px' }}></div>
        
        {/* We can reuse PaginatedMovieGrid but adapt it for Series or create PaginatedSeriesGrid */}
        <PaginatedSeriesGrid 
          title="All TV Series" 
          initialSeries={series || []} 
          totalCount={count || 0} 
        />
      </main>
    </div>
  );
}
