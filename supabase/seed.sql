-- 開発用ダミーデータ
-- 注意: このseedはauth.usersに依存しないテストデータのみを投入する。
-- 実際のprofiles/ingredientsは、アプリ上でSupabase Anonymous Authでログイン後、
-- create_household() / join_household_by_invite() を呼んで作成すること。

insert into households (id, name, invite_token) values
  ('00000000-0000-0000-0000-000000000001', '開発用テスト世帯', 'dev-test-token-0001')
on conflict (id) do nothing;
