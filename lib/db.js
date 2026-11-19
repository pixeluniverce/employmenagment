import { neon } from '@neondatabase/serverless';
export const sql = neon(process.env.DATABASE_URL);
export const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
export const today = () => new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10); // IST
