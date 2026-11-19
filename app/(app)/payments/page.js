import { sql } from '@/lib/db';
import { addPayment, deletePayment } from '@/app/actions';
import Txn from '@/components/Txn';
export default async function Payments({ searchParams }) {
  const e = searchParams.e ? +searchParams.e : null;
  const [employees, rows] = await Promise.all([
    sql`select id, name, code from employees where active order by name`,
    sql`select a.id, a.tx_date::text d, e.name, a.amount, a.method, a.reference, a.notes from employee_payments a join employees e on e.id=a.employee_id where (${e}::int is null or a.employee_id=${e}::int) order by a.tx_date desc, a.id desc limit 300`,
  ]);
  return <Txn title="Payments" rows={rows} employees={employees} add={addPayment} del={deletePayment} emp={e} receipt overpay err={searchParams.err} />;
}

export const dynamic = 'force-dynamic';
