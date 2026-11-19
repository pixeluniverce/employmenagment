import Link from 'next/link';
import { balances } from '@/lib/data';
import { inr, today } from '@/lib/db';
import { addEmployee } from '@/app/actions';
import { Head } from '@/components/ui';

export default async function Employees({ searchParams }) {
  const q = (searchParams.q || '').toLowerCase(), st = searchParams.s || '';
  let rows = await balances();
  rows = rows.filter((e) => (!q || e.name.toLowerCase().includes(q) || e.code.toLowerCase().includes(q)) && (!st || (st === 'active') === e.active));
  return (
    <>
      <Head t="Employees" />
      <form className="card mb-4 flex flex-wrap gap-2">
        <input name="q" defaultValue={searchParams.q} placeholder="Search by name or ID" className="inp max-w-xs" />
        <select name="s" defaultValue={st} className="inp max-w-[10rem]"><option value="">All</option><option value="active">Active</option><option value="inactive">Inactive</option></select>
        <button className="btn-o">Search</button>
      </form>
      <details className="card mb-4">
        <summary className="cursor-pointer font-medium text-navy">Add employee</summary>
        <form action={addEmployee} className="mt-3 grid gap-3 md:grid-cols-3">
          <div><label className="lbl">Name</label><input name="name" required className="inp" /></div>
          <div><label className="lbl">Mobile</label><input name="mobile" className="inp" inputMode="tel" /></div>
          <div><label className="lbl">Joining date</label><input name="joining_date" type="date" defaultValue={today()} className="inp" /></div>
          <div className="md:col-span-2"><label className="lbl">Address</label><input name="address" className="inp" /></div>
          <div><label className="lbl">Opening balance (₹, amount already owed)</label><input name="opening_balance" type="number" step="0.01" defaultValue="0" className="inp" /></div>
          <div className="md:col-span-3"><label className="lbl">Notes</label><input name="notes" className="inp" /></div>
          <div><button className="btn">Save employee</button></div>
        </form>
      </details>
      <div className="card overflow-x-auto p-0">
        <table className="tbl">
          <thead><tr><th>ID</th><th>Name</th><th>Mobile</th><th>Total earnings</th><th>Advance</th><th>Paid</th><th>Balance</th><th>Status</th></tr></thead>
          <tbody>
            {rows.map((e) => (
              <tr key={e.id}>
                <td>{e.code}</td>
                <td><Link className="font-medium text-brand" href={`/employees/${e.id}`}>{e.name}</Link></td>
                <td>{e.mobile}</td><td>{inr(e.earned)}</td><td>{inr(e.adv)}</td><td>{inr(e.paid)}</td>
                <td className="font-medium">{inr(e.balance)}</td><td>{e.active ? 'Active' : 'Inactive'}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan="8" className="py-6 text-center text-slate-500">No employees found. Add your first employee above.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

export const dynamic = 'force-dynamic';
