-- 在庫の分類を細かくするためカテゴリーを追加する。
-- categories はマスターテーブル(ingredients.category_id が参照)なので、行を足すだけで増やせる。
insert into categories (id, label_ja, icon, sort_order) values
  ('fruit', 'フルーツ', 'apple', 8),
  ('noodle', '麺類', 'wheat', 9),
  ('dairy', '乳製品', 'milk', 10),
  ('egg', '卵', 'egg', 11),
  ('bread', 'パン', 'croissant', 12),
  ('grain', '米・穀物', 'wheat', 13)
on conflict (id) do nothing;
