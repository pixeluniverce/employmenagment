import { sql } from './db';
import { splitPool, toPaise } from './split.mjs';
export async function getWeights() {
  const r = await sql`select key, value from business_settings`;
  const m = Object.fromEntries(r.map((x) => [x.key, x.value]));
  return { Present: +(m.weight_present ?? 1), 'Half Day': +(m.weight_half ?? 0.5), Absent: 0, Leave: 0 };
}
export async function loadGroup(id) {
  const [g] = await sql`select id, work_date::text d, name, is_temporary, finalized, undistributed from daily_groups where id=${id}`;
  if (!g) return {};
  const [members, [p], weights] = await Promise.all([
    sql`select m.employee_id, m.status, e.name, e.code from daily_group_members m join employees e on e.id=m.employee_id where m.daily_group_id=${id} order by m.employee_id`,
    sql`select coalesce(sum(i.amount),0) pool from production_batch_items i join production_batches b on b.id=i.batch_id where b.daily_group_id=${id}`,
    getWeights(),
  ]);
  const mm = members.map((m) => ({ ...m, weight: weights[m.status] ?? 0 }));
  const poolPaise = toPaise(p.pool);
  return { g, members: mm, poolPaise, split: splitPool(poolPaise, mm) };
}
