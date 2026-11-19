import Link from 'next/link';
import { sql, inr, today } from '@/lib/db';
import { balances } from '@/lib/data';
import { Stat, Head } from '@/components/ui';

export default async function Dashboard() {
  const t = today(), m1 = t.slice(0, 7) + '-01';
  const [[c], [pt], [pm], [em], [tx], daily, gm, tg, leave, ra, rp, rb, emps] = await Promise.all([
    sql`select count(*) total, count(*) filter (where active) active from employees`,
    sql`select coalesce(sum(i.amount),0) a from production_batch_items i join production_batches b on b.id=i.batch_id join daily_groups g on g.id=b.daily_group_id where g.work_date=${t}::date`,
    sql`select coalesce(sum(i.amount),0) a from production_batch_items i join production_batches b on b.id=i.batch_id join daily_groups g on g.id=b.daily_group_id where g.work_date>=${m1}::date and g.work_date<(${m1}::date + interval '1 month')`,
    sql`select coalesce(sum(case when work_date=${t}::date then share end),0) td, coalesce(sum(case when work_date>=${m1}::date and work_date<(${m1}::date + interval '1 month') then share end),0) mo from employee_daily_distributions`,
    sql`select (select count(*) from employee_groups where active) groups, (select count(*) from items where active) items, (select coalesce(sum(amount),0) from employee_advances) adv, (select coalesce(sum(amount),0) from employee_payments) paid`,
    sql`select g.work_date::text d, sum(i.amount) a from production_batch_items i join production_batches b on b.id=i.batch_id join daily_groups g on g.id=b.daily_group_id where g.work_date>(${t}::date - 14) group by g.work_date order by g.work_date`,
    sql`select g.name, sum(i.amount) a from production_batch_items i join production_batches b on b.id=i.batch_id join daily_groups g on g.id=b.daily_group_id where g.work_date>=${m1}::date and g.work_date<(${m1}::date + interval '1 month') group by g.name order by a desc limit 8`,
    sql`select g.name, g.finalized, count(m.id) n from daily_groups g left join daily_group_members m on m.daily_group_id=g.id where g.work_date=${t}::date group by g.id order by g.id`,
    sql`select e.name, m.status from daily_group_members m join employees e on e.id=m.employee_id where m.work_date=${t}::date and m.status in ('Leave','Absent') order by e.name`,
    sql`select a.tx_date::text d, e.name, a.amount from employee_advances a join employees e on e.id=a.employee_id order by a.id desc limit 5`,
    sql`select a.tx_date::text d, e.name, a.amount from employee_payments a join employees e on e.id=a.employee_id order by a.id desc limit 5`,
    sql`select b.id, g.work_date::text d, g.name, sum(i.amount) a from production_batches b join daily_groups g on g.id=b.daily_group_id join production_batch_items i on i.batch_id=b.id group by b.id, g.work_date, g.name order by b.id desc limit 5`,
    balances(),
  ]);
  const pending = emps.reduce((s, e) => s + e.balance, 0);
  const top = [...emps].sort((a, b) => b.earned - a.earned).slice(0, 5);
  const max = Math.max(1, ...daily.map((x) => +x.a));
  const List = ({ rows }) => (<table className="tbl"><tbody>{rows.map((r, i) => (<tr key={i}><td>{r.d}</td><td>{r.name}</td><td className="text-right">{inr(r.amount ?? r.a)}</td></tr>))}{!rows.length && <tr><td className="text-slate-500">Nothing yet</td></tr>}</tbody></table>);
  return (
    <>
      <Head t="Dashboard">
        <Link href="/employees" className="btn-o">Add employee</Link>
        <Link href="/groups" className="btn-o">Create group</Link>
        <Link href="/assign" className="btn-o">Assign groups / attendance</Link>
        <Link href="/work" className="btn">Add production</Link>
        <Link href="/advances" className="btn-o">Add advance</Link>
        <Link href="/payments" className="btn-o">Record payment</Link>
        <Link href="/reports" className="btn-o">Reports</Link>
      </Head>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat l="Total employees" v={c.total} /><Stat l="Active employees" v={c.active} />
        <Stat l="Active groups" v={tx.groups} /><Stat l="Production items" v={tx.items} />
        <Stat l="Today's production" v={inr(pt.a)} /><Stat l="Today's earnings (finalized)" v={inr(em.td)} />
        <Stat l="Month production" v={inr(pm.a)} /><Stat l="Month earnings (finalized)" v={inr(em.mo)} />
        <Stat l="Total advances" v={inr(tx.adv)} /><Stat l="Total payments" v={inr(tx.paid)} />
        <div className="card col-span-2 border-brand"><div className="text-xs text-slate-500">Pending employee balances</div><div className="text-2xl font-semibold text-brand">{inr(pending)}</div></div>
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="card"><h2 className="mb-3 font-semibold text-navy">Daily production (last 14 days)</h2>
          {!daily.length && <p className="text-sm text-slate-500">No production yet.</p>}
          <div className="flex h-40 items-end gap-1">{daily.map((x) => (<div key={x.d} className="flex flex-1 flex-col items-center justify-end" title={`${x.d}: ${inr(x.a)}`}><div className="w-full rounded-t bg-brand" style={{ height: `${Math.max(4, (+x.a / max) * 100)}%` }} /><span className="mt-1 text-[10px] text-slate-500">{x.d.slice(8)}</span></div>))}</div></div>
        <div className="card"><h2 className="mb-3 font-semibold text-navy">Group-wise production (this month)</h2>
          <table className="tbl"><tbody>{gm.map((g) => (<tr key={g.name}><td>{g.name}</td><td className="text-right">{inr(g.a)}</td></tr>))}{!gm.length && <tr><td className="text-slate-500">No production this month</td></tr>}</tbody></table></div>
        <div className="card"><h2 className="mb-3 font-semibold text-navy">Today's working groups</h2>
          <table className="tbl"><tbody>{tg.map((g) => (<tr key={g.name}><td>{g.name}</td><td>{g.n} employees</td><td>{g.finalized ? 'Finalized' : 'Open'}</td></tr>))}{!tg.length && <tr><td className="text-slate-500">No groups created for today. <Link className="text-brand" href="/assign">Create them</Link></td></tr>}</tbody></table>
          <h3 className="mb-1 mt-4 text-sm font-semibold text-navy">On leave / absent today</h3>
          <p className="text-sm text-slate-600">{leave.length ? leave.map((l) => `${l.name} (${l.status})`).join(', ') : 'None marked'}</p></div>
        <div className="card"><h2 className="mb-3 font-semibold text-navy">Top earners (lifetime)</h2>
          <table className="tbl"><tbody>{top.map((e) => (<tr key={e.id}><td><Link className="text-brand" href={`/employees/${e.id}`}>{e.name}</Link></td><td className="text-right">{inr(e.earned)}</td></tr>))}</tbody></table></div>
        <div className="card"><h2 className="mb-2 font-semibold text-navy">Recent production</h2><List rows={rb} /></div>
        <div className="card"><h2 className="mb-2 font-semibold text-navy">Recent advances</h2><List rows={ra} /><h2 className="mb-2 mt-4 font-semibold text-navy">Recent payments</h2><List rows={rp} /></div>
      </div>
    </>
  );
}

export const dynamic = 'force-dynamic';
