create table categories (
  id text primary key,
  label_ja text not null,
  icon text not null,
  sort_order int not null
);

create table storage_locations (
  id text primary key,
  label_ja text not null,
  sort_order int not null
);

insert into categories (id, label_ja, icon, sort_order) values
  ('vegetable', '野菜', 'carrot', 1),
  ('meat', '肉', 'beef', 2),
  ('fish', '魚', 'fish', 3),
  ('drink', '飲み物', 'cup-soda', 4),
  ('frozen', '冷凍食品', 'snowflake', 5),
  ('seasoning', '調味料', 'flask-conical', 6),
  ('other', 'その他', 'shapes', 7);

insert into storage_locations (id, label_ja, sort_order) values
  ('fridge', '冷蔵', 1),
  ('freezer', '冷凍', 2),
  ('room_temp', '常温', 3);
