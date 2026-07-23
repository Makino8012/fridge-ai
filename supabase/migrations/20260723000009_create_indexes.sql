-- ingredients: 検索/ソート用
create index idx_ingredients_household_id on ingredients (household_id);
create index idx_ingredients_household_expiry on ingredients (household_id, expiry_date);
create index idx_ingredients_household_category on ingredients (household_id, category_id);
create index idx_ingredients_name_trgm on ingredients using gin (name gin_trgm_ops);

-- ingredient_logs
create index idx_ingredient_logs_ingredient_id on ingredient_logs (ingredient_id);
create index idx_ingredient_logs_household_created on ingredient_logs (household_id, created_at desc);

-- shopping_list_items
create index idx_shopping_list_household_checked on shopping_list_items (household_id, is_checked);

-- recipes
create index idx_recipe_history_household_created on recipe_history (household_id, created_at desc);
create index idx_recipe_favorites_household on recipe_favorites (household_id);

-- profiles
create index idx_profiles_household_id on profiles (household_id);
