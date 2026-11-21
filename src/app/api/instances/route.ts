import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon-services';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'guest';

    const rows = await sql.query(
      'SELECT id, user_id, name, target_cgpa, data_json, updated_at FROM user_instances WHERE user_id = $1 ORDER BY updated_at DESC;',
      [userId]
    );

    return NextResponse.json({ instances: rows });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, userId, name, targetCgpa, dataJson } = body;

    if (!id || !name || !dataJson) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await sql.query(
      `INSERT INTO user_instances (id, user_id, name, target_cgpa, data_json, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         target_cgpa = EXCLUDED.target_cgpa,
         data_json = EXCLUDED.data_json,
         updated_at = NOW();`,
      [id, userId || 'guest', name, targetCgpa || null, JSON.stringify(dataJson)]
    );

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
