import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getStorageClient, getStoragePublicUrl } from '@/utils/storage';
import { ListObjectsV2Command } from '@aws-sdk/client-s3';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { provider = 'b2', query = '', fetchAll = false, maxLimit = 500 } = body;

    const { client, config } = await getStorageClient(provider);

    let isTruncated = true;
    let continuationToken = undefined;
    const rawObjects = [];
    let pageCount = 0;

    // Scan up to 20 pages (20,000 files)
    while (isTruncated && pageCount < 20) {
      const command = new ListObjectsV2Command({
        Bucket: config.bucketName,
        ContinuationToken: continuationToken,
        MaxKeys: 1000,
      });

      const response = await client.send(command);
      if (response.Contents) {
        rawObjects.push(...response.Contents);
      }
      isTruncated = response.IsTruncated;
      continuationToken = response.NextContinuationToken;
      pageCount++;
    }

    // Sort newest first
    rawObjects.sort((a, b) => new Date(b.LastModified || 0) - new Date(a.LastModified || 0));

    // Filter by query if supplied
    let filtered = rawObjects;
    if (query && query.trim()) {
      const q = query.toLowerCase().trim();
      filtered = rawObjects.filter(item => item.Key && item.Key.toLowerCase().includes(q));
    }

    if (fetchAll) {
      const allKeys = filtered.map(item => item.Key);
      return NextResponse.json({
        provider: config.provider,
        bucket: config.bucketName,
        totalFound: allKeys.length,
        results: allKeys,
      });
    }

    const limited = filtered.slice(0, Number(maxLimit) || 500).map(item => ({
      key: item.Key,
      size: item.Size,
      lastModified: item.LastModified,
      url: getStoragePublicUrl(item.Key, config.provider),
    }));

    return NextResponse.json({
      provider: config.provider,
      bucket: config.bucketName,
      totalFound: filtered.length,
      results: limited,
    });
  } catch (err) {
    console.error('Storage search error:', err);
    return NextResponse.json({ error: err.message || 'Failed to search storage bucket' }, { status: 500 });
  }
}
