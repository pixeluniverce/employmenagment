import { sql } from '@/lib/db';
import { saveSettings } from '@/app/actions';
import { Head } from '@/components/ui';
import { getWeights } from '@/lib/engine';

export default async function Settings() {
  const [rows, w, logs] = await Promise.all([sql`select key, value from business_settings`, getWeights(), sql`select action, detail, created_at::text t from audit_logs order by id desc limit 25`]);
  const m = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return (
    <>
      <Head t="Settings" />
      <form action={saveSettings} className="card mb-6 grid max-w-2xl gap-3 md:grid-cols-3">
        <div className="md:col-span-3"><label className="lbl">Business name</label><input name="business_name" defaultValue={m.business_name || 'Mahadev Cement Product'} className="inp" /></div>
        <div><label className="lbl">Weight: Present</label><input name="weight_present" type="number" step="0.01" min="0" defaultValue={w.Present} className="inp" /></div>
        <div><label className="lbl">Weight: Half day</label><input name="weight_half" type="number" step="0.01" min="0" defaultValue={w['Half Day']} className="inp" /></div>
        <div className="flex items-end"><button className="btn">Save settings</button></div>
        <p className="text-xs text-slate-500 md:col-span-3">Absent and Leave always have weight 0. Changed weights apply only to groups finalized from now on. Already finalized earnings never change.</p>
      </form>
      <div className="card mb-6 max-w-2xl text-sm text-slate-600"><h2 className="mb-2 font-semibold text-navy">Backup and export</h2>
        <p><a className="text-brand" href="/items/csv">Download items CSV</a> · <a className="text-brand" href="/reports/csv">Download this month's statement CSV</a></p>
        <p className="mt-1">Your database lives in Neon, which keeps point-in-time history (restore from the Neon console). The admin password is the <code>ADMIN_PASSWORD</code> variable in Vercel; change it there and redeploy.</p></div>
      <h2 className="mb-2 font-semibold text-navy">Audit log (latest 25)</h2>
      <div className="card overflow-x-auto p-0"><table className="tbl"><thead><tr><th>When (UTC)</th><th>Action</th><th>Detail</th></tr></thead><tbody>
        {logs.map((l, i) => (<tr key={i}><td>{l.t.slice(0, 19)}</td><td>{l.action}</td><td>{l.detail}</td></tr>))}</tbody></table></div>
    </>
  );
}

export const dynamic = 'force-dynamic';
