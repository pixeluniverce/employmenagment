import Link from 'next/link';
import { inr, today } from '@/lib/db';
import { Head } from '@/components/ui';
import Del from '@/components/Del';
import PrintBtn from '@/components/PrintBtn';

export default function Txn({ title, rows, employees, add, del, emp, receipt, err, overpay }) {
  const total = rows.reduce((s, r) => s + +r.amount, 0);
  return (
    <>
      <Head t={title}><PrintBtn /></Head>
      {err && <p className="mb-3 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">{err}</p>}
      <form action={add} className="card no-print mb-4 grid gap-3 md:grid-cols-3">
        <div><label className="lbl">Employee</label><select name="employee_id" required defaultValue="" className="inp"><option value="" disabled>Select employee</option>{employees.map((e) => (<option key={e.id} value={e.id}>{e.name} ({e.code})</option>))}</select></div>
        <div><label className="lbl">Date</label><input type="date" name="date" defaultValue={today()} required className="inp" /></div>
        <div><label className="lbl">Amount (₹)</label><input type="number" name="amount" min="0.01" step="0.01" required className="inp" /></div>
        <div><label className="lbl">Method</label><select name="method" className="inp"><option>Cash</option><option>UPI</option><option>Bank</option></select></div>
        <div><label className="lbl">Reference number</label><input name="reference" className="inp" /></div>
        <div><label className="lbl">Notes</label><input name="notes" className="inp" /></div>
        {overpay && <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="allow_over" /> Allow overpayment</label>}
        <div><button className="btn">Save {title.toLowerCase().replace(/s$/, '')}</button></div>
      </form>
      <form className="no-print mb-3 flex gap-2">
        <select name="e" defaultValue={emp || ''} className="inp max-w-[14rem]"><option value="">All employees</option>{employees.map((e) => (<option key={e.id} value={e.id}>{e.name}</option>))}</select>
        <button className="btn-o">Filter</button>
      </form>
      <div className="card overflow-x-auto p-0">
        <table className="tbl"><thead><tr><th>Date</th><th>Employee</th><th>Method</th><th>Reference</th><th>Notes</th><th>Amount</th><th className="no-print" /></tr></thead>
          <tbody>
            {rows.map((r) => (<tr key={r.id}><td>{r.d}</td><td>{r.name}</td><td>{r.method}</td><td>{r.reference}</td><td>{r.notes}</td><td>{inr(r.amount)}</td>
              <td className="no-print whitespace-nowrap">{receipt && <Link className="mr-3 text-sm text-brand" href={`/receipt/${r.id}`}>Receipt</Link>}<span className="inline-block"><form action={del}><input type="hidden" name="id" value={r.id} /><Del /></form></span></td></tr>))}
            {!rows.length && <tr><td colSpan="7" className="py-6 text-center text-slate-500">Nothing recorded yet.</td></tr>}
          </tbody>
          <tfoot><tr className="font-semibold"><td colSpan="5">Total</td><td>{inr(total)}</td><td className="no-print" /></tr></tfoot>
        </table>
      </div>
    </>
  );
}
