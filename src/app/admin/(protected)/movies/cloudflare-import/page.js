import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Cloudflare R2 Import — Admin' };

export default async function CloudflareImportPage() {
  const supabase = await createClient();

  // 1. Get credentials
  const { data: settings } = await supabase.from('admin_settings').select('*');
  const accountId = settings?.find(s => s.setting_key === 'r2_account_id')?.setting_value;
  const accessKey = settings?.find(s => s.setting_key === 'r2_access_key')?.setting_value;
  const secretKey = settings?.find(s => s.setting_key === 'r2_secret_key')?.setting_value;
  const bucketName = settings?.find(s => s.setting_key === 'r2_bucket_name')?.setting_value;
  let cdnDomain = settings?.find(s => s.setting_key === 'cdn_domain')?.setting_value;

  if (!accountId || !accessKey || !secretKey || !bucketName) {
    return (
      <div>
        <h1 style={{ fontSize: '28px', marginBottom: '20px' }}>Cloudflare R2 Import</h1>
        <div style={{ background: 'rgba(229, 9, 20, 0.1)', border: '1px solid #e50914', padding: '20px', borderRadius: '8px', color: '#fff' }}>
          <h3 style={{ margin: '0 0 10px', color: '#e50914' }}>Missing R2 Credentials</h3>
          <p style={{ margin: 0 }}>You must configure your Cloudflare R2 credentials (Account ID, Access Key, Secret Key, Bucket Name) in the <Link href="/admin/settings" style={{color: 'var(--acc)'}}>Settings</Link> page before you can import videos.</p>
        </div>
      </div>
    );
  }

  // Ensure CDN domain is formatted correctly (e.g., https://cdn.flixon.net)
  if (cdnDomain && !cdnDomain.startsWith('http')) {
    cdnDomain = `https://${cdnDomain}`;
  } else if (!cdnDomain) {
    // Fallback public R2 URL (often not configured, so users should set CDN domain)
    cdnDomain = `https://${bucketName}.${accountId}.r2.cloudflarestorage.com`;
  }
  // Remove any trailing slash to prevent double slashes
  cdnDomain = cdnDomain.replace(/\/$/, '');

  // 2. Fetch R2 Bucket Contents
  let s3Objects = [];
  try {
    const s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
    });

    let isTruncated = true;
    let continuationToken = undefined;

    while (isTruncated) {
      const command = new ListObjectsV2Command({
        Bucket: bucketName,
        MaxKeys: 1000,
        ContinuationToken: continuationToken,
      });

      const data = await s3.send(command);
      
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
    return (
      <div>
        <h1 style={{ fontSize: '28px', marginBottom: '20px' }}>Cloudflare R2 Import</h1>
        <div style={{ background: 'rgba(229, 9, 20, 0.1)', border: '1px solid #e50914', padding: '20px', borderRadius: '8px', color: '#fff' }}>
          <h3 style={{ margin: '0 0 10px', color: '#e50914' }}>Cloudflare R2 Connection Error</h3>
          <p style={{ margin: 0 }}>{err.message}</p>
        </div>
      </div>
    );
  }

  // 3. Fetch Existing Movies from Database to find unimported ones
  const importedUrls = new Set();
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
      dbMovies.forEach(m => { if (m.video_url) importedUrls.add(m.video_url); });
      if (dbMovies.length < pageSize) hasMore = false;
      page++;
    }
  }

  const unimportedVideos = s3Objects.filter(obj => {
    const encodedKey = obj.Key.split('/').map(p => encodeURIComponent(p)).join('/');
    const fileUrl = `${cdnDomain}/${encodedKey}`;
    return !importedUrls.has(fileUrl);
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: '0', color: '#fff', fontSize: '24px' }}>Cloudflare R2 Importer</h2>
        <span style={{ background: 'rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '4px', fontSize: '14px', color: '#ccc' }}>
          Bucket: {bucketName}
        </span>
      </div>
      
      <p style={{ color: 'var(--text2)', marginBottom: '30px' }}>
        The following videos were found in your R2 bucket but are <strong>not yet imported</strong> into the FlixOn database. Click "Add Movie" to create a new movie entry for the video.
      </p>

      {unimportedVideos.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', background: 'var(--bg2)', borderRadius: '8px', color: 'var(--text2)' }}>
          <p style={{ fontSize: '16px' }}>All videos in your bucket have been imported!</p>
          <p style={{ fontSize: '14px', marginTop: '10px' }}>Upload more videos to see them here.</p>
        </div>
      ) : (
        <div style={{ background: 'var(--bg2)', borderRadius: '8px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.2)', color: 'var(--text2)', fontSize: '13px', textTransform: 'uppercase' }}>
                <th style={{ padding: '15px 20px', fontWeight: '600' }}>Filename (R2 Key)</th>
                <th style={{ padding: '15px 20px', fontWeight: '600', width: '120px' }}>Size</th>
                <th style={{ padding: '15px 20px', fontWeight: '600', width: '150px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {unimportedVideos.map(obj => {
                // Generate a clean title from the filename
                const filename = obj.Key.split('/').pop();
                let cleanTitle = filename.replace(/\.(mp4|mkv|webm|m3u8)$/i, '');
                // Basic cleanup: replace dots/underscores with spaces, remove common release groups
                cleanTitle = cleanTitle.replace(/[\._]/g, ' ').replace(/\b(1080p|720p|4k|bluray|web-dl|x264|hevc)\b/ig, '').trim();

                const sizeMB = (obj.Size / (1024 * 1024)).toFixed(1);
                const encodedKey = obj.Key.split('/').map(p => encodeURIComponent(p)).join('/');
                const fileUrl = `${cdnDomain}/${encodedKey}`;
                
                return (
                  <tr key={obj.Key} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '15px 20px', fontWeight: '500', wordBreak: 'break-all' }}>
                      {obj.Key}
                    </td>
                    <td style={{ padding: '15px 20px', color: 'var(--text2)' }}>
                      {sizeMB} MB
                    </td>
                    <td style={{ padding: '15px 20px', color: 'var(--text2)' }}>
                      {obj.LastModified ? new Date(obj.LastModified).toLocaleDateString() : ''}
                    </td>
                    <td style={{ padding: '15px 20px', textAlign: 'right' }}>
                      <Link 
                        href={`/admin/movies/add?title=${encodeURIComponent(cleanTitle)}&video_url=${encodeURIComponent(fileUrl)}`}
                        className="gms-btn gms-btn--primary"
                        style={{ fontSize: '13px', padding: '6px 16px' }}
                      >
                        Import →
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
  );
}
