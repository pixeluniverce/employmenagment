import Link from 'next/link';
import { notFound } from 'next/navigation';
import { sql, inr, today } from '@/lib/db';
import { balances } from '@/lib/data';
import { updateEmployee, deleteEmployee, deleteAdvance, deletePayment } from '@/app/actions';
import { Stat, Head } from '@/components/ui';
import Del from '@/components/Del';
import PrintBtn from '@/components/PrintBtn';

const tabs = [['overview', 'Overview'], ['earn', 'Daily earnings'], ['att', 'Attendance'], ['adv', 'Advance history'], ['pay', 'Payment history'], ['monthly', 'Monthly statements']];
const DelForm = ({ action, id }) => (<form action={action}><input type="hidden" name="id" value={id} /><Del /></form>);

export default async function Profile({ params, searchParams }) {
  const id = +params.id, tab = searchParams.tab || 'overview';
  const [e] = await balances(id);
  if (!e) notFound();
  const t = today(), m1 = t.slice(0, 7) + '-01';
  const [[s], groups] = await Promise.all([
    sql`select coalesce(sum(share) filter (where work_date=${t}::date),0) td,
      coalesce(sum(share) filter (where work_date>=date_trunc('week',${t}::date)::date),0) wk,
      coalesce(sum(share) filter (where work_date>=${m1}::date),0) mo,
      coalesce(sum(share) filter (where work_date>=(${m1}::date - interval '1 month') and work_date<${m1}::date),0) pm
      from employee_daily_distributions where employee_id=${id}`,
    sql`select id, name from employee_groups where active order by name`,
  ]);
  let rows = [];
  if (tab === 'earn' || tab === 'overview')
    rows = await sql`select x.work_date::text d, g.name gname, x.pool, x.status, x.share from employee_daily_distributions x join daily_groups g on g.id=x.daily_group_id where x.employee_id=${id} order by x.work_date desc, x.id desc limit ${tab === 'overview' ? 5 : 300}`;
  if (tab === 'att') rows = await sql`select m.work_date::text d, g.name gname, m.status, g.finalized from daily_group_members m join daily_groups g on g.id=m.daily_group_id where m.employee_id=${id} order by m.work_date desc limit 300`;
  if (tab === 'adv') rows = await sql`select id, tx_date::text d, amount, method, reference, notes from employee_advances where employee_id=${id} order by tx_date desc, id desc`;
  if (tab === 'pay') rows = await sql`select id, tx_date::text d, amount, method, reference, notes from employee_payments where employee_id=${id} order by tx_date desc, id desc`;
  if (tab === 'monthly')
    rows = await sql`select m, sum(e) e, sum(a) a, sum(p) p from (
      select to_char(work_date,'YYYY-MM') m, share e, 0 a, 0 p from employee_daily_distributions where employee_id=${id}
      union all select to_char(tx_date,'YYYY-MM'), 0, amount, 0 from employee_advances where employee_id=${id}
      union all select to_char(tx_date,'YYYY-MM'), 0, 0, amount from employee_payments where employee_id=${id}) t group by m order by m desc`;
  return (
    <>
      <Head t={`${e.name} (${e.code})`}><PrintBtn label="Print statement" /></Head>
      <p className="mb-4 text-sm text-slate-600">{e.mobile} {e.address && `· ${e.address}`} · Joined {e.joining_date} · {e.active ? 'Active' : 'Inactive'} · Permanent group: {e.gname || 'none'}</p>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat l="Today's earnings" v={inr(s.td)} /><Stat l="This week" v={inr(s.wk)} /><Stat l="This month" v={inr(s.mo)} /><Stat l="Previous month" v={inr(s.pm)} />
        <Stat l="Lifetime earnings" v={inr(e.earned)} /><Stat l="Total advances" v={inr(e.adv)} /><Stat l="Total payments" v={inr(e.paid)} /><Stat l="Opening balance" v={inr(e.opening_balance)} />
        <div className="card col-span-2 border-brand"><div className="text-xs text-slate-500">Outstanding balance</div><div className="text-2xl font-semibold text-brand">{inr(e.balance)}</div></div>
      </div>
      <div className="no-print mt-6 flex gap-1 overflow-x-auto border-b border-slate-200">
        {tabs.map(([k, l]) => (<Link key={k} href={`?tab=${k}`} className={`whitespace-nowrap px-3 py-2 text-sm ${tab === k ? 'border-b-2 border-brand font-medium text-brand' : 'text-slate-600'}`}>{l}</Link>))}
      </div>
      <div className="card mt-4 overflow-x-auto p-0">
        {(tab === 'overview' || tab === 'earn') && (<table className="tbl"><thead><tr><th>Date</th><th>Group</th><th>Group production</th><th>Attendance</th><th>Earnings</th></tr></thead><tbody>
          {rows.map((r, i) => (<tr key={i}><td>{r.d}</td><td>{r.gname}</td><td>{inr(r.pool)}</td><td>{r.status}</td><td>{inr(r.share)}</td></tr>))}
          {!rows.length && <tr><td colSpan="5" className="py-6 text-center text-slate-500">No finalized earnings yet.</td></tr>}</tbody></table>)}
        {tab === 'att' && (<table className="tbl"><thead><tr><th>Date</th><th>Daily group</th><th>Status</th><th>Finalized</th></tr></thead><tbody>
          {rows.map((r, i) => (<tr key={i}><td>{r.d}</td><td>{r.gname}</td><td>{r.status}</td><td>{r.finalized ? 'Yes' : 'No'}</td></tr>))}</tbody></table>)}
        {(tab === 'adv' || tab === 'pay') && (<table className="tbl"><thead><tr><th>Date</th><th>Amount</th><th>Method</th><th>Reference</th><th>Notes</th><th /></tr></thead><tbody>
          {rows.map((r) => (<tr key={r.id}><td>{r.d}</td><td>{inr(r.amount)}</td><td>{r.method}</td><td>{r.reference}</td><td>{r.notes}</td><td className="no-print whitespace-nowrap">{tab === 'pay' && <Link className="mr-3 text-sm text-brand" href={`/receipt/${r.id}`}>Receipt</Link>}<span className="inline-block"><DelForm action={tab === 'adv' ? deleteAdvance : deletePayment} id={r.id} /></span></td></tr>))}</tbody></table>)}
        {tab === 'monthly' && (<table className="tbl"><thead><tr><th>Month</th><th>Earned</th><th>Advances</th><th>Payments</th><th>Net for month</th></tr></thead><tbody>
          {rows.map((r) => (<tr key={r.m}><td>{r.m}</td><td>{inr(r.e)}</td><td>{inr(r.a)}</td><td>{inr(r.p)}</td><td>{inr(+r.e - +r.a - +r.p)}</td></tr>))}</tbody></table>)}
      </div>
      <details className="card no-print mt-6">
        <summary className="cursor-pointer font-medium text-navy">Edit employee</summary>
        <form action={updateEmployee} className="mt-3 grid gap-3 md:grid-cols-3">
          <input type="hidden" name="id" value={e.id} />
          <div><label className="lbl">Name</label><input name="name" defaultValue={e.name} required className="inp" /></div>
          <div><label className="lbl">Mobile</label><input name="mobile" defaultValue={e.mobile || ''} className="inp" /></div>
          <div><label className="lbl">Opening balance</label><input name="opening_balance" type="number" step="0.01" defaultValue={e.opening_balance} className="inp" /></div>
          <div><label className="lbl">Permanent group</label><select name="perm_group_id" defaultValue={e.perm_group_id || ''} className="inp"><option value="">None</option>{groups.map((g) => (<option key={g.id} value={g.id}>{g.name}</option>))}</select></div>
          <div className="md:col-span-2"><label className="lbl">Address</label><input name="address" defaultValue={e.address || ''} className="inp" /></div>
          <div className="md:col-span-2"><label className="lbl">Notes</label><input name="notes" defaultValue={e.notes || ''} className="inp" /></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={e.active} /> Active</label>
          <div><button className="btn">Save changes</button></div>
        </form>
        <form action={deleteEmployee} className="mt-4"><input type="hidden" name="id" value={e.id} /><Del msg="Remove this employee? If they have any work, advance or payment history they will be archived (set inactive) instead of deleted.">Remove / archive employee</Del></form>
      </details>
    </>
  );
}

export const dynamic = 'force-dynamic';
