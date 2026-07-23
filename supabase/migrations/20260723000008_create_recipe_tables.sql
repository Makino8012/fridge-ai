create table recipe_favorites (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  title text not null,
  recipe_data jsonb not null,
  saved_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table recipe_history (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  request_type text not null check (
    request_type in ('recipe_suggest', 'missing_ingredients', 'menu_plan', 'shopping_list', 'waste_reduction')
  ),
  request_input jsonb not null,
  response_data jsonb not null,
  requested_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
