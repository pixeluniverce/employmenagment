import { sql, today } from '@/lib/db';
import { createDailyGroup, deleteDailyGroup, copyPrevious } from '@/app/actions';
import { Head } from '@/components/ui';
import AssignForm from '@/components/AssignForm';
import Confirm from '@/components/Confirm';

export default async function Assign({ searchParams }) {
  const d = /^\d{4}-\d{2}-\d{2}$/.test(searchParams.d || '') ? searchParams.d : today();
  const [groups, perm, emps] = await Promise.all([
    sql`select id, name, finalized, is_temporary, (select count(*) from daily_group_members m where m.daily_group_id=daily_groups.id) n from daily_groups where work_date=${d}::date order by id`,
    sql`select id, name from employee_groups where active order by name`,
    sql`select e.id, e.code, e.name, m.daily_group_id g, m.status s, coalesce(x.finalized,false) locked
      from employees e left join daily_group_members m on m.employee_id=e.id and m.work_date=${d}::date
      left join daily_groups x on x.id=m.daily_group_id where e.active order by e.name`,
  ]);
  return (
    <>
      <Head t="Daily groups & attendance" />
      <form className="card mb-4 flex flex-wrap items-end gap-2">
        <div><label className="lbl">Working date</label><input type="date" name="d" defaultValue={d} className="inp" /></div>
        <button className="btn-o">Open date</button>
      </form>
      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-2 font-semibold text-navy">1. Groups for {d}</h2>
          <form action={createDailyGroup} className="grid gap-2 md:grid-cols-2">
            <input type="hidden" name="date" value={d} />
            <div><label className="lbl">Group name</label><input name="name" required className="inp" placeholder="Group A / Temp 1" /></div>
            <div><label className="lbl">Copy members from permanent group</label><select name="perm_group_id" className="inp" defaultValue=""><option value="">Blank (choose employees below)</option>{perm.map((g) => (<option key={g.id} value={g.id}>{g.name}</option>))}</select></div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="temp" /> Temporary group</label>
            <div><button className="btn">Create group</button></div>
          </form>
          <form action={copyPrevious} className="mt-2"><input type="hidden" name="date" value={d} /><button className="btn-o">Copy previous day's groups and members</button></form>
          <ul className="mt-3 space-y-1 text-sm">
            {groups.map((g) => (<li key={g.id} className="flex items-center justify-between rounded border border-slate-200 px-3 py-2"><span>{g.name} {g.is_temporary && <em className="text-slate-500">(temporary)</em>} · {g.n} employees · {g.finalized ? 'Finalized' : 'Open'}</span>
              {!g.finalized && <form action={deleteDailyGroup}><input type="hidden" name="id" value={g.id} /><Confirm className="text-red-600 hover:underline" msg="Delete this group for this date, including its members and production?">Delete</Confirm></form>}</li>))}
            {!groups.length && <li className="text-slate-500">No groups for this date yet. Create one above.</li>}
          </ul>
        </div>
        <div className="card text-sm text-slate-600"><h2 className="mb-2 font-semibold text-navy">How to use</h2>
          <ol className="list-decimal space-y-1 pl-5"><li>Pick the date and create the day's groups (or copy yesterday).</li><li>In the table below, put each employee into a group and set attendance.</li><li>Save, then enter production on <b>Daily Production</b>.</li><li>Review and finalize on <b>Earnings Distribution</b>.</li></ol>
          <p className="mt-2">Finalized groups are locked, so moving people later never changes old earnings.</p></div>
      </div>
      <h2 className="mb-2 font-semibold text-navy">2. Assign employees and mark attendance</h2>
      <AssignForm key={d + groups.map((g) => g.id).join()} date={d} groups={groups} employees={emps} />
    </>
  );
}

export const dynamic = 'force-dynamic';
