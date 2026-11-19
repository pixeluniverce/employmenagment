import { sql } from '@/lib/db';
export async function GET() {
  const r = await sql`select code,name,unit,rate,active from items order by code`;
  const csv = 'Code,Name,Unit,Rate,Active\n' + r.map((x) => [x.code, `"${x.name.replace(/"/g, '""')}"`, x.unit, x.rate, x.active].join(',')).join('\n');
  return new Response(csv, { headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename=items.csv' } });
}
