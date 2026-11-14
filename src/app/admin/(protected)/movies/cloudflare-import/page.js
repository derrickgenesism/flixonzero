import { createAdminClient } from '@/utils/supabase/admin';
import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Storage Bucket Importer (B2 & R2) — Admin' };

export default async function CloudStorageImportPage({ searchParams }) {
  const supabase = await createClient();

  const { data: settings } = await createAdminClient().from('admin_settings').select('*');
  const getSetting = (k, fallback = '') => settings?.find(s => s.setting_key === k)?.setting_value || fallback;

  // Determine active provider from query string or default setting
  const resolvedParams = await searchParams;
  const activeProvider = resolvedParams?.provider || getSetting('storage_provider', 'b2');
  const importedMovie = resolvedParams?.imported;

  // Backblaze B2 Config
  const b2Endpoint = getSetting('b2_endpoint', 'https://s3.us-east-005.backblazeb2.com');
  const b2Region = getSetting('b2_region', 'us-east-005');
  const b2Bucket = getSetting('b2_bucket_name', 'flixonvideos');
  const b2AccessKey = getSetting('b2_access_key', '005f55e2928c64f0000000001');
  const b2SecretKey = getSetting('b2_secret_key', 'K005hcUWnse5QGvejFWTgegbDRKjaD0');

  // Cloudflare R2 Config
  const r2AccountId = getSetting('r2_account_id', '');
  const r2Bucket = getSetting('r2_bucket_name', 'movies');
  const r2AccessKey = getSetting('r2_access_key', '');
  const r2SecretKey = getSetting('r2_secret_key', '');

  let cdnDomain = getSetting('cdn_domain', 'cdn.flixon.net');
  if (cdnDomain && !cdnDomain.startsWith('http')) {
    cdnDomain = `https://${cdnDomain}`;
  }
  cdnDomain = cdnDomain.replace(/\/$/, '');

  const isB2 = activeProvider === 'b2';
  const bucketName = isB2 ? b2Bucket : r2Bucket;

  // Validate credentials for chosen provider
  const isConfigured = isB2 
    ? Boolean(b2Endpoint && b2Bucket && b2AccessKey && b2SecretKey)
    : Boolean(r2AccountId && r2Bucket && r2AccessKey && r2SecretKey);

  let s3Objects = [];
  let connectionError = null;

  if (isConfigured) {
    try {
      const s3Client = isB2
        ? new S3Client({
            region: b2Region,
            endpoint: b2Endpoint,
            credentials: { accessKeyId: b2AccessKey, secretAccessKey: b2SecretKey },
          })
        : new S3Client({
            region: 'auto',
            endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
            credentials: { accessKeyId: r2AccessKey, secretAccessKey: r2SecretKey },
          });

      let isTruncated = true;
      let continuationToken = undefined;

      while (isTruncated) {
        const command = new ListObjectsV2Command({
          Bucket: bucketName,
          MaxKeys: 1000,
          ContinuationToken: continuationToken,
        });

        const data = await s3Client.send(command);

        if (data.Contents) {
          const pageObjects = data.Contents.filter(obj => {
            const key = obj.Key.toLowerCase();
            return key.endsWith('.mp4') || key.endsWith('.mkv') || key.endsWith('.webm') || key.endsWith('.m3u8');
          });
          s3Objects.push(...pageObjects);
        }

        isTruncated = data.IsTruncated;
        continuationToken = data.NextContinuationToken;
      }

      // Sort by latest uploaded (LastModified descending)
      s3Objects.sort((a, b) => {
        const dateA = a.LastModified ? new Date(a.LastModified).getTime() : 0;
        const dateB = b.LastModified ? new Date(b.LastModified).getTime() : 0;
        return dateB - dateA;
      });

    } catch (err) {
      console.error('[Storage Import Error]:', err);
      connectionError = err.message;
    }
  }

  // Fetch Existing Movies from Database to find unimported videos
  const importedUrls = new Set();
  const importedFilenames = new Set();
  let hasMore = true;
  let page = 0;
  const pageSize = 1000;

  while (hasMore) {
    const { data: dbMovies, error } = await supabase
      .from('movies')
      .select('video_url')
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error || !dbMovies || dbMovies.length === 0) {
      hasMore = false;
    } else {
      dbMovies.forEach(m => {
        if (m.video_url) {
          importedUrls.add(m.video_url);
          // Also record the plain filename from url
          const rawFilename = m.video_url.split('/').pop().split('?')[0];
          try {
            importedFilenames.add(decodeURIComponent(rawFilename));
          } catch {}
          importedFilenames.add(rawFilename);
        }
      });
      if (dbMovies.length < pageSize) hasMore = false;
      page++;
    }
  }

  const unimportedVideos = s3Objects.filter(obj => {
    const filename = obj.Key.split('/').pop();
    const encodedKey = obj.Key.split('/').map(p => encodeURIComponent(p)).join('/');
    const fileUrl = `${cdnDomain}/${encodedKey}`;
    return !importedUrls.has(fileUrl) && !importedFilenames.has(filename) && !importedFilenames.has(obj.Key);
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 6px' }}>☁️ Storage Bucket Importer</h1>
          <p style={{ color: 'var(--text3)', margin: 0, fontSize: '14px' }}>
            Scan Backblaze B2 and Cloudflare R2 buckets for new video files and import them directly into the catalog.
          </p>
        </div>

        {/* Provider Switcher Tabs */}
        <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.04)', padding: '4px', borderRadius: '8px' }}>
          <Link
            href="/admin/movies/cloudflare-import?provider=b2"
            style={{
              background: isB2 ? '#9333ea' : 'transparent',
              color: '#fff',
              textDecoration: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '700',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>🟣 Backblaze B2</span>
            <span style={{ fontSize: '11px', opacity: 0.8 }}>({b2Bucket})</span>
          </Link>
          <Link
            href="/admin/movies/cloudflare-import?provider=r2"
            style={{
              background: !isB2 ? '#ea580c' : 'transparent',
              color: '#fff',
              textDecoration: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '700',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>🟠 Cloudflare R2</span>
            <span style={{ fontSize: '11px', opacity: 0.8 }}>({r2Bucket})</span>
          </Link>
        </div>
      </div>

      {/* Success Notification after importing a movie */}
      {importedMovie && (
        <div style={{ background: 'rgba(74, 222, 128, 0.12)', border: '1px solid #4ade80', borderRadius: '10px', padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#fff', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>✅</span>
            <div>
              <strong style={{ color: '#4ade80', fontSize: '14px' }}>
                {importedMovie === '1' || importedMovie === 'true' ? 'Movie successfully published!' : `"${decodeURIComponent(importedMovie)}" published successfully!`}
              </strong>
              <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '2px' }}>
                Your movie is live on FlixOn. You can immediately import another video from this bucket below.
              </div>
            </div>
          </div>
          <Link
            href={`/admin/movies/cloudflare-import?provider=${activeProvider}`}
            style={{ fontSize: '12px', color: 'var(--text3)', textDecoration: 'none', background: 'rgba(255,255,255,0.06)', padding: '6px 12px', borderRadius: '6px' }}
          >
            Dismiss ✕
          </Link>
        </div>
      )}

      {/* Configuration Missing Alert */}
      {!isConfigured && (
        <div style={{ background: 'rgba(229, 9, 20, 0.1)', border: '1px solid #e50914', padding: '20px', borderRadius: '8px', color: '#fff', marginBottom: '24px' }}>
          <h3 style={{ margin: '0 0 8px', color: '#e50914' }}>
            Missing {isB2 ? 'Backblaze B2' : 'Cloudflare R2'} Credentials
          </h3>
          <p style={{ margin: '0 0 12px', fontSize: '14px', color: 'var(--text2)' }}>
            Please configure your {isB2 ? 'B2 Key ID, Application Key, and Bucket Name' : 'R2 Account ID, Access Key, and Secret Key'} in the Settings page.
          </p>
          <Link href="/admin/settings" className="gms-btn gms-btn--primary" style={{ display: 'inline-block', fontSize: '13px', padding: '6px 14px' }}>
            Configure Storage Settings &rarr;
          </Link>
        </div>
      )}

      {/* Connection Error Alert */}
      {connectionError && (
        <div style={{ background: 'rgba(229, 9, 20, 0.1)', border: '1px solid #e50914', padding: '20px', borderRadius: '8px', color: '#fff', marginBottom: '24px' }}>
          <h3 style={{ margin: '0 0 8px', color: '#e50914' }}>
            Connection Error ({isB2 ? 'Backblaze B2' : 'Cloudflare R2'})
          </h3>
          <p style={{ margin: 0, fontSize: '13px', fontFamily: 'monospace' }}>{connectionError}</p>
        </div>
      )}

      {/* Storage Metrics Row */}
      {isConfigured && !connectionError && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          <div style={{ background: 'var(--bg2)', padding: '16px 20px', borderRadius: '10px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', marginBottom: '6px' }}>Current Bucket</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: isB2 ? '#c084fc' : '#f97316' }}>{bucketName}</div>
            <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '4px' }}>{isB2 ? 'Backblaze B2 S3' : 'Cloudflare R2'}</div>
          </div>
          <div style={{ background: 'var(--bg2)', padding: '16px 20px', borderRadius: '10px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', marginBottom: '6px' }}>Videos in Bucket</div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#fff' }}>{s3Objects.length}</div>
            <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '4px' }}>MP4, MKV, WEBM, M3U8</div>
          </div>
          <div style={{ background: 'var(--bg2)', padding: '16px 20px', borderRadius: '10px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', marginBottom: '6px' }}>Already Imported</div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#4ade80' }}>{s3Objects.length - unimportedVideos.length}</div>
            <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '4px' }}>In FlixOn database</div>
          </div>
          <div style={{ background: 'var(--bg2)', padding: '16px 20px', borderRadius: '10px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', marginBottom: '6px' }}>Pending Import</div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: unimportedVideos.length > 0 ? '#fbbf24' : '#10b981' }}>{unimportedVideos.length}</div>
            <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '4px' }}>Ready to publish</div>
          </div>
        </div>
      )}

      {/* Videos Table */}
      {isConfigured && !connectionError && (
        <div>
          {unimportedVideos.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', background: 'var(--bg2)', borderRadius: '10px', border: '1px solid var(--border)', color: 'var(--text2)' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>✅</div>
              <h3 style={{ fontSize: '18px', color: '#fff', margin: '0 0 6px' }}>All videos in {bucketName} have been imported!</h3>
              <p style={{ fontSize: '13px', color: 'var(--text3)', margin: 0 }}>
                Upload new MP4 files to Backblaze B2, or switch to Cloudflare R2 above to check that bucket.
              </p>
            </div>
          ) : (
            <div style={{ background: 'var(--bg2)', borderRadius: '10px', border: '1px solid var(--border)', overflowX: 'auto' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>
                  Unimported Videos ({unimportedVideos.length})
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text3)' }}>
                  Click &quot;Import &rarr;&quot; to auto-fill title and publish
                </span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--text3)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <th style={{ padding: '14px 18px', fontWeight: '600' }}>Filename ({isB2 ? 'B2 Key' : 'R2 Key'})</th>
                    <th style={{ padding: '14px 18px', fontWeight: '600', width: '120px' }}>Size</th>
                    <th style={{ padding: '14px 18px', fontWeight: '600', width: '140px' }}>Uploaded</th>
                    <th style={{ padding: '14px 18px', fontWeight: '600', width: '120px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {unimportedVideos.map(obj => {
                    const filename = obj.Key.split('/').pop();
                    let cleanTitle = filename.replace(/\.(mp4|mkv|webm|m3u8)$/i, '');
                    cleanTitle = cleanTitle.replace(/[\._]/g, ' ').replace(/\b(1080p|720p|4k|bluray|web-dl|x264|hevc)\b/ig, '').trim();

                    const sizeMB = (obj.Size / (1024 * 1024)).toFixed(1);
                    const encodedKey = obj.Key.split('/').map(p => encodeURIComponent(p)).join('/');
                    const fileUrl = `${cdnDomain}/${encodedKey}`;
                    const fileIsoDate = obj.LastModified ? new Date(obj.LastModified).toISOString() : '';
                    const fileDateShort = fileIsoDate ? fileIsoDate.slice(0, 10) : '';

                    return (
                      <tr key={obj.Key} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '14px 18px', fontWeight: '500', wordBreak: 'break-all' }}>
                          <span style={{ color: '#fff' }}>{obj.Key}</span>
                        </td>
                        <td style={{ padding: '14px 18px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>
                          {sizeMB} MB
                        </td>
                        <td style={{ padding: '14px 18px', color: 'var(--text3)', whiteSpace: 'nowrap' }}>
                          {obj.LastModified ? new Date(obj.LastModified).toLocaleDateString() : '—'}
                        </td>
                        <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                          <Link
                            href={`/admin/movies/add?title=${encodeURIComponent(cleanTitle)}&video_url=${encodeURIComponent(fileUrl)}&from=cloudflare-import&provider=${activeProvider}&file_date=${encodeURIComponent(fileIsoDate)}&release_date=${encodeURIComponent(fileDateShort)}`}
                            className="gms-btn gms-btn--primary"
                            style={{ fontSize: '12px', padding: '6px 14px', whiteSpace: 'nowrap', display: 'inline-block' }}
                          >
                            Import &rarr;
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
