import { sql, inr, today } from '@/lib/db';
import { balances } from '@/lib/data';
import { Head } from '@/components/ui';
import PrintBtn from '@/components/PrintBtn';

export default async function Reports({ searchParams }) {
  const m = /^\d{4}-\d{2}$/.test(searchParams.m || '') ? searchParams.m : today().slice(0, 7);
  const a = m + '-01';
  const [emp, itemsR, days, bal] = await Promise.all([
    sql`select e.id, e.code, e.name,
      coalesce((select sum(i.amount) from production_entry_items i join production_entries p on p.id=i.entry_id where p.employee_id=e.id and p.work_date>=${a}::date and p.work_date<(${a}::date + interval '1 month')),0) earned,
      coalesce((select sum(amount) from employee_advances x where x.employee_id=e.id and x.tx_date>=${a}::date and x.tx_date<(${a}::date + interval '1 month')),0) adv,
      coalesce((select sum(amount) from employee_payments x where x.employee_id=e.id and x.tx_date>=${a}::date and x.tx_date<(${a}::date + interval '1 month')),0) paid
      from employees e order by e.id`,
    sql`select it.code, it.name, sum(i.qty) q, sum(i.amount) a from production_entry_items i join production_entries p on p.id=i.entry_id join items it on it.id=i.item_id where p.work_date>=${a}::date and p.work_date<(${a}::date + interval '1 month') group by it.id order by a desc`,
    sql`select p.work_date::text d, sum(i.qty) q, sum(i.amount) a from production_entries p join production_entry_items i on i.entry_id=p.id where p.work_date>=${a}::date and p.work_date<(${a}::date + interval '1 month') group by p.work_date order by p.work_date`,
    balances(),
  ]);
  const bmap = Object.fromEntries(bal.map((x) => [x.id, x.balance]));
  const T = (k) => emp.reduce((s, r) => s + +r[k], 0);
  return (
    <>
      <Head t={`Monthly report: ${m}`}>
        <PrintBtn />
        <a className="btn-o no-print" href={`/reports/csv?m=${m}`}>Export Excel (CSV)</a>
      </Head>
      <form className="card no-print mb-4 flex gap-2"><input type="month" name="m" defaultValue={m} className="inp max-w-[12rem]" /><button className="btn-o">Show month</button></form>
      <h2 className="mb-2 font-semibold text-navy">Employee earnings, advances and payments</h2>
      <div className="card mb-6 overflow-x-auto p-0">
        <table className="tbl"><thead><tr><th>Employee</th><th>Earned</th><th>Advances</th><th>Paid</th><th>Closing balance (all time)</th></tr></thead><tbody>
          {emp.map((r) => (<tr key={r.id}><td>{r.name} ({r.code})</td><td>{inr(r.earned)}</td><td>{inr(r.adv)}</td><td>{inr(r.paid)}</td><td className="font-medium">{inr(bmap[r.id])}</td></tr>))}</tbody>
          <tfoot><tr className="font-semibold"><td>Total</td><td>{inr(T('earned'))}</td><td>{inr(T('adv'))}</td><td>{inr(T('paid'))}</td><td>{inr(bal.reduce((s, x) => s + x.balance, 0))}</td></tr></tfoot></table>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div><h2 className="mb-2 font-semibold text-navy">Item-wise production</h2><div className="card overflow-x-auto p-0"><table className="tbl"><thead><tr><th>Item</th><th>Quantity</th><th>Amount</th></tr></thead><tbody>
          {itemsR.map((r) => (<tr key={r.code}><td>{r.code} {r.name}</td><td>{Number(r.q)}</td><td>{inr(r.a)}</td></tr>))}</tbody></table></div></div>
        <div><h2 className="mb-2 font-semibold text-navy">Daily production</h2><div className="card overflow-x-auto p-0"><table className="tbl"><thead><tr><th>Date</th><th>Pieces</th><th>Amount</th></tr></thead><tbody>
          {days.map((r) => (<tr key={r.d}><td>{r.d}</td><td>{Number(r.q)}</td><td>{inr(r.a)}</td></tr>))}</tbody></table></div></div>
      </div>
    </>
  );
}

export const dynamic = 'force-dynamic';
