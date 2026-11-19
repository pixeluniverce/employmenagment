import Link from 'next/link';
import { sql, inr, today } from '@/lib/db';
import { deleteBatch } from '@/app/actions';
import { Head } from '@/components/ui';
import WorkForm from '@/components/WorkForm';
import Del from '@/components/Del';

export default async function Work({ searchParams }) {
  const d = /^\d{4}-\d{2}-\d{2}$/.test(searchParams.d || '') ? searchParams.d : today();
  const [groups, items, batches] = await Promise.all([
    sql`select g.id, g.name, g.finalized,
      (select count(*) from daily_group_members m where m.daily_group_id=g.id and m.status in ('Present','Half Day')) working,
      (select count(*) from daily_group_members m where m.daily_group_id=g.id) total,
      coalesce((select sum(i.amount) from production_batch_items i join production_batches b on b.id=i.batch_id where b.daily_group_id=g.id),0) pool
      from daily_groups g where g.work_date=${d}::date order by g.id`,
    sql`select id, code, name, rate::float rate from items where active order by code`,
    sql`select b.id, g.name gname, g.finalized, b.notes, sum(i.amount) a, sum(i.qty) q,
      string_agg(it.code || ' × ' || trim(trailing '.' from trim(trailing '0' from i.qty::text)) || ' @ ₹' || i.rate, ', ') detail
      from production_batches b join daily_groups g on g.id=b.daily_group_id join production_batch_items i on i.batch_id=b.id join items it on it.id=i.item_id
      where g.work_date=${d}::date group by b.id, g.name, g.finalized order by b.id desc`,
  ]);
  return (
    <>
      <Head t="Daily production" />
      <form className="card mb-4 flex flex-wrap items-end gap-2">
        <div><label className="lbl">Production date</label><input type="date" name="d" defaultValue={d} className="inp" /></div>
        <button className="btn-o">Open date</button>
        <Link href={`/assign?d=${d}`} className="text-sm text-brand">Edit groups and attendance for this date</Link>
      </form>
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {groups.map((g) => (<div key={g.id} className="card"><div className="text-xs text-slate-500">{g.name} {g.finalized && '(finalized)'}</div><div className="text-xl font-semibold text-navy">{inr(g.pool)}</div><div className="text-xs text-slate-500">{g.working} working of {g.total}</div></div>))}
      </div>
      <WorkForm groups={groups.filter((g) => !g.finalized)} items={items} />
      <h2 className="mb-2 mt-8 font-semibold text-navy">Batches saved for {d}</h2>
      <div className="card overflow-x-auto p-0">
        <table className="tbl"><thead><tr><th>Group</th><th>Items</th><th>Pieces</th><th>Amount</th><th>Notes</th><th /></tr></thead>
          <tbody>
            {batches.map((r) => (<tr key={r.id}><td>{r.gname}</td><td className="text-xs text-slate-600">{r.detail}</td><td>{Number(r.q)}</td><td>{inr(r.a)}</td><td>{r.notes}</td>
              <td>{r.finalized ? <span className="text-xs text-slate-500">locked</span> : <form action={deleteBatch}><input type="hidden" name="id" value={r.id} /><Del /></form>}</td></tr>))}
            {!batches.length && <tr><td colSpan="6" className="py-6 text-center text-slate-500">No production for this date.</td></tr>}
          </tbody></table>
      </div>
    </>
  );
}

export const dynamic = 'force-dynamic';
