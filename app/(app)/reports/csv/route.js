import { today } from '@/lib/db';
import { empSummary } from '@/lib/report';
export async function GET(req) {
  const p = new URL(req.url).searchParams.get('m');
  const m = /^\d{4}-\d{2}$/.test(p || '') ? p : today().slice(0, 7);
  const rows = await empSummary(m + '-01');
  const csv = 'Employee ID,Name,Opening,Earnings,Advances,Payments,Closing Balance\n' + rows.map((r) => [r.code, `"${r.name.replace(/"/g, '""')}"`, r.opening, r.earned, r.adv, r.paid, r.closing].join(',')).join('\n');
  return new Response(csv, { headers: { 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename=statement-${m}.csv` } });
}

export const dynamic = 'force-dynamic';
