import Link from 'next/link';
import { notFound } from 'next/navigation';
import { sql, inr, today } from '@/lib/db';
import { balances } from '@/lib/data';
import { updateEmployee, deleteEmployee, deleteEntry, deleteAdvance, deletePayment } from '@/app/actions';
import { Stat, Head } from '@/components/ui';
import Del from '@/components/Del';
import PrintBtn from '@/components/PrintBtn';

const tabs = [['overview', 'Overview'], ['daily', 'Daily work'], ['items', 'Item production'], ['adv', 'Advance history'], ['pay', 'Payment history'], ['monthly', 'Monthly statements']];
const DelForm = ({ action, id }) => (<form action={action}><input type="hidden" name="id" value={id} /><Del /></form>);

export default async function Profile({ params, searchParams }) {
  const id = +params.id, tab = searchParams.tab || 'overview';
  const [e] = await balances(id);
  if (!e) notFound();
  const t = today(), m1 = t.slice(0, 7) + '-01';
  const [[td], [mo]] = await Promise.all([
    sql`select coalesce(sum(i.amount),0) a from production_entry_items i join production_entries p on p.id=i.entry_id where p.employee_id=${id} and p.work_date=${t}::date`,
    sql`select coalesce(sum(i.amount),0) a from production_entry_items i join production_entries p on p.id=i.entry_id where p.employee_id=${id} and p.work_date>=${m1}::date and p.work_date<(${m1}::date + interval '1 month')`,
  ]);
  let rows = [];
  if (tab === 'daily' || tab === 'overview')
    rows = await sql`select p.id, p.work_date::text d, sum(i.qty) q, sum(i.amount) a from production_entries p join production_entry_items i on i.entry_id=p.id where p.employee_id=${id} group by p.id order by p.work_date desc, p.id desc limit ${tab === 'overview' ? 5 : 200}`;
  if (tab === 'items')
    rows = await sql`select it.code, it.name, sum(i.qty) q, sum(i.amount) a from production_entry_items i join production_entries p on p.id=i.entry_id join items it on it.id=i.item_id where p.employee_id=${id} group by it.id order by a desc`;
  if (tab === 'adv') rows = await sql`select id, tx_date::text d, amount, method, reference, notes from employee_advances where employee_id=${id} order by tx_date desc, id desc`;
  if (tab === 'pay') rows = await sql`select id, tx_date::text d, amount, method, reference, notes from employee_payments where employee_id=${id} order by tx_date desc, id desc`;
  if (tab === 'monthly')
    rows = await sql`select m, sum(e) e, sum(a) a, sum(p) p from (
      select to_char(p.work_date,'YYYY-MM') m, i.amount e, 0 a, 0 p from production_entry_items i join production_entries p on p.id=i.entry_id where p.employee_id=${id}
      union all select to_char(tx_date,'YYYY-MM'), 0, amount, 0 from employee_advances where employee_id=${id}
      union all select to_char(tx_date,'YYYY-MM'), 0, 0, amount from employee_payments where employee_id=${id}) t group by m order by m desc`;
  return (
    <>
      <Head t={`${e.name} (${e.code})`}>
        <PrintBtn label="Print statement" />
        <Link href="/work" className="btn no-print">Add work</Link>
      </Head>
      <p className="mb-4 text-sm text-slate-600">{e.mobile} {e.address && `· ${e.address}`} · Joined {String(e.joining_date).slice(0, 10)} · {e.active ? 'Active' : 'Inactive'}</p>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat l="Today's earnings" v={inr(td.a)} /><Stat l="This month" v={inr(mo.a)} />
        <Stat l="Lifetime earnings" v={inr(e.earned)} /><Stat l="Total advances" v={inr(e.adv)} />
        <Stat l="Total paid" v={inr(e.paid)} /><Stat l="Opening balance" v={inr(e.opening_balance)} />
        <div className="card col-span-2 border-brand"><div className="text-xs text-slate-500">Pending balance</div><div className="text-2xl font-semibold text-brand">{inr(e.balance)}</div></div>
      </div>
      <div className="no-print mt-6 flex gap-1 overflow-x-auto border-b border-slate-200">
        {tabs.map(([k, l]) => (<Link key={k} href={`?tab=${k}`} className={`whitespace-nowrap px-3 py-2 text-sm ${tab === k ? 'border-b-2 border-brand font-medium text-brand' : 'text-slate-600'}`}>{l}</Link>))}
      </div>
      <div className="card mt-4 overflow-x-auto p-0">
        {(tab === 'overview' || tab === 'daily') && (<table className="tbl"><thead><tr><th>Date</th><th>Pieces</th><th>Amount</th><th /></tr></thead><tbody>
          {rows.map((r) => (<tr key={r.id}><td>{r.d}</td><td>{Number(r.q)}</td><td>{inr(r.a)}</td><td className="no-print"><DelForm action={deleteEntry} id={r.id} /></td></tr>))}
          {!rows.length && <tr><td colSpan="4" className="py-6 text-center text-slate-500">No work saved yet.</td></tr>}</tbody></table>)}
        {tab === 'items' && (<table className="tbl"><thead><tr><th>Code</th><th>Item</th><th>Quantity</th><th>Earned</th></tr></thead><tbody>
          {rows.map((r) => (<tr key={r.code}><td>{r.code}</td><td>{r.name}</td><td>{Number(r.q)}</td><td>{inr(r.a)}</td></tr>))}</tbody></table>)}
        {(tab === 'adv' || tab === 'pay') && (<table className="tbl"><thead><tr><th>Date</th><th>Amount</th><th>Method</th><th>Reference</th><th>Notes</th><th /></tr></thead><tbody>
          {rows.map((r) => (<tr key={r.id}><td>{r.d}</td><td>{inr(r.amount)}</td><td>{r.method}</td><td>{r.reference}</td><td>{r.notes}</td><td className="no-print">{tab === 'pay' && <Link className="mr-3 text-sm text-brand" href={`/receipt/${r.id}`}>Receipt</Link>}<span className="inline-block"><DelForm action={tab === 'adv' ? deleteAdvance : deletePayment} id={r.id} /></span></td></tr>))}</tbody></table>)}
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
          <div className="md:col-span-2"><label className="lbl">Address</label><input name="address" defaultValue={e.address || ''} className="inp" /></div>
          <div><label className="lbl">Notes</label><input name="notes" defaultValue={e.notes || ''} className="inp" /></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={e.active} /> Active</label>
          <div className="flex items-center gap-4"><button className="btn">Save changes</button></div>
        </form>
        <form action={deleteEmployee} className="mt-4"><input type="hidden" name="id" value={e.id} /><Del msg={`Delete ${e.name} and ALL their work, advances and payments? This cannot be undone. Consider marking them Inactive instead.`}>Delete employee</Del></form>
      </details>
    </>
  );
}

export const dynamic = 'force-dynamic';
