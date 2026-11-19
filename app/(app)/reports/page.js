import { sql, inr, today } from '@/lib/db';
import { Head } from '@/components/ui';
import PrintBtn from '@/components/PrintBtn';
import { empSummary } from '@/lib/report';

export default async function Reports({ searchParams }) {
  const m = /^\d{4}-\d{2}$/.test(searchParams.m || '') ? searchParams.m : today().slice(0, 7);
  const a = m + '-01';
  const [emp, grp, itemsR, att, days] = await Promise.all([
    empSummary(a),
    sql`select d.name, coalesce(sum(p.amt),0) prod, coalesce(sum(s.amt),0) dist from daily_groups d
      left join lateral (select sum(i.amount) amt from production_batch_items i join production_batches b on b.id=i.batch_id where b.daily_group_id=d.id) p on true
      left join lateral (select sum(share) amt from employee_daily_distributions x where x.daily_group_id=d.id) s on true
      where d.work_date>=${a}::date and d.work_date<(${a}::date + interval '1 month') group by d.name order by d.name`,
    sql`select it.code, it.name, sum(i.qty) q, sum(i.amount) a from production_batch_items i join production_batches b on b.id=i.batch_id join daily_groups g on g.id=b.daily_group_id join items it on it.id=i.item_id where g.work_date>=${a}::date and g.work_date<(${a}::date + interval '1 month') group by it.id order by a desc`,
    sql`select e.name, count(*) filter (where m.status='Present') pr, count(*) filter (where m.status='Half Day') hd, count(*) filter (where m.status='Absent') ab, count(*) filter (where m.status='Leave') lv
      from daily_group_members m join employees e on e.id=m.employee_id where m.work_date>=${a}::date and m.work_date<(${a}::date + interval '1 month') group by e.id order by e.name`,
    sql`select g.work_date::text d, sum(i.amount) a from production_batch_items i join production_batches b on b.id=i.batch_id join daily_groups g on g.id=b.daily_group_id where g.work_date>=${a}::date and g.work_date<(${a}::date + interval '1 month') group by g.work_date order by g.work_date`,
  ]);
  const T = (k) => emp.reduce((s, r) => s + r[k], 0);
  const Tbl = ({ h, children }) => (<div className="card overflow-x-auto p-0"><table className="tbl"><thead><tr>{h.map((x) => (<th key={x}>{x}</th>))}</tr></thead><tbody>{children}</tbody></table></div>);
  return (
    <>
      <Head t={`Monthly settlement and reports: ${m}`}>
        <PrintBtn />
        <a className="btn-o no-print" href={`/reports/csv?m=${m}`}>Export Excel (CSV)</a>
      </Head>
      <form className="card no-print mb-4 flex gap-2"><input type="month" name="m" defaultValue={m} className="inp max-w-[12rem]" /><button className="btn-o">Show month</button></form>
      <h2 className="mb-2 font-semibold text-navy">Employee statement (finalized earnings only)</h2>
      <div className="card mb-6 overflow-x-auto p-0">
        <table className="tbl"><thead><tr><th>Employee</th><th>Opening</th><th>Earnings</th><th>Advances</th><th>Payments</th><th>Closing balance</th></tr></thead><tbody>
          {emp.map((r) => (<tr key={r.id}><td>{r.name} ({r.code})</td><td>{inr(r.opening)}</td><td>{inr(r.earned)}</td><td>{inr(r.adv)}</td><td>{inr(r.paid)}</td><td className="font-medium">{inr(r.closing)}</td></tr>))}</tbody>
          <tfoot><tr className="font-semibold"><td>Total</td><td>{inr(T('opening'))}</td><td>{inr(T('earned'))}</td><td>{inr(T('adv'))}</td><td>{inr(T('paid'))}</td><td>{inr(T('closing'))}</td></tr></tfoot></table>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div><h2 className="mb-2 font-semibold text-navy">Group-wise production and earnings</h2><Tbl h={['Group', 'Production', 'Distributed']}>{grp.map((r) => (<tr key={r.name}><td>{r.name}</td><td>{inr(r.prod)}</td><td>{inr(r.dist)}</td></tr>))}</Tbl></div>
        <div><h2 className="mb-2 font-semibold text-navy">Item-wise production</h2><Tbl h={['Item', 'Quantity', 'Amount']}>{itemsR.map((r) => (<tr key={r.code}><td>{r.code} {r.name}</td><td>{Number(r.q)}</td><td>{inr(r.a)}</td></tr>))}</Tbl></div>
        <div><h2 className="mb-2 font-semibold text-navy">Attendance summary</h2><Tbl h={['Employee', 'Present', 'Half day', 'Absent', 'Leave']}>{att.map((r) => (<tr key={r.name}><td>{r.name}</td><td>{r.pr}</td><td>{r.hd}</td><td>{r.ab}</td><td>{r.lv}</td></tr>))}</Tbl></div>
        <div><h2 className="mb-2 font-semibold text-navy">Daily production</h2><Tbl h={['Date', 'Production']}>{days.map((r) => (<tr key={r.d}><td>{r.d}</td><td>{inr(r.a)}</td></tr>))}</Tbl></div>
      </div>
    </>
  );
}

export const dynamic = 'force-dynamic';
