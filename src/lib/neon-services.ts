import { neon, neonConfig } from '@neondatabase/serverless';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

// 1. Neon Serverless PostgreSQL
const databaseUrl = process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_sga0MbUVI7fc@ep-flat-snow-bi8pj8vc.c-5.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';
export const sql = neon(databaseUrl);

// 2. Neon AI Gateway Client
export async function askAIGateway(prompt: string, model: string = 'claude-opus-4-8') {
  const baseUrl = process.env.NEON_AI_GATEWAY_BASE_URL || 'https://br-broad-cherry-bihvh46n-api.ai.c-5.ap-southeast-1.aws.neon.tech';
  const token = process.env.NEON_AI_GATEWAY_TOKEN || 'nt_live_efb27c919b59_6rSCilUl6CDvXt1D41v2QeXAyb3W1zYL';

  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: 'You are an expert academic advisor for KTU B.Tech engineering students.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7
    })
  });

  if (!response.ok) {
    throw new Error(`AI Gateway error (${response.status}): ${await response.text()}`);
  }

  const json = await response.json();
  return json.choices?.[0]?.message?.content || '';
}

// 3. Neon Object Storage (S3-compatible)
export function getStorageClient() {
  return new S3Client({
    region: process.env.AWS_REGION || 'ap-southeast-1',
    endpoint: process.env.AWS_ENDPOINT_URL_S3 || 'https://br-broad-cherry-bihvh46n.storage.c-5.ap-southeast-1.aws.neon.tech',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'nak_live_bd68d9ce37564d7ca59ebb9eebfa98da',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'nsk_live_dab86101b50ea218b16f18c64e87ed877dd1269148ba25fb046e29077c3ea547'
    },
    forcePathStyle: true
  });
}

// 4. Database initialization table check
export async function initializeDatabaseSchema() {
  await sql.query(`
    CREATE TABLE IF NOT EXISTS user_instances (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      target_cgpa REAL,
      data_json JSONB NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  return { success: true };
}
