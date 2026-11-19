-- ONLY if you already ran the OLD "production-pro" schema in this same Neon database (deletes all its data).
drop table if exists production_entry_items, production_entries, employee_advances, employee_payments, item_rate_history, items, employees cascade;
drop sequence if exists emp_seq;
