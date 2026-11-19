import Link from 'next/link';
import { sql, inr, today } from '@/lib/db';
import { balances } from '@/lib/data';
import { Stat, Head } from '@/components/ui';

export default async function Dashboard() {
  const t = today(), m1 = t.slice(0, 7) + '-01';
  const [[c], [td], [mo], [tx], months, recent, emps] = await Promise.all([
    sql`select (select count(*) from employees where active) emps, (select count(*) from items where active) items`,
    sql`select coalesce(sum(i.qty),0) q, coalesce(sum(i.amount),0) a from production_entry_items i join production_entries p on p.id=i.entry_id where p.work_date=${t}::date`,
    sql`select coalesce(sum(i.amount),0) a from production_entry_items i join production_entries p on p.id=i.entry_id where p.work_date>=${m1}::date and p.work_date<(${m1}::date + interval '1 month')`,
    sql`select (select coalesce(sum(amount),0) from employee_advances) adv, (select coalesce(sum(amount),0) from employee_payments) paid`,
    sql`select to_char(date_trunc('month',p.work_date),'Mon YY') l, sum(i.amount) a, sum(i.qty) q from production_entry_items i join production_entries p on p.id=i.entry_id where p.work_date>=(${m1}::date - interval '5 months') group by date_trunc('month',p.work_date) order by date_trunc('month',p.work_date)`,
    sql`select p.id, p.work_date::text d, e.name, sum(i.qty) q, sum(i.amount) a from production_entries p join employees e on e.id=p.employee_id join production_entry_items i on i.entry_id=p.id group by p.id, e.name order by p.id desc limit 6`,
    balances(),
  ]);
  const pending = emps.reduce((s, e) => s + e.balance, 0);
  const top = [...emps].sort((a, b) => b.earned - a.earned).slice(0, 5);
  const max = Math.max(1, ...months.map((x) => +x.a));
  return (
    <>
      <Head t="Dashboard">
        <Link href="/employees" className="btn-o">Add employee</Link>
        <Link href="/items" className="btn-o">Add item</Link>
        <Link href="/work" className="btn">Add daily work</Link>
        <Link href="/advances" className="btn-o">Give advance</Link>
        <Link href="/payments" className="btn-o">Make payment</Link>
      </Head>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat l="Active employees" v={c.emps} />
        <Stat l="Active items" v={c.items} />
        <Stat l="Today's production" v={Number(td.q)} />
        <Stat l="Today's earnings" v={inr(td.a)} />
        <Stat l="This month's earnings" v={inr(mo.a)} />
        <Stat l="Total advances" v={inr(tx.adv)} />
        <Stat l="Total payments" v={inr(tx.paid)} />
        <Stat l="Pending payments" v={inr(pending)} />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-3 font-semibold text-navy">Monthly earnings and production</h2>
          {months.length === 0 && <p className="text-sm text-slate-500">No production saved yet. Add daily work to see the chart.</p>}
          <div className="flex h-44 items-end gap-3">
            {months.map((x) => (
              <div key={x.l} className="flex flex-1 flex-col items-center justify-end gap-1">
                <span className="text-[11px] text-slate-500">{inr(x.a)}</span>
                <div className="w-full rounded-t bg-brand" style={{ height: `${Math.max(4, (+x.a / max) * 100)}%` }} title={`${Number(x.q)} pcs`} />
                <span className="text-xs text-slate-600">{x.l}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h2 className="mb-3 font-semibold text-navy">Top employees (lifetime earnings)</h2>
          <table className="tbl"><tbody>
            {top.map((e) => (<tr key={e.id}><td><Link className="text-brand" href={`/employees/${e.id}`}>{e.name}</Link></td><td className="text-right">{inr(e.earned)}</td></tr>))}
          </tbody></table>
        </div>
        <div className="card lg:col-span-2">
          <h2 className="mb-3 font-semibold text-navy">Recent production entries</h2>
          <div className="overflow-x-auto"><table className="tbl">
            <thead><tr><th>Date</th><th>Employee</th><th>Pieces</th><th>Amount</th></tr></thead>
            <tbody>{recent.map((r) => (<tr key={r.id}><td>{r.d}</td><td>{r.name}</td><td>{Number(r.q)}</td><td>{inr(r.a)}</td></tr>))}</tbody>
          </table></div>
        </div>
      </div>
    </>
  );
}
