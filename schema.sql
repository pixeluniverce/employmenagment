create sequence if not exists emp_seq;
create table if not exists business_settings(key text primary key, value text not null);
insert into business_settings(key,value) values ('business_name','Mahadev Cement Product'),('weight_present','1'),('weight_half','0.5') on conflict (key) do nothing;
create table if not exists employee_groups(
  id serial primary key, name text unique not null, description text,
  active boolean not null default true, created_at timestamptz not null default now());
create table if not exists employees(
  id serial primary key,
  code text unique not null default ('EMP' || lpad(nextval('emp_seq')::text, 3, '0')),
  name text not null, mobile text, address text,
  joining_date date default current_date, notes text,
  active boolean not null default true,
  perm_group_id int references employee_groups(id) on delete set null,
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
create table if not exists daily_groups(
  id serial primary key, work_date date not null, name text not null,
  perm_group_id int references employee_groups(id) on delete set null,
  is_temporary boolean not null default false,
  finalized boolean not null default false, finalized_at timestamptz,
  pool numeric(14,2), undistributed numeric(14,2) not null default 0,
  created_at timestamptz not null default now(), unique (work_date, name));
create table if not exists daily_group_members(
  id serial primary key,
  daily_group_id int not null references daily_groups(id) on delete cascade,
  employee_id int not null references employees(id),
  work_date date not null,
  status text not null default 'Present' check (status in ('Present','Half Day','Absent','Leave')),
  unique (work_date, employee_id));
create table if not exists production_batches(
  id serial primary key, daily_group_id int not null references daily_groups(id) on delete cascade,
  notes text, created_at timestamptz not null default now());
create table if not exists production_batch_items(
  id serial primary key, batch_id int not null references production_batches(id) on delete cascade,
  item_id int not null references items(id),
  qty numeric(12,2) not null check (qty > 0),
  rate numeric(12,2) not null, amount numeric(14,2) not null);
create table if not exists employee_daily_distributions(
  id serial primary key,
  daily_group_id int not null references daily_groups(id) on delete cascade,
  employee_id int not null references employees(id),
  work_date date not null, pool numeric(14,2) not null,
  status text not null, weight numeric(6,2) not null, share numeric(14,2) not null,
  created_at timestamptz not null default now(), unique (daily_group_id, employee_id));
create table if not exists employee_advances(
  id serial primary key, employee_id int not null references employees(id),
  tx_date date not null, amount numeric(12,2) not null check (amount > 0),
  method text not null default 'Cash', reference text, notes text,
  created_at timestamptz not null default now());
create table if not exists employee_payments(
  id serial primary key, employee_id int not null references employees(id),
  tx_date date not null, amount numeric(12,2) not null check (amount > 0),
  method text not null default 'Cash', reference text, notes text,
  created_at timestamptz not null default now());
create table if not exists audit_logs(
  id serial primary key, action text not null, detail text, created_at timestamptz not null default now());
create index if not exists ix_dgm_emp on daily_group_members(employee_id, work_date);
create index if not exists ix_dgm_group on daily_group_members(daily_group_id);
create index if not exists ix_dg_date on daily_groups(work_date);
create index if not exists ix_pb_group on production_batches(daily_group_id);
create index if not exists ix_pbi_batch on production_batch_items(batch_id);
create index if not exists ix_pbi_item on production_batch_items(item_id);
create index if not exists ix_edd_emp on employee_daily_distributions(employee_id, work_date);
create index if not exists ix_adv_emp on employee_advances(employee_id, tx_date);
create index if not exists ix_pay_emp on employee_payments(employee_id, tx_date);
