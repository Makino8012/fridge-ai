-- 拡張機能の有効化
create extension if not exists pgcrypto;   -- gen_random_uuid(), gen_random_bytes()
create extension if not exists pg_trgm;    -- 食材名の部分一致検索高速化
