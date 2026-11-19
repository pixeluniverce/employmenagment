'use server';
import { sql } from '@/lib/db';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { token } from '@/lib/auth';

const ok = () => { if (cookies().get('sess')?.value !== token()) throw new Error('Unauthorized'); };
const done = () => revalidatePath('/', 'layout');
const s = (f, k) => String(f.get(k) ?? '').trim();
const n = (f, k) => Number(f.get(k) || 0);

export async function login(f) {
  if (s(f, 'password') === process.env.ADMIN_PASSWORD) {
    cookies().set('sess', token(), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 2592000, path: '/' });
    redirect('/');
  }
  redirect('/login?e=1');
}
export async function logout() { cookies().delete('sess'); redirect('/login'); }

export async function addEmployee(f) {
  ok();
  await sql`insert into employees(name,mobile,address,joining_date,notes,opening_balance)
    values(${s(f,'name')},${s(f,'mobile')},${s(f,'address')},${s(f,'joining_date') || null},${s(f,'notes')},${n(f,'opening_balance')})`;
  done();
}
export async function updateEmployee(f) {
  ok();
  await sql`update employees set name=${s(f,'name')}, mobile=${s(f,'mobile')}, address=${s(f,'address')}, notes=${s(f,'notes')},
    active=${f.get('active') === 'on'}, opening_balance=${n(f,'opening_balance')} where id=${n(f,'id')}`;
  done();
}
export async function deleteEmployee(f) { ok(); await sql`delete from employees where id=${n(f,'id')}`; done(); redirect('/employees'); }

export async function addItem(f) {
  ok();
  const r = await sql`insert into items(code,name,description,unit,rate) values(${s(f,'code').toUpperCase()},${s(f,'name')},${s(f,'description')},${s(f,'unit') || 'pcs'},${n(f,'rate')}) on conflict (code) do nothing returning id, rate`;
  if (r[0]) await sql`insert into item_rate_history(item_id,rate) values(${r[0].id},${r[0].rate})`;
  done();
}
export async function importItems(f) { // lines: CODE,Name,Rate
  ok();
  for (const line of s(f, 'lines').split('\n')) {
    const [code, name, rate] = line.split(',').map((x) => x.trim());
    if (!code || !name || isNaN(+rate)) continue;
    const r = await sql`insert into items(code,name,rate) values(${code.toUpperCase()},${name},${+rate}) on conflict (code) do nothing returning id, rate`;
    if (r[0]) await sql`insert into item_rate_history(item_id,rate) values(${r[0].id},${r[0].rate})`;
  }
  done();
}
export async function updateItem(f) {
  ok();
  const id = n(f, 'id'), rate = n(f, 'rate');
  const cur = await sql`select rate from items where id=${id}`;
  await sql`update items set name=${s(f,'name')}, rate=${rate} where id=${id}`;
  if (cur[0] && +cur[0].rate !== rate) await sql`insert into item_rate_history(item_id,rate) values(${id},${rate})`;
  done();
}
export async function toggleItem(f) { ok(); await sql`update items set active = not active where id=${n(f,'id')}`; done(); }

// Rates are read from the database here, never trusted from the browser, and frozen into the line.
export async function saveWork(f) {
  ok();
  const emp = n(f, 'employee_id'), date = s(f, 'work_date');
  let rows = [];
  try { rows = JSON.parse(s(f, 'rows')); } catch {}
  rows = rows.filter((r) => r.item_id && +r.qty > 0);
  if (!emp || !date || !rows.length) return { ok: false, msg: 'Select an employee, a date and at least one item with a quantity.' };
  await sql`with e as (insert into production_entries(employee_id,work_date) values(${emp},${date}) returning id)
    insert into production_entry_items(entry_id,item_id,qty,rate,amount)
    select e.id, i.id, r.qty, i.rate, round(r.qty*i.rate,2)
    from e cross join jsonb_to_recordset(${JSON.stringify(rows)}::jsonb) as r(item_id int, qty numeric)
    join items i on i.id=r.item_id`;
  done();
  return { ok: true, msg: 'Saved.' };
}
export async function deleteEntry(f) { ok(); await sql`delete from production_entries where id=${n(f,'id')}`; done(); }

export async function addAdvance(f) {
  ok();
  await sql`insert into employee_advances(employee_id,tx_date,amount,method,reference,notes) values(${n(f,'employee_id')},${s(f,'date')},${n(f,'amount')},${s(f,'method')},${s(f,'reference')},${s(f,'notes')})`;
  done();
}
export async function deleteAdvance(f) { ok(); await sql`delete from employee_advances where id=${n(f,'id')}`; done(); }
export async function addPayment(f) {
  ok();
  await sql`insert into employee_payments(employee_id,tx_date,amount,method,reference,notes) values(${n(f,'employee_id')},${s(f,'date')},${n(f,'amount')},${s(f,'method')},${s(f,'reference')},${s(f,'notes')})`;
  done();
}
export async function deletePayment(f) { ok(); await sql`delete from employee_payments where id=${n(f,'id')}`; done(); }
