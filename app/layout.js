import './globals.css';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Mahadev Cement Product Employee Management System', description: 'Group-wise production and piece-rate earnings' };
export default function Root({ children }) {
  return (<html lang="en"><body>{children}</body></html>);
}
