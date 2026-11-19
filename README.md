# Production Pro: piece-rate payroll (Next.js + Neon + Vercel)

## 1. Create the free database
1. Sign up at https://neon.tech (free plan), create a project.
2. Click **Connect**, copy the **pooled** connection string.

## 2. Run locally (optional)
```
cp .env.example .env.local     # fill DATABASE_URL, ADMIN_PASSWORD, SESSION_SECRET
npm install
npm run db:migrate             # creates all tables in Neon
npm run dev                    # http://localhost:3000
```

## 3. Deploy on Vercel
1. Push this folder to a GitHub repo, then Vercel > Add New Project > import it.
2. Add Environment Variables: `DATABASE_URL`, `ADMIN_PASSWORD`, `SESSION_SECRET`.
3. Deploy. Run `npm run db:migrate` once from your computer (with the same DATABASE_URL in `.env.local`) to create the tables.

## How balances work
Balance = opening balance + production earnings - advances - payments, always computed from transaction rows (nothing is overwritten). Each production line stores the rate used at save time, so later rate changes never alter old earnings.
