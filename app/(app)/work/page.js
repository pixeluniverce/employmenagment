import { sql, inr, today } from '@/lib/db';
import { deleteEntry } from '@/app/actions';
import { Head } from '@/components/ui';
import WorkForm from '@/components/WorkForm';
import Del from '@/components/Del';
import PrintBtn from '@/components/PrintBtn';

export default async function Work({ searchParams }) {
  const d = searchParams.d || '', e = searchParams.e ? +searchParams.e : null;
  const [emps, items, entries] = await Promise.all([
    sql`select id, name, code from employees where active order by name`,
    sql`select id, code, name, rate::float rate from items where active order by code`,
    sql`select p.id, p.work_date::text d, e.name, sum(i.qty) q, sum(i.amount) a,
        string_agg(it.code || ' × ' || trim(trailing '.' from trim(trailing '0' from i.qty::text)) || ' @ ₹' || i.rate, ', ') detail
      from production_entries p join employees e on e.id=p.employee_id join production_entry_items i on i.entry_id=p.id join items it on it.id=i.item_id
      where (${d || null}::date is null or p.work_date=${d || null}::date) and (${e}::int is null or p.employee_id=${e}::int)
      group by p.id, e.name order by p.work_date desc, p.id desc limit 100`,
  ]);
  return (
    <>
      <Head t="Daily work entry" />
      <WorkForm employees={emps} items={items} today={today()} />
      <div className="mt-8"><Head t="Production history"><PrintBtn label="Print report" /></Head></div>
      <form className="card no-print mb-3 flex flex-wrap gap-2">
        <input type="date" name="d" defaultValue={d} className="inp max-w-[12rem]" />
        <select name="e" defaultValue={e || ''} className="inp max-w-[14rem]"><option value="">All employees</option>{emps.map((x) => (<option key={x.id} value={x.id}>{x.name}</option>))}</select>
        <button className="btn-o">Filter</button>
      </form>
      <div className="card overflow-x-auto p-0">
        <table className="tbl"><thead><tr><th>Date</th><th>Employee</th><th>Items</th><th>Pieces</th><th>Amount</th><th /></tr></thead>
          <tbody>
            {entries.map((r) => (<tr key={r.id}><td>{r.d}</td><td>{r.name}</td><td className="text-xs text-slate-600">{r.detail}</td><td>{Number(r.q)}</td><td>{inr(r.a)}</td>
              <td className="no-print"><form action={deleteEntry}><input type="hidden" name="id" value={r.id} /><Del /></form></td></tr>))}
            {!entries.length && <tr><td colSpan="6" className="py-6 text-center text-slate-500">No entries for this filter.</td></tr>}
          </tbody></table>
      </div>
    </>
  );
}

export const dynamic = 'force-dynamic';
