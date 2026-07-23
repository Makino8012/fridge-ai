create table households (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'わが家',
  invite_token text not null unique default encode(gen_random_bytes(16), 'hex'),
  created_at timestamptz not null default now()
);

comment on table households is '世帯。自分と彼女など、在庫を共有するグループの単位';
comment on column households.invite_token is '招待URL /join/{invite_token} に使用。regenerate_invite_token()で再発行可能';
