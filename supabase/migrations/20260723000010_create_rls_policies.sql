-- 自分の所属household_idを返すヘルパー関数
create or replace function auth_household_id()
returns uuid
language sql
security definer
stable
as $$
  select household_id from public.profiles where id = auth.uid();
$$;

-- ============ households ============
alter table households enable row level security;

create policy "select own household"
  on households for select
  using (id = auth_household_id());

-- insert/update/deleteはクライアントから直接行わせない(RPC経由のみ)。ポリシーを作らないことで拒否。

-- ============ profiles ============
alter table profiles enable row level security;

create policy "select own or household members"
  on profiles for select
  using (id = auth.uid() or household_id = auth_household_id());

create policy "update own profile only"
  on profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- insertはhandle_new_user()トリガー(security definer)経由のみ。deleteは許可しない。

-- ============ categories / storage_locations (マスタ) ============
alter table categories enable row level security;
alter table storage_locations enable row level security;

create policy "anyone authenticated can read categories"
  on categories for select
  using (auth.role() = 'authenticated');

create policy "anyone authenticated can read storage_locations"
  on storage_locations for select
  using (auth.role() = 'authenticated');

-- insert/update/deleteはservice_roleのみ(ポリシー未作成 = 拒否)

-- ============ ingredients ============
alter table ingredients enable row level security;

create policy "select own household ingredients"
  on ingredients for select
  using (household_id = auth_household_id());

create policy "insert own household ingredients"
  on ingredients for insert
  with check (household_id = auth_household_id());

create policy "update own household ingredients"
  on ingredients for update
  using (household_id = auth_household_id())
  with check (household_id = auth_household_id());

create policy "delete own household ingredients"
  on ingredients for delete
  using (household_id = auth_household_id());

-- ============ ingredient_logs ============
alter table ingredient_logs enable row level security;

create policy "select own household ingredient_logs"
  on ingredient_logs for select
  using (household_id = auth_household_id());

create policy "insert own household ingredient_logs"
  on ingredient_logs for insert
  with check (household_id = auth_household_id());

-- ログは編集/削除させない(監査目的のため意図的にポリシー未作成)

-- ============ shopping_list_items ============
alter table shopping_list_items enable row level security;

create policy "select own household shopping_list_items"
  on shopping_list_items for select
  using (household_id = auth_household_id());

create policy "insert own household shopping_list_items"
  on shopping_list_items for insert
  with check (household_id = auth_household_id());

create policy "update own household shopping_list_items"
  on shopping_list_items for update
  using (household_id = auth_household_id())
  with check (household_id = auth_household_id());

create policy "delete own household shopping_list_items"
  on shopping_list_items for delete
  using (household_id = auth_household_id());

-- ============ recipe_favorites ============
alter table recipe_favorites enable row level security;

create policy "select own household recipe_favorites"
  on recipe_favorites for select
  using (household_id = auth_household_id());

create policy "insert own household recipe_favorites"
  on recipe_favorites for insert
  with check (household_id = auth_household_id());

create policy "delete own household recipe_favorites"
  on recipe_favorites for delete
  using (household_id = auth_household_id());

-- ============ recipe_history ============
alter table recipe_history enable row level security;

create policy "select own household recipe_history"
  on recipe_history for select
  using (household_id = auth_household_id());

create policy "insert own household recipe_history"
  on recipe_history for insert
  with check (household_id = auth_household_id());
