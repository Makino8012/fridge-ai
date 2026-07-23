create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  household_id uuid references households (id) on delete set null,
  display_name text not null default '',
  avatar_url text,
  dietary_preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table profiles is 'auth.usersの拡張情報。匿名認証ユーザーも含む';
comment on column profiles.dietary_preferences is '例: {"allergies": ["卵"], "dislikes": ["パクチー"], "diet": "high_protein"}';

-- auth.usersが作成されたら自動でprofilesの空レコードを作る
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
