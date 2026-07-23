-- 招待URLから世帯に参加する。profiles.household_idがまだnullの状態で
-- 自分自身のprofileを更新する必要があるため、通常のRLSでは扱えずsecurity definerで実装する。
create or replace function join_household_by_invite(p_invite_token text, p_display_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_household_id uuid;
begin
  select id into v_household_id from households where invite_token = p_invite_token;
  if v_household_id is null then
    raise exception 'invalid invite token';
  end if;

  insert into profiles (id, household_id, display_name)
  values (auth.uid(), v_household_id, p_display_name)
  on conflict (id) do update
    set household_id = excluded.household_id,
        display_name = case when profiles.display_name = '' then excluded.display_name else profiles.display_name end;

  return v_household_id;
end;
$$;

-- 世帯を新規作成し、作成者を最初のメンバーにする(初回オンボーディング用)
create or replace function create_household(p_name text, p_display_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_household_id uuid;
begin
  insert into households (name) values (coalesce(nullif(p_name, ''), 'わが家'))
  returning id into v_household_id;

  insert into profiles (id, household_id, display_name)
  values (auth.uid(), v_household_id, p_display_name)
  on conflict (id) do update
    set household_id = excluded.household_id,
        display_name = case when profiles.display_name = '' then excluded.display_name else profiles.display_name end;

  return v_household_id;
end;
$$;

-- 招待URLの再発行。所属メンバーのみ実行可能。
create or replace function regenerate_invite_token()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_household_id uuid;
  v_new_token text;
begin
  v_household_id := auth_household_id();
  if v_household_id is null then
    raise exception 'not a member of any household';
  end if;

  v_new_token := encode(gen_random_bytes(16), 'hex');

  update households set invite_token = v_new_token where id = v_household_id;

  return v_new_token;
end;
$$;

-- 在庫のワンタップ増減。quantity更新とingredient_logs記録をアトミックに行う。
create or replace function adjust_ingredient_quantity(p_ingredient_id uuid, p_delta numeric, p_reason text)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_household_id uuid;
  v_owner_household_id uuid;
  v_new_quantity numeric;
begin
  v_household_id := auth_household_id();

  select household_id into v_owner_household_id from ingredients where id = p_ingredient_id;
  if v_owner_household_id is null or v_owner_household_id != v_household_id then
    raise exception 'ingredient not found or not accessible';
  end if;

  update ingredients
    set quantity = greatest(0, quantity + p_delta)
    where id = p_ingredient_id
    returning quantity into v_new_quantity;

  insert into ingredient_logs (ingredient_id, household_id, quantity_delta, reason, actor_id)
  values (p_ingredient_id, v_household_id, p_delta, p_reason, auth.uid());

  return v_new_quantity;
end;
$$;
