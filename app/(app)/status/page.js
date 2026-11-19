import { sql } from '@/lib/db';
import { Head } from '@/components/ui';

const tables = ['business_settings', 'employee_groups', 'employees', 'items', 'item_rate_history', 'daily_groups', 'daily_group_members', 'production_batches', 'production_batch_items', 'employee_daily_distributions', 'employee_advances', 'employee_payments', 'audit_logs'];

export default async function Status() {
  const env = ['DATABASE_URL', 'ADMIN_PASSWORD', 'SESSION_SECRET'].map((k) => [k, process.env[k] ? 'set' : 'MISSING']);
  let host = '';
  try { host = new URL(process.env.DATABASE_URL).hostname; } catch { host = 'DATABASE_URL is missing or not a valid connection string'; }
  const checks = [];
  try { await sql`select 1 as ok`; checks.push(['Database connection', 'OK']); } catch (e) { checks.push(['Database connection', 'FAILED: ' + e.message]); }
  for (const t of tables) {
    try { const r = await sql.query(`select count(*)::int as n from ${t}`); checks.push([`table ${t}`, `OK (${r[0].n} rows)`]); }
    catch (e) { checks.push([`table ${t}`, 'FAILED: ' + e.message]); }
  }
  try {
    const cols = (await sql`select column_name from information_schema.columns where table_name='employees'`).map((c) => c.column_name);
    checks.push(['employees has perm_group_id', cols.includes('perm_group_id') ? 'OK' : 'NO: this is the OLD employees table. Run reset_all.sql, then schema.sql']);
  } catch (e) { checks.push(['employees columns', 'FAILED: ' + e.message]); }
  return (
    <>
      <Head t="System status" />
      <div className="card mb-4"><h2 className="mb-2 font-semibold text-navy">Environment variables</h2>
        <ul className="text-sm">{env.map(([k, v]) => (<li key={k}>{k}: <b className={v === 'set' ? 'text-green-700' : 'text-red-600'}>{v}</b></li>))}</ul>
        <p className="mt-2 text-sm text-slate-600">Database host: {host}</p></div>
      <div className="card overflow-x-auto p-0"><table className="tbl"><thead><tr><th>Check</th><th>Result</th></tr></thead><tbody>
        {checks.map(([k, v]) => (<tr key={k}><td>{k}</td><td className={v.startsWith('OK') ? 'text-green-700' : 'text-red-600'}>{v}</td></tr>))}</tbody></table></div>
    </>
  );
}

export const dynamic = 'force-dynamic';
