import { sql } from './db';
// Balance = opening + finalized earnings - advances - payments, always computed from records.
export async function balances(id = null) {
  const r = await sql`select e.id, e.code, e.name, e.mobile, e.address, e.joining_date::text as joining_date, e.notes, e.active,
    e.perm_group_id, g.name as gname, e.opening_balance,
    coalesce((select sum(x.share) from employee_daily_distributions x where x.employee_id=e.id),0) earned,
    coalesce((select sum(amount) from employee_advances a where a.employee_id=e.id),0) adv,
    coalesce((select sum(amount) from employee_payments y where y.employee_id=e.id),0) paid
    from employees e left join employee_groups g on g.id=e.perm_group_id
    where (${id}::int is null or e.id=${id}::int) order by e.id`;
  return r.map((x) => ({ ...x, earned: +x.earned, adv: +x.adv, paid: +x.paid, balance: +x.opening_balance + +x.earned - +x.adv - +x.paid }));
}
