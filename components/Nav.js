import Link from 'next/link';
import { logout } from '@/app/actions';
const links = [['/', 'Dashboard'], ['/employees', 'Employees'], ['/items', 'Items & Rates'], ['/work', 'Daily Work Entry'], ['/advances', 'Advances'], ['/payments', 'Payments'], ['/reports', 'Reports & Salary']];
export default function Nav() {
  return (
    <aside className="no-print bg-navy text-slate-200 md:fixed md:inset-y-0 md:w-56">
      <div className="px-5 py-4 text-lg font-semibold text-white">Production Pro<div className="text-xs font-normal text-slate-400">Piece-rate payroll</div></div>
      <nav className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:pb-0">
        {links.map(([h, l]) => (<Link key={h} href={h} className="whitespace-nowrap rounded-md px-3 py-2 text-sm hover:bg-white/10">{l}</Link>))}
        <form action={logout}><button className="w-full rounded-md px-3 py-2 text-left text-sm text-slate-400 hover:bg-white/10">Sign out</button></form>
      </nav>
    </aside>
  );
}
