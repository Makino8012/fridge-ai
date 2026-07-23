create table ingredient_logs (
  id uuid primary key default gen_random_uuid(),
  ingredient_id uuid not null references ingredients (id) on delete cascade,
  household_id uuid not null references households (id) on delete cascade,
  quantity_delta numeric not null,
  reason text not null check (reason in ('used_in_recipe', 'purchased', 'expired_disposed', 'manual_adjust')),
  actor_id uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table ingredient_logs is 'ワンタップ増減・利用履歴。将来の食費/食品ロス可視化の集計元データ';
