# Mahadev Cement Product Employee Management System
Group-wise production and piece-rate earnings. Next.js 14 + Neon Postgres + Vercel.

## Deploy (no local run needed)
1. Neon: create a project, click Connect, turn pooling ON, copy the connection string.
2. Neon > SQL Editor: paste all of `schema.sql` and Run.
   (If you ran the OLD production-pro schema in the same database, run `drop_old.sql` first, or create a new Neon database.)
3. Upload this folder's contents to a GitHub repo, import it in Vercel.
4. Environment variables: `DATABASE_URL`, `ADMIN_PASSWORD`, `SESSION_SECRET` (see `.env.example`). Deploy.

## Daily workflow
1. Daily Groups & Attendance: pick date, create groups (or copy yesterday), assign employees, set attendance.
2. Daily Production: pick group, enter items and quantities, Save (several batches allowed).
3. Earnings Distribution: review, then Finalize. Earnings are saved to employee accounts and the group locks.
4. Advances / Payments: record money; balances update automatically.
5. Reports & Settlement: monthly statement, group-wise, item-wise, attendance.

## Rules implemented
- Each group is its own pool: share = pool x weight / total eligible weights (Present 1, Half Day 0.5, Absent/Leave 0; editable in Settings).
- Never divides by registered employee count. One worker present gets the whole pool. Nobody eligible: pool stays undistributed with a warning, no divide by zero.
- Money is NUMERIC in the database and integer paise in code; the rounding remainder goes to the last eligible employees, so shares always add up exactly (100 / 3 = 33.33 + 33.33 + 33.34).
- One employee can be in only one group per date (database unique constraint).
- Rates are frozen into each production line. Finalized groups are locked; "Reopen" is an admin correction recorded in the audit log.
- Balance = opening balance + finalized earnings - advances - payments (computed, never overwritten).

## Test the money logic
`npm test` runs the distribution engine tests (equal split, separate groups, one worker, half day, all absent, rounding, balance).
