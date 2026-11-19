import Link from 'next/link';
import { sql, inr, today } from '@/lib/db';
import { loadGroup } from '@/lib/engine';
import { fromPaise } from '@/lib/split.mjs';
import { finalizeGroup, reopenGroup } from '@/app/actions';
import { Head } from '@/components/ui';
import Confirm from '@/components/Confirm';

export default async function Distribution({ searchParams }) {
  const d = /^\d{4}-\d{2}-\d{2}$/.test(searchParams.d || '') ? searchParams.d : today();
  const [ids, [na]] = await Promise.all([
    sql`select id from daily_groups where work_date=${d}::date order by id`,
    sql`select count(*) n from employees e where e.active and not exists (select 1 from daily_group_members m where m.employee_id=e.id and m.work_date=${d}::date)`,
  ]);
  const data = await Promise.all(ids.map(async ({ id }) => {
    const L = await loadGroup(id);
    if (L.g.finalized) L.saved = await sql`select x.employee_id, x.status, x.weight, x.share, x.pool, e.name, e.code from employee_daily_distributions x join employees e on e.id=x.employee_id where x.daily_group_id=${id} order by x.employee_id`;
    return L;
  }));
  return (
    <>
      <Head t="Earnings distribution" />
      <form className="card mb-4 flex flex-wrap items-end gap-2">
        <div><label className="lbl">Date</label><input type="date" name="d" defaultValue={d} className="inp" /></div>
        <button className="btn-o">Open date</button>
      </form>
      {+na.n > 0 && <p className="mb-3 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">{na.n} active employee(s) are not assigned to any group on this date. <Link className="underline" href={`/assign?d=${d}`}>Review assignments</Link></p>}
      {!data.length && <p className="text-sm text-slate-500">No groups for this date.</p>}
      <div className="space-y-4">
        {data.map((L) => {
          const fin = L.g.finalized;
          const rows = fin ? L.saved.map((x) => ({ ...x, amt: x.share })) : L.split.rows.map((x) => ({ ...x, amt: fromPaise(x.paise) }));
          const pool = fin ? L.saved[0]?.pool ?? 0 : fromPaise(L.poolPaise);
          const und = fin ? +L.g.undistributed : L.split.undistributed / 100;
          const eligible = rows.filter((r) => +r.weight > 0).length;
          return (
            <div key={L.g.id} className="card">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-semibold text-navy">{L.g.name} {L.g.is_temporary && <em className="text-sm font-normal text-slate-500">(temporary)</em>} <span className={`ml-2 rounded px-2 py-0.5 text-xs ${fin ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>{fin ? 'Finalized' : 'Not finalized'}</span></h2>
                <div className="text-sm">Group production: <b>{inr(pool)}</b> · Eligible employees: <b>{eligible}</b></div>
              </div>
              {!fin && !L.members.length && <p className="mt-2 text-sm text-red-600">Warning: this group has no employees.</p>}
              {!fin && L.members.length > 0 && eligible === 0 && <p className="mt-2 text-sm text-red-600">Warning: nobody is eligible (all absent/leave). {+pool > 0 ? `${inr(pool)} would stay undistributed.` : ''}</p>}
              {!fin && +pool === 0 && <p className="mt-2 text-sm text-amber-700">No production entered for this group yet.</p>}
              {und > 0 && <p className="mt-2 text-sm text-red-600">Undistributed amount: {inr(und)} (no eligible employees).</p>}
              <div className="mt-3 overflow-x-auto"><table className="tbl"><thead><tr><th>Employee</th><th>Attendance</th><th>Weight</th><th>Earnings</th></tr></thead><tbody>
                {rows.map((r) => (<tr key={r.employee_id}><td>{r.name} <span className="text-xs text-slate-500">{r.code}</span></td><td>{r.status}</td><td>{+r.weight}</td><td>{inr(r.amt)}</td></tr>))}
              </tbody></table></div>
              <div className="mt-3 flex gap-3">
                {!fin && <form action={finalizeGroup}><input type="hidden" name="id" value={L.g.id} /><Confirm msg={`Finalize ${L.g.name}? Earnings will be saved to employee accounts and the group will be locked.`}>Finalize and save earnings</Confirm></form>}
                {fin && <form action={reopenGroup}><input type="hidden" name="id" value={L.g.id} /><Confirm className="btn-o" msg="Reopen this group? Its saved earnings will be removed and recalculated at the next finalization. This is recorded in the audit log.">Reopen (admin correction)</Confirm></form>}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export const dynamic = 'force-dynamic';
