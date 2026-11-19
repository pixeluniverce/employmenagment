import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
if (!process.env.DATABASE_URL) { console.error('DATABASE_URL missing in .env.local'); process.exit(1); }
const sql = neon(process.env.DATABASE_URL);
const stmts = readFileSync(new URL('../schema.sql', import.meta.url), 'utf8').split(';').map(s => s.trim()).filter(Boolean);
for (const s of stmts) await sql.query(s);
console.log('Database ready:', stmts.length, 'statements applied');
