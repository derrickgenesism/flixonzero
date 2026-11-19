/**
 * Downloads Portal Analytics Engine
 * Aggregates site_visits and app stats for the FlixOn Downloads & Storage Hub.
 */

export function parseReferrerSource(path = '', referrer = '') {
  const p = (path || '').toLowerCase();
  const r = (referrer || '').toLowerCase();

  // 1. Explicit campaign & source query params
  if (p.includes('src=whatsapp') || p.includes('ref=whatsapp') || r.includes('whatsapp') || r.includes('wa.me')) {
    return { name: 'WhatsApp', color: '#25D366', icon: '💬' };
  }
  if (p.includes('src=blogger') || p.includes('ref=blogger') || r.includes('blogger') || r.includes('blogspot')) {
    return { name: 'Blogger', color: '#FF5722', icon: '📝' };
  }
  if (p.includes('src=tiktok') || p.includes('ref=tiktok') || r.includes('tiktok')) {
    return { name: 'TikTok', color: '#ff0050', icon: '🎵' };
  }
  if (p.includes('src=facebook') || p.includes('ref=facebook') || r.includes('facebook') || r.includes('fb.com')) {
    return { name: 'Facebook', color: '#1877F2', icon: '👥' };
  }
  if (p.includes('src=telegram') || p.includes('ref=telegram') || r.includes('t.me') || r.includes('telegram')) {
    return { name: 'Telegram', color: '#229ED9', icon: '✈️' };
  }
  if (p.includes('src=twitter') || p.includes('src=x') || r.includes('twitter') || r.includes('t.co') || r.includes('x.com')) {
    return { name: 'Twitter / X', color: '#1DA1F2', icon: '🐦' };
  }
  if (p.includes('src=youtube') || r.includes('youtube') || r.includes('youtu.be')) {
    return { name: 'YouTube', color: '#FF0000', icon: '▶️' };
  }
  if (p.includes('src=instagram') || r.includes('instagram')) {
    return { name: 'Instagram', color: '#E4405F', icon: '📸' };
  }
  if (r.includes('google') || r.includes('bing') || r.includes('duckduckgo') || r.includes('yahoo')) {
    return { name: 'Search Engine', color: '#4285F4', icon: '🔍' };
  }
  if (r.includes('flixon.net/admin')) {
    return { name: 'FlixOn Admin Preview', color: '#8b5cf6', icon: '⚙️' };
  }
  if (r.includes('flixon.net')) {
    return { name: 'FlixOn Internal', color: '#06b6d4', icon: '🎬' };
  }
  if (!r) {
    return { name: 'Direct / Shared Link', color: '#10b981', icon: '🔗' };
  }

  try {
    const host = new URL(referrer).hostname;
    return { name: host, color: '#94a3b8', icon: '🌐' };
  } catch (_) {
    return { name: 'External Web', color: '#94a3b8', icon: '🌐' };
  }
}

export function parseDeviceType(userAgent = '') {
  const ua = (userAgent || '').toLowerCase();
  if (ua.includes('android')) return { device: 'Android', icon: '🤖' };
  if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) return { device: 'iOS / iPhone', icon: '🍎' };
  if (ua.includes('windows')) return { device: 'Windows PC', icon: '💻' };
  if (ua.includes('macintosh') || ua.includes('mac os')) return { device: 'Mac OS', icon: '🖥️' };
  if (ua.includes('linux')) return { device: 'Linux', icon: '🐧' };
  return { device: 'Mobile / Web', icon: '📱' };
}

export function formatTimeAgo(dateString) {
  if (!dateString) return 'Just now';
  const then = new Date(dateString).getTime();
  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((now - then) / 1000));

  if (diffSec < 45) return 'Just now';
  if (diffSec < 90) return '1 min ago';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} mins ago`;
  if (diffSec < 7200) return '1 hour ago';
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hours ago`;
  if (diffSec < 172800) return 'Yesterday';
  return `${Math.floor(diffSec / 86400)} days ago`;
}

/**
 * Fetch complete analytics for the Downloads Hub
 */
export async function getDownloadsAnalytics(adminClient) {
  try {
    const now = new Date();
    // Midnight East Africa Time (EAT = UTC+3)
    const eatOffsetMs = 3 * 60 * 60 * 1000;
    const nowEAT = new Date(now.getTime() + eatOffsetMs);
    const todayStartEAT = new Date(Date.UTC(nowEAT.getUTCFullYear(), nowEAT.getUTCMonth(), nowEAT.getUTCDate()) - eatOffsetMs).toISOString();
    const yesterdayStartEAT = new Date(Date.UTC(nowEAT.getUTCFullYear(), nowEAT.getUTCMonth(), nowEAT.getUTCDate() - 1) - eatOffsetMs).toISOString();
    const weekStartEAT = new Date(Date.UTC(nowEAT.getUTCFullYear(), nowEAT.getUTCMonth(), nowEAT.getUTCDate() - 7) - eatOffsetMs).toISOString();

    // Parallel fetch
    const [
      totalViewsRes,
      todayViewsRes,
      yesterdayViewsRes,
      weekViewsRes,
      movieConversionsRes,
      recentVisitsRes,
      sharedAppsSettingRes
    ] = await Promise.all([
      // Total visits to /downloads
      adminClient.from('site_visits').select('*', { count: 'exact', head: true }).ilike('path', '%/downloads%'),
      // Today visits
      adminClient.from('site_visits').select('*', { count: 'exact', head: true }).ilike('path', '%/downloads%').gte('created_at', todayStartEAT),
      // Yesterday visits
      adminClient.from('site_visits').select('*', { count: 'exact', head: true }).ilike('path', '%/downloads%').gte('created_at', yesterdayStartEAT).lt('created_at', todayStartEAT),
      // Week visits
      adminClient.from('site_visits').select('*', { count: 'exact', head: true }).ilike('path', '%/downloads%').gte('created_at', weekStartEAT),
      // Movie Clicks / Conversions from downloads
      adminClient.from('site_visits').select('*', { count: 'exact', head: true }).or('path.ilike.%from=downloads%,path.ilike.%/downloads/movie-click%,referrer.ilike.%/downloads%'),
      // Recent visits for detailed aggregation (limit 600)
      adminClient.from('site_visits').select('id, visitor_id, path, referrer, user_agent, created_at').ilike('path', '%/downloads%').order('created_at', { ascending: false }).limit(600),
      // Apps list from admin_settings
      adminClient.from('admin_settings').select('setting_value').eq('setting_key', 'shared_apps_list').maybeSingle()
    ]);

    // Parse apps
    let apps = [];
    try {
      apps = JSON.parse(sharedAppsSettingRes.data?.setting_value || '[]');
    } catch (_) {}

    const totalDownloads = (apps || []).reduce((sum, a) => sum + (Number(a.download_count) || 0), 0);
    const visits = recentVisitsRes.data || [];

    // Calculate Unique Visitors
    const allUniqueVisitorsSet = new Set(visits.map(v => v.visitor_id).filter(Boolean));
    const todayVisits = visits.filter(v => v.created_at >= todayStartEAT);
    const todayUniqueVisitorsSet = new Set(todayVisits.map(v => v.visitor_id).filter(Boolean));
    const weekVisits = visits.filter(v => v.created_at >= weekStartEAT);
    const weekUniqueVisitorsSet = new Set(weekVisits.map(v => v.visitor_id).filter(Boolean));

    const totalViews = totalViewsRes.count || visits.length;
    const viewsToday = todayViewsRes.count || todayVisits.length;
    const viewsYesterday = yesterdayViewsRes.count || 0;
    const viewsThisWeek = weekViewsRes.count || weekVisits.length;
    const uniqueTotal = allUniqueVisitorsSet.size || Math.min(totalViews, 1);
    const uniqueToday = todayUniqueVisitorsSet.size;
    const uniqueThisWeek = weekUniqueVisitorsSet.size;

    // Traffic Sources Breakdown
    const sourceMap = {};
    const deviceMap = {};

    visits.forEach(v => {
      const src = parseReferrerSource(v.path, v.referrer);
      sourceMap[src.name] = sourceMap[src.name] || { name: src.name, count: 0, color: src.color, icon: src.icon };
      sourceMap[src.name].count += 1;

      const dev = parseDeviceType(v.user_agent);
      deviceMap[dev.device] = deviceMap[dev.device] || { device: dev.device, count: 0, icon: dev.icon };
      deviceMap[dev.device].count += 1;
    });

    const sources = Object.values(sourceMap)
      .sort((a, b) => b.count - a.count)
      .map(s => ({
        ...s,
        percentage: visits.length > 0 ? ((s.count / visits.length) * 100).toFixed(1) : 0
      }));

    const devices = Object.values(deviceMap)
      .sort((a, b) => b.count - a.count)
      .map(d => ({
        ...d,
        percentage: visits.length > 0 ? ((d.count / visits.length) * 100).toFixed(1) : 0
      }));

    // Recent 35 Visitors Feed
    const recentVisitors = visits.slice(0, 35).map(v => {
      const src = parseReferrerSource(v.path, v.referrer);
      const dev = parseDeviceType(v.user_agent);

      // Clean path label
      let pageLabel = 'Downloads Hub';
      if (v.path?.includes('/downloads/blackhole') || v.path?.includes('app=blackhole')) pageLabel = 'BlackHole APK';
      else if (v.path?.includes('/downloads/vidmate') || v.path?.includes('app=vidmate')) pageLabel = 'Vidmate APK';
      else if (v.path?.includes('/downloads/snaptube') || v.path?.includes('app=snaptube')) pageLabel = 'Snaptube APK';
      else if (v.path?.includes('/downloads/seal') || v.path?.includes('app=seal')) pageLabel = 'Seal APK';
      else if (v.path?.includes('download-started')) pageLabel = '⚡ Download Started';
      else if (v.path?.includes('movie-click')) pageLabel = '🎬 Clicked Free Movie';
      else if (v.path?.includes('blogger-embed')) pageLabel = '📝 Blogger Widget';

      return {
        id: v.id,
        visitorMask: v.visitor_id ? `Guest-${v.visitor_id.slice(0, 8)}` : 'Guest Visitor',
        path: v.path,
        pageLabel,
        source: src.name,
        sourceIcon: src.icon,
        sourceColor: src.color,
        device: dev.device,
        deviceIcon: dev.icon,
        createdAt: v.created_at,
        timeAgo: formatTimeAgo(v.created_at),
        isToday: v.created_at >= todayStartEAT
      };
    });

    // Conversion rate
    const conversionRate = uniqueTotal > 0
      ? Math.min(100, (totalDownloads / uniqueTotal) * 100).toFixed(1)
      : '0.0';

    const movieConversions = movieConversionsRes.count || 0;

    return {
      success: true,
      updatedAt: new Date().toISOString(),
      updatedAtEAT: nowEAT.toISOString().replace('T', ' ').slice(0, 19) + ' EAT',
      totalViews,
      viewsToday,
      viewsYesterday,
      viewsThisWeek,
      uniqueTotal,
      uniqueToday,
      uniqueThisWeek,
      totalDownloads,
      conversionRate,
      movieConversions,
      sources,
      devices,
      recentVisitors,
      apps: (apps || []).map(a => ({
        id: a.id,
        name: a.name,
        downloads: Number(a.download_count) || 0,
        badge: a.badge,
        file_size: a.file_size
      }))
    };
  } catch (err) {
    console.error('getDownloadsAnalytics error:', err);
    return {
      success: false,
      error: err.message,
      totalViews: 0,
      viewsToday: 0,
      uniqueTotal: 0,
      uniqueToday: 0,
      totalDownloads: 0,
      conversionRate: '0.0',
      movieConversions: 0,
      sources: [],
      devices: [],
      recentVisitors: [],
      apps: []
    };
  }
}
