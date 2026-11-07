import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'deployment.json');
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return NextResponse.json(data);
    }
  } catch (error) {
    console.error('Error reading deployment info:', error);
  }

  return NextResponse.json({
    commit: 'development',
    fullCommit: '',
    message: 'Local build',
    author: 'Developer',
    commitDate: '',
    deployedAt: new Date().toISOString(),
    repository: 'derrickgenesism/flixonzero'
  });
}
