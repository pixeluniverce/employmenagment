import './globals.css';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Production Pro', description: 'Employee production & piece-rate payroll' };
export default function Root({ children }) {
  return (<html lang="en"><body>{children}</body></html>);
}
