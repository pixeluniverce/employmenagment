'use client';
import { useState } from 'react';
import { saveWork } from '@/app/actions';

export default function WorkForm({ groups, items }) {
  const [rows, setRows] = useState([{ q: '', qty: '' }]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const find = (q) => items.find((i) => `${i.code} – ${i.name}` === q) || items.find((i) => i.code.toLowerCase() === q.trim().toLowerCase());
  const upd = (k, p) => setRows((r) => r.map((x, i) => (i === k ? { ...x, ...p } : x)));
  const lines = rows.map((r) => { const it = find(r.q), qty = +r.qty || 0; return { it, qty, amt: it ? Math.round(qty * it.rate * 100) / 100 : 0 }; });
  const total = lines.reduce((s, l) => s + l.amt, 0);
  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    const fd = new FormData(e.currentTarget);
    const valid = lines.filter((l) => l.it && l.qty > 0).map((l) => ({ item_id: l.it.id, qty: l.qty }));
    if (!valid.length) return setMsg({ ok: false, msg: 'Pick at least one listed item and enter a quantity.' });
    fd.set('rows', JSON.stringify(valid));
    setBusy(true);
    const r = await saveWork(fd);
    setBusy(false); setMsg(r);
    if (r.ok) setRows([{ q: '', qty: '' }]);
  }
  if (!groups.length) return <div className="card text-sm text-slate-600">No open groups for this date. Create groups on the <b>Daily Groups &amp; Attendance</b> page first (finalized groups cannot take more production).</div>;
  return (
    <form onSubmit={submit} className="card space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <div><label className="lbl">Working group</label>
          <select name="daily_group_id" required className="inp" defaultValue={groups.length === 1 ? groups[0].id : ''}><option value="" disabled>Select group</option>
            {groups.map((g) => (<option key={g.id} value={g.id}>{g.name} ({g.working} working of {g.total}){+g.working === 0 ? ' - no eligible employee!' : ''}</option>))}</select></div>
        <div><label className="lbl">Notes (optional)</label><input name="notes" className="inp" /></div>
      </div>
      <datalist id="items">{items.map((i) => (<option key={i.id} value={`${i.code} – ${i.name}`} />))}</datalist>
      <div className="overflow-x-auto">
        <table className="tbl">
          <thead><tr><th>Item (type code or name)</th><th className="w-28">Quantity</th><th>Rate</th><th>Amount</th><th /></tr></thead>
          <tbody>
            {rows.map((r, k) => (
              <tr key={k}>
                <td><input list="items" value={r.q} onChange={(e) => upd(k, { q: e.target.value })} className={`inp min-w-[12rem] ${r.q && !lines[k].it ? 'border-red-400' : ''}`} placeholder="ITM001" autoFocus={k > 0 && k === rows.length - 1} /></td>
                <td><input type="number" min="0" step="any" inputMode="decimal" value={r.qty} onChange={(e) => upd(k, { qty: e.target.value })}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (k === rows.length - 1) setRows((x) => [...x, { q: '', qty: '' }]); } }} className="inp" /></td>
                <td>{lines[k].it ? `₹${lines[k].it.rate}` : '–'}</td>
                <td>₹{lines[k].amt.toLocaleString('en-IN')}</td>
                <td><button type="button" className="text-red-600" onClick={() => setRows((x) => (x.length > 1 ? x.filter((_, i) => i !== k) : x))}>Remove</button></td>
              </tr>
            ))}
          </tbody>
          <tfoot><tr className="font-semibold"><td>Total group production</td><td /><td /><td>₹{total.toLocaleString('en-IN')}</td><td /></tr></tfoot>
        </table>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="btn-o" onClick={() => setRows((x) => [...x, { q: '', qty: '' }])}>Add item row</button>
        <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save production'}</button>
        {msg && <span className={msg.ok ? 'text-green-700' : 'text-red-600'}>{msg.msg}</span>}
      </div>
      <p className="text-xs text-slate-500">Press Enter in a quantity box to add the next row. You can save several batches for the same group and date; they all join that group's pool. Rates are looked up and frozen on the server.</p>
    </form>
  );
}
