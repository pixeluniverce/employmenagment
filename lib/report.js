import { sql } from './db';
// Per-employee monthly statement. a = 'YYYY-MM-01'
export async function empSummary(a) {
  const r = await sql`select e.id, e.code, e.name,
    e.opening_balance
      + coalesce((select sum(share) from employee_daily_distributions x where x.employee_id=e.id and x.work_date<${a}::date),0)
      - coalesce((select sum(amount) from employee_advances x where x.employee_id=e.id and x.tx_date<${a}::date),0)
      - coalesce((select sum(amount) from employee_payments x where x.employee_id=e.id and x.tx_date<${a}::date),0) opening,
    coalesce((select sum(share) from employee_daily_distributions x where x.employee_id=e.id and x.work_date>=${a}::date and x.work_date<(${a}::date + interval '1 month')),0) earned,
    coalesce((select sum(amount) from employee_advances x where x.employee_id=e.id and x.tx_date>=${a}::date and x.tx_date<(${a}::date + interval '1 month')),0) adv,
    coalesce((select sum(amount) from employee_payments x where x.employee_id=e.id and x.tx_date>=${a}::date and x.tx_date<(${a}::date + interval '1 month')),0) paid
    from employees e order by e.id`;
  return r.map((x) => ({ ...x, opening: +x.opening, earned: +x.earned, adv: +x.adv, paid: +x.paid, closing: +x.opening + +x.earned - +x.adv - +x.paid }));
}
