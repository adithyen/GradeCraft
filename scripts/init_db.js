const { neon } = require('@neondatabase/serverless');

const conn = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_sga0MbUVI7fc@ep-flat-snow-bi8pj8vc.c-5.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';
const sql = neon(conn);

async function run() {
  console.log('Connecting to Neon PostgreSQL...');
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
  console.log('user_instances table checked/created.');

  const res = await sql.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public';");
  console.log('Current public tables:', res.map(r => r.table_name));
}

run().catch(console.error);
