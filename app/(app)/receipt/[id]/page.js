import { notFound } from 'next/navigation';
import { sql, inr } from '@/lib/db';
import { balances } from '@/lib/data';
import PrintBtn from '@/components/PrintBtn';
export default async function Receipt({ params }) {
  const [p] = await sql`select y.*, y.tx_date::text d, e.name, e.code from employee_payments y join employees e on e.id=y.employee_id where y.id=${+params.id}`;
  if (!p) notFound();
  const [b] = await balances(p.employee_id);
  return (
    <div className="mx-auto max-w-md rounded-lg border bg-white p-6">
      <h1 className="text-xl font-semibold text-navy">Payment receipt #{p.id}</h1>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between"><dt>Employee</dt><dd>{p.name} ({p.code})</dd></div>
        <div className="flex justify-between"><dt>Date</dt><dd>{p.d}</dd></div>
        <div className="flex justify-between"><dt>Method</dt><dd>{p.method} {p.reference && `· ${p.reference}`}</dd></div>
        <div className="flex justify-between text-lg font-semibold"><dt>Amount paid</dt><dd>{inr(p.amount)}</dd></div>
        <div className="flex justify-between"><dt>Balance now pending</dt><dd>{inr(b.balance)}</dd></div>
      </dl>
      <div className="mt-6 flex justify-between text-xs text-slate-500"><span>Employee signature</span><span>Authorised signature</span></div>
      <div className="mt-4"><PrintBtn /></div>
    </div>
  );
}
