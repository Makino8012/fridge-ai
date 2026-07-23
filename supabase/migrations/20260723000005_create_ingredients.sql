create table ingredients (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  name text not null,
  quantity numeric not null default 0 check (quantity >= 0),
  unit text not null default '個',
  category_id text not null references categories (id),
  storage_location_id text not null references storage_locations (id),
  expiry_date date,
  memo text,
  source text not null default 'manual' check (source in ('manual', 'receipt_ocr', 'barcode')),
  barcode text,
  image_url text,
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column ingredients.source is '登録経路。receipt_ocr/barcodeは将来機能用に予約済み';

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger ingredients_set_updated_at
  before update on ingredients
  for each row execute function set_updated_at();
