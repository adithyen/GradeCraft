import { NextResponse } from 'next/server';
import { sql, getStorageClient } from '@/lib/neon-services';
import { ListObjectsV2Command } from '@aws-sdk/client-s3';

export const dynamic = 'force-dynamic';

export async function GET() {
  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    postgres: { status: 'pending' },
    storage: { status: 'pending' },
    aiGateway: { status: 'pending' },
  };

  // 1. Check Neon PostgreSQL
  try {
    const t0 = Date.now();
    const rows = await sql.query('SELECT version(), current_database(), current_user;');
    results.postgres = {
      status: 'online',
      latencyMs: Date.now() - t0,
      database: rows[0]?.current_database,
      user: rows[0]?.current_user,
      version: rows[0]?.version?.split(' ')?.[0] || 'PostgreSQL',
    };
  } catch (err: any) {
    results.postgres = { status: 'error', error: err.message };
  }

  // 2. Check Neon Object Storage (S3)
  try {
    const t0 = Date.now();
    const s3 = getStorageClient();
    const bucket = process.env.S3_BUCKET || 'uploads';
    const list = await s3.send(new ListObjectsV2Command({ Bucket: bucket, MaxKeys: 5 }));
    results.storage = {
      status: 'online',
      latencyMs: Date.now() - t0,
      bucket: bucket,
      objectsFound: list.KeyCount || 0,
    };
  } catch (err: any) {
    results.storage = { status: 'error', error: err.message };
  }

  // 3. Check AI Gateway
  const aiToken = process.env.NEON_AI_GATEWAY_TOKEN;
  const aiBase = process.env.NEON_AI_GATEWAY_BASE_URL;
  if (aiToken && aiBase) {
    results.aiGateway = {
      status: 'configured',
      endpoint: aiBase,
      note: 'Configured with API token (Paid plan activates inference endpoints)',
    };
  } else {
    results.aiGateway = { status: 'unconfigured' };
  }

  return NextResponse.json(results);
}
