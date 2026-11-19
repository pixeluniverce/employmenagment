'use client';
import { useState } from 'react';
import { saveAssign } from '@/app/actions';
const ST = ['Present', 'Half Day', 'Absent', 'Leave'];

export default function AssignForm({ date, groups, employees }) {
  const [rows, setRows] = useState(employees.map((e) => ({ ...e, g: e.g ? String(e.g) : '', s: e.s || 'Present' })));
  const [q, setQ] = useState('');
  const [sel, setSel] = useState({});
  const [bulkG, setBulkG] = useState('');
  const open = groups.filter((g) => !g.finalized);
  const set = (id, p) => setRows((r) => r.map((x) => (x.id === id && !x.locked ? { ...x, ...p } : x)));
  const allStatus = (s) => setRows((r) => r.map((x) => (x.locked ? x : { ...x, s })));
  const shown = rows.filter((x) => !q || x.name.toLowerCase().includes(q.toLowerCase()) || x.code.toLowerCase().includes(q.toLowerCase()));
  const unassigned = rows.filter((x) => !x.g).length;
  const gname = (id) => groups.find((g) => String(g.id) === String(id))?.name || '';
  return (
    <form action={saveAssign} className="card space-y-3">
      <input type="hidden" name="date" value={date} />
      <div className="flex flex-wrap items-center gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search employee" className="inp max-w-[12rem]" />
        <button type="button" className="btn-o" onClick={() => allStatus('Present')}>All present</button>
        <button type="button" className="btn-o" onClick={() => allStatus('Absent')}>All absent</button>
        <button type="button" className="btn-o" onClick={() => setSel(Object.fromEntries(shown.filter((x) => !x.locked).map((x) => [x.id, true])))}>Select all</button>
        <button type="button" className="btn-o" onClick={() => setSel({})}>Deselect all</button>
        <select value={bulkG} onChange={(e) => setBulkG(e.target.value)} className="inp max-w-[12rem]"><option value="">Bulk: choose group</option><option value="none">Remove from group</option>{open.map((g) => (<option key={g.id} value={g.id}>{g.name}</option>))}</select>
        <button type="button" className="btn-o" disabled={!bulkG} onClick={() => setRows((r) => r.map((x) => (sel[x.id] && !x.locked ? { ...x, g: bulkG === 'none' ? '' : bulkG } : x)))}>Assign selected</button>
      </div>
      {unassigned > 0 && <p className="text-sm text-amber-700">{unassigned} employee(s) are not in any group for this date. They will earn nothing.</p>}
      <div className="overflow-x-auto">
        <table className="tbl">
          <thead><tr><th /><th>Employee</th><th>Daily group</th><th>Attendance</th></tr></thead>
          <tbody>
            {shown.map((x) => (
              <tr key={x.id}>
                <td><input type="checkbox" disabled={x.locked} checked={!!sel[x.id]} onChange={(e) => setSel((s) => ({ ...s, [x.id]: e.target.checked }))} /></td>
                <td>{x.name} <span className="text-xs text-slate-500">{x.code}</span></td>
                <td>{x.locked ? <span className="text-sm">{gname(x.g)} (finalized, locked)</span> :
                  <select name={`g_${x.id}`} value={x.g} onChange={(e) => set(x.id, { g: e.target.value })} className="inp min-w-[10rem]"><option value="">Not working today</option>{open.map((g) => (<option key={g.id} value={g.id}>{g.name}</option>))}</select>}</td>
                <td>{x.locked ? <span className="text-sm">{x.s}</span> :
                  <select name={`s_${x.id}`} value={x.s} onChange={(e) => set(x.id, { s: e.target.value })} className="inp min-w-[8rem]">{ST.map((s) => (<option key={s}>{s}</option>))}</select>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button className="btn">Save assignments and attendance</button>
      <p className="text-xs text-slate-500">An employee can be in only one group per date. Leave and Absent employees receive no share.</p>
    </form>
  );
}
