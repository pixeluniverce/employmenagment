-- DANGER: deletes ALL tables of this app AND of the older "production-pro" version, then you run schema.sql again.
-- Use only while the database has test data. Run this first in the Neon SQL Editor, then run schema.sql.
drop table if exists audit_logs, employee_daily_distributions, production_batch_items, production_batches,
  daily_group_members, daily_groups, employee_advances, employee_payments, item_rate_history, items,
  employees, employee_groups, business_settings, production_entry_items, production_entries cascade;
drop sequence if exists emp_seq;
