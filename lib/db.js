import { neon } from '@neondatabase/serverless';
let client;
const get = () => {
  if (!client) {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set in Vercel Environment Variables');
    client = neon(process.env.DATABASE_URL);
  }
  return client;
};
export const sql = (...a) => get()(...a);
sql.query = (...a) => get().query(...a);
sql.transaction = (...a) => get().transaction(...a);
export const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
export const today = () => new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10); // IST
