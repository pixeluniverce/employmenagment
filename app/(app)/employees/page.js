import Link from 'next/link';
import { balances } from '@/lib/data';
import { sql, inr, today } from '@/lib/db';
import { addEmployee } from '@/app/actions';
import { Head } from '@/components/ui';

export default async function Employees({ searchParams }) {
  const q = (searchParams.q || '').toLowerCase(), st = searchParams.s || '';
  const [all, groups] = await Promise.all([balances(), sql`select id, name from employee_groups where active order by name`]);
  const rows = all.filter((e) => (!q || e.name.toLowerCase().includes(q) || e.code.toLowerCase().includes(q)) && (!st || (st === 'active') === e.active));
  return (
    <>
      <Head t="Employees" />
      <form className="card mb-4 flex flex-wrap gap-2">
        <input name="q" defaultValue={searchParams.q} placeholder="Search by name or ID" className="inp max-w-xs" />
        <select name="s" defaultValue={st} className="inp max-w-[10rem]"><option value="">All</option><option value="active">Active</option><option value="inactive">Inactive / archived</option></select>
        <button className="btn-o">Search</button>
      </form>
      <details className="card mb-4" open={all.length === 0}>
        <summary className="cursor-pointer font-medium text-navy">Add employee</summary>
        <form action={addEmployee} className="mt-3 grid gap-3 md:grid-cols-3">
          <div><label className="lbl">Full name</label><input name="name" required className="inp" /></div>
          <div><label className="lbl">Mobile</label><input name="mobile" className="inp" inputMode="tel" /></div>
          <div><label className="lbl">Joining date</label><input name="joining_date" type="date" defaultValue={today()} className="inp" /></div>
          <div><label className="lbl">Permanent group (reference)</label><select name="perm_group_id" className="inp" defaultValue=""><option value="">None</option>{groups.map((g) => (<option key={g.id} value={g.id}>{g.name}</option>))}</select></div>
          <div className="md:col-span-2"><label className="lbl">Address</label><input name="address" className="inp" /></div>
          <div><label className="lbl">Opening balance (₹ already owed)</label><input name="opening_balance" type="number" step="0.01" defaultValue="0" className="inp" /></div>
          <div className="md:col-span-2"><label className="lbl">Notes</label><input name="notes" className="inp" /></div>
          <div className="flex items-end"><button className="btn">Save employee</button></div>
        </form>
      </details>
      <div className="card overflow-x-auto p-0">
        <table className="tbl">
          <thead><tr><th>ID</th><th>Name</th><th>Mobile</th><th>Perm. group</th><th>Earnings</th><th>Advance</th><th>Paid</th><th>Balance</th><th>Status</th></tr></thead>
          <tbody>
            {rows.map((e) => (
              <tr key={e.id}>
                <td>{e.code}</td><td><Link className="font-medium text-brand" href={`/employees/${e.id}`}>{e.name}</Link></td>
                <td>{e.mobile}</td><td>{e.gname || '–'}</td><td>{inr(e.earned)}</td><td>{inr(e.adv)}</td><td>{inr(e.paid)}</td>
                <td className="font-medium">{inr(e.balance)}</td><td>{e.active ? 'Active' : 'Inactive'}</td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan="9" className="py-6 text-center text-slate-500">No employees found.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

export const dynamic = 'force-dynamic';
