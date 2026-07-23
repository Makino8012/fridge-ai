create table shopping_list_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  name text not null,
  quantity numeric,
  unit text,
  is_checked boolean not null default false,
  source text not null default 'manual' check (source in ('manual', 'ai_suggested')),
  created_by uuid references profiles (id) on delete set null,
  checked_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  checked_at timestamptz
);
