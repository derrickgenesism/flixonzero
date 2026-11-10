import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getStorageClient, getStoragePublicUrl } from '@/utils/storage';
import { ListObjectsV2Command } from '@aws-sdk/client-s3';

export const dynamic = 'force-dynamic';

function normalizeTitle(str) {
  return str
    .toLowerCase()
    .replace(/\.(mp4|mkv|avi|mov|wmv|flv|webm|ts)$/i, '')
    .replace(/(_compressed|\.optimized|\.compressed|-compressed|-opt)/gi, '')
    .replace(/(1080p|720p|480p|4k|hd|fhd|bluray|web-dl|webrip|x264|x265|hevc|aac)/gi, '')
    .replace(/\(\d+\)/g, '') // (2), (3)
    .replace(/[-_.,()\[\]{}#]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function diceCoefficient(str1, str2) {
  if (str1 === str2) return 1.0;
  if (str1.length < 2 || str2.length < 2) return 0.0;

  const pairs1 = [];
  for (let i = 0; i < str1.length - 1; i++) pairs1.push(str1.substring(i, i + 2));
  const pairs2 = [];
  for (let i = 0; i < str2.length - 1; i++) pairs2.push(str2.substring(i, i + 2));

  let intersection = 0;
  const used = new Array(pairs2.length).fill(false);

  for (let i = 0; i < pairs1.length; i++) {
    for (let j = 0; j < pairs2.length; j++) {
      if (!used[j] && pairs1[i] === pairs2[j]) {
        intersection++;
        used[j] = true;
        break;
      }
    }
  }

  return (2.0 * intersection) / (pairs1.length + pairs2.length);
}

export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { provider = 'b2', threshold = 0.75 } = body;

    const { client, config } = await getStorageClient(provider);

    let isTruncated = true;
    let continuationToken = undefined;
    const rawObjects = [];
    let pageCount = 0;

    // Scan up to 5 pages (5,000 files) to keep fuzzy O(N²) matching instantaneous and prevent timeout
    const MAX_PAGES = 5;
    while (isTruncated && pageCount < MAX_PAGES) {
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

    const isCapped = isTruncated && pageCount >= MAX_PAGES;

    const processed = rawObjects
      .filter(obj => obj.Key && obj.Key.trim().length > 0)
      .slice(0, 5000)
      .map(obj => ({
        key: obj.Key,
        size: obj.Size || 0,
        lastModified: obj.LastModified,
        url: getStoragePublicUrl(obj.Key, config.provider),
        normalized: normalizeTitle(obj.Key),
      }));

    const groups = [];
    const visited = new Set();

    for (let i = 0; i < processed.length; i++) {
      if (visited.has(i)) continue;
      const itemA = processed[i];
      if (itemA.normalized.length < 3) continue;

      const groupMembers = [itemA];
      visited.add(i);

      for (let j = i + 1; j < processed.length; j++) {
        if (visited.has(j)) continue;
        const itemB = processed[j];
        if (itemB.normalized.length < 3) continue;

        let isMatch = false;

        // Exact normalized match (e.g. "title.mp4" and "title_compressed.mp4")
        if (itemA.normalized === itemB.normalized) {
          isMatch = true;
        } else if (
          itemA.normalized.length > 5 &&
          itemB.normalized.length > 5 &&
          (itemA.normalized.includes(itemB.normalized) || itemB.normalized.includes(itemA.normalized))
        ) {
          isMatch = true;
        } else {
          const score = diceCoefficient(itemA.normalized, itemB.normalized);
          if (score >= threshold) {
            isMatch = true;
          }
        }

        if (isMatch) {
          groupMembers.push(itemB);
          visited.add(j);
        }
      }

      if (groupMembers.length > 1) {
        // Sort items inside group largest first
        groupMembers.sort((a, b) => b.size - a.size);

        // The largest file is considered the "primary" or "raw" version; others are duplicates/compressed
        const totalGroupBytes = groupMembers.reduce((sum, item) => sum + item.size, 0);
        const smallestFileBytes = groupMembers[groupMembers.length - 1].size;
        // Wasted space is if we only kept the smallest (compressed) file:
        const potentialSavings = totalGroupBytes - smallestFileBytes;

        groups.push({
          title: itemA.normalized,
          files: groupMembers,
          totalGroupBytes,
          potentialSavings,
        });
      }
    }

    // Sort groups by potential savings descending (biggest wins at top)
    groups.sort((a, b) => b.potentialSavings - a.potentialSavings);

    const totalWastedBytes = groups.reduce((sum, g) => sum + g.potentialSavings, 0);
    const totalDuplicateFiles = groups.reduce((sum, g) => sum + (g.files.length - 1), 0);

    return NextResponse.json({
      provider: config.provider,
      bucket: config.bucketName,
      scannedCount: processed.length,
      isCapped,
      warning: isCapped ? 'Bucket has over 5,000 files. Scanned the first 5,000 files for fast duplicate matching.' : null,
      groupCount: groups.length,
      totalDuplicateFiles,
      totalWastedBytes,
      groups,
    });
  } catch (err) {
    console.error('Scan duplicates error:', err);
    return NextResponse.json({ error: err.message || 'Failed to scan for duplicate videos' }, { status: 500 });
  }
}
