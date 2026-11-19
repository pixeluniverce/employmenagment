create sequence if not exists emp_seq;
create table if not exists employees(
  id serial primary key,
  code text unique not null default ('EMP' || lpad(nextval('emp_seq')::text, 3, '0')),
  name text not null, mobile text, address text,
  joining_date date default current_date, notes text,
  active boolean not null default true,
  opening_balance numeric(12,2) not null default 0,
  created_at timestamptz not null default now());
create table if not exists items(
  id serial primary key, code text unique not null, name text not null,
  description text, unit text not null default 'pcs',
  rate numeric(12,2) not null check (rate >= 0),
  active boolean not null default true, created_at timestamptz not null default now());
create table if not exists item_rate_history(
  id serial primary key, item_id int not null references items(id) on delete cascade,
  rate numeric(12,2) not null, changed_at timestamptz not null default now());
create table if not exists production_entries(
  id serial primary key, employee_id int not null references employees(id) on delete cascade,
  work_date date not null, created_at timestamptz not null default now());
create table if not exists production_entry_items(
  id serial primary key, entry_id int not null references production_entries(id) on delete cascade,
  item_id int not null references items(id),
  qty numeric(12,2) not null check (qty > 0),
  rate numeric(12,2) not null,
  amount numeric(14,2) not null);
create table if not exists employee_advances(
  id serial primary key, employee_id int not null references employees(id) on delete cascade,
  tx_date date not null, amount numeric(12,2) not null check (amount > 0),
  method text not null default 'Cash', reference text, notes text,
  created_at timestamptz not null default now());
create table if not exists employee_payments(
  id serial primary key, employee_id int not null references employees(id) on delete cascade,
  tx_date date not null, amount numeric(12,2) not null check (amount > 0),
  method text not null default 'Cash', reference text, notes text,
  created_at timestamptz not null default now());
create index if not exists ix_pe_emp_date on production_entries(employee_id, work_date);
create index if not exists ix_pei_entry on production_entry_items(entry_id);
create index if not exists ix_pei_item on production_entry_items(item_id);
create index if not exists ix_adv_emp on employee_advances(employee_id, tx_date);
create index if not exists ix_pay_emp on employee_payments(employee_id, tx_date);
