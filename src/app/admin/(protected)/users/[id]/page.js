import { createAdminClient } from '@/utils/supabase/admin'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function UserAnalyticsPage({ params }) {
  try {
    const { id } = await params;
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/admin/login')

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('email', user.email)
      .single()

    if (profile?.role !== 'administrator') {
      return (
        <div>
          <h1 style={{ fontSize: '32px', marginBottom: '20px' }}>Access Denied</h1>
          <p style={{ color: 'var(--text2)' }}>Only Administrators can access User Analytics.</p>
        </div>
      )
    }

    // Fetch target user profile directly
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', id)
      .single()

    if (!userProfile) {
      return (
        <div>
          <h1 style={{ fontSize: '32px', marginBottom: '20px' }}>Error</h1>
          <p style={{ color: '#e50914' }}>User profile not found in database.</p>
          <Link href="/admin/users" style={{ color: 'var(--acc)' }}>&larr; Back to Users</Link>
        </div>
      )
    }

    // Find auth user details
    const supabaseAdmin = createAdminClient()
    let authUser = null;
    if (userProfile.email) {
      const targetEmail = userProfile.email.toLowerCase().trim();
      let page = 1;
      let found = false;
      // Loop with safety cap of 10 pages to prevent infinite loops
      while (!found && page <= 10) {
        const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
        if (listError || !listData?.users || listData.users.length === 0) break;
        
        const match = listData.users.find(u => u.email?.toLowerCase().trim() === targetEmail);
        if (match) {
          authUser = match;
          found = true;
          break;
        }
        if (listData.users.length < 1000) break;
        page++;
      }
    }

    // Get watch history using admin client to bypass RLS policies
    let watchHistory = [];
    if (authUser) {
      const { data, error: watchError } = await supabaseAdmin
        .from('watch_history')
        .select('*, movies(id, title, poster_path)')
        .eq('user_id', authUser.id)
        .order('updated_at', { ascending: false })
        .limit(50);
        
      if (data) watchHistory = data;
    }

    const authData = {
      created_at: authUser?.created_at,
      last_sign_in_at: authUser?.last_sign_in_at,
    };

    // Calculate activity score based on recent watch history
    const activeViews = watchHistory.filter(w => {
      const diffDays = (new Date() - new Date(w.updated_at)) / (1000 * 60 * 60 * 24);
      return diffDays < 30; // Watched in last 30 days
    }).length;

    let activityStatus = 'Inactive';
    let statusColor = '#e50914';
    if (activeViews > 10) {
      activityStatus = 'Highly Active';
      statusColor = '#4CAF50';
    } else if (activeViews > 0) {
      activityStatus = 'Regular';
      statusColor = '#FFC107';
    }

    function formatTime(seconds) {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      if (h > 0) return `${h}h ${m}m`;
      return `${m}m`;
    }

    return (
      <div>
        <div style={{ marginBottom: '20px' }}>
          <Link href="/admin/users" style={{ color: 'var(--text2)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            &larr; Back to User Management
          </Link>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', marginBottom: '30px' }}>
          <div>
            <h1 style={{ fontSize: '32px', marginBottom: '5px' }}>User Analytics</h1>
            <p style={{ color: 'var(--text2)', margin: 0 }}>{userProfile.email} {userProfile.username ? `(@${userProfile.username})` : ''}</p>
          </div>
          <div style={{ background: 'var(--bg2)', padding: '15px 25px', borderRadius: '8px', borderLeft: `4px solid ${statusColor}` }}>
            <div style={{ fontSize: '12px', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Activity Status</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: statusColor }}>{activityStatus}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          <div style={{ background: 'var(--bg2)', padding: '20px', borderRadius: '10px' }}>
            <h3 style={{ fontSize: '14px', color: 'var(--text2)', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Account Created</h3>
            <div style={{ fontSize: '18px' }}>
              {authData.created_at ? new Date(authData.created_at).toLocaleString() : 'Unknown'}
            </div>
          </div>
          <div style={{ background: 'var(--bg2)', padding: '20px', borderRadius: '10px' }}>
            <h3 style={{ fontSize: '14px', color: 'var(--text2)', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Last Login</h3>
            <div style={{ fontSize: '18px' }}>
              {authData.last_sign_in_at ? new Date(authData.last_sign_in_at).toLocaleString() : 'Never'}
            </div>
          </div>
          <div style={{ background: 'var(--bg2)', padding: '20px', borderRadius: '10px' }}>
            <h3 style={{ fontSize: '14px', color: 'var(--text2)', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Subscription Ends</h3>
            <div style={{ fontSize: '18px', color: (userProfile.subscription_end_date && new Date(userProfile.subscription_end_date) > new Date()) ? '#4CAF50' : '#e50914' }}>
              {userProfile.subscription_end_date ? new Date(userProfile.subscription_end_date).toLocaleDateString() : 'None'}
            </div>
          </div>
          <div style={{ background: 'var(--bg2)', padding: '20px', borderRadius: '10px' }}>
            <h3 style={{ fontSize: '14px', color: 'var(--text2)', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Titles Started</h3>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
              {watchHistory.length}
            </div>
          </div>
        </div>

        <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>Recent Watch History</h2>
        {watchHistory.length === 0 ? (
          <div style={{ background: 'var(--bg2)', padding: '40px', borderRadius: '10px', textAlign: 'center', color: 'var(--text2)' }}>
            This user hasn't watched any movies yet.
          </div>
        ) : (
          <div style={{ background: 'var(--bg2)', borderRadius: '10px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
              <thead>
                <tr style={{ background: '#333', borderBottom: '1px solid #444' }}>
                  <th style={{ padding: '15px', fontSize: '14px' }}>Movie Title</th>
                  <th style={{ padding: '15px', fontSize: '14px' }}>Time Watched</th>
                  <th style={{ padding: '15px', fontSize: '14px' }}>Last Watched</th>
                  <th style={{ padding: '15px', fontSize: '14px' }}>First Started</th>
                </tr>
              </thead>
              <tbody>
                {watchHistory.map(w => (
                  <tr key={w.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '15px', fontSize: '14px', fontWeight: 'bold' }}>
                      {w.movies?.title || `Unknown Movie ID: ${w.movie_id}`}
                    </td>
                    <td style={{ padding: '15px', fontSize: '14px', color: 'var(--text2)' }}>
                      {formatTime(w.progress_seconds)}
                    </td>
                    <td style={{ padding: '15px', fontSize: '14px' }}>
                      {new Date(w.updated_at).toLocaleString()}
                    </td>
                    <td style={{ padding: '15px', fontSize: '14px', color: 'var(--text2)' }}>
                      {new Date(w.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )
  } catch (error) {
    return (
      <div style={{ color: 'red', padding: '20px', background: '#ffebee', borderRadius: '8px' }}>
        <h2>Debug Error in /admin/users/[id]:</h2>
        <pre>{error.message}</pre>
        <pre>{error.stack}</pre>
      </div>
    )
  }
}
