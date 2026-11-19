import { sql, today } from '@/lib/db';
import { balances } from '@/lib/data';
export async function GET(req) {
  const p = new URL(req.url).searchParams.get('m');
  const m = /^\d{4}-\d{2}$/.test(p || '') ? p : today().slice(0, 7), a = m + '-01';
  const [rows, bal] = await Promise.all([
    sql`select e.id, e.code, e.name,
      coalesce((select sum(i.amount) from production_entry_items i join production_entries p on p.id=i.entry_id where p.employee_id=e.id and p.work_date>=${a}::date and p.work_date<(${a}::date + interval '1 month')),0) earned,
      coalesce((select sum(amount) from employee_advances x where x.employee_id=e.id and x.tx_date>=${a}::date and x.tx_date<(${a}::date + interval '1 month')),0) adv,
      coalesce((select sum(amount) from employee_payments x where x.employee_id=e.id and x.tx_date>=${a}::date and x.tx_date<(${a}::date + interval '1 month')),0) paid
      from employees e order by e.id`,
    balances(),
  ]);
  const b = Object.fromEntries(bal.map((x) => [x.id, x.balance]));
  const csv = 'Employee ID,Name,Earned,Advances,Paid,Closing Balance\n' + rows.map((r) => [r.code, `"${r.name.replace(/"/g, '""')}"`, r.earned, r.adv, r.paid, b[r.id]].join(',')).join('\n');
  return new Response(csv, { headers: { 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename=report-${m}.csv` } });
}

export const dynamic = 'force-dynamic';
