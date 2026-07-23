# Kukku

家庭用の食材在庫管理 + AIレシピ提案Webアプリ。Next.js (App Router) + Supabase + Claude APIで構築。

設計の背景・意思決定は [`docs/`](./docs) を参照してください。

- [01-architecture.md](./docs/01-architecture.md) — システム構成・技術選定の理由
- [02-database-design.md](./docs/02-database-design.md) — ER図・テーブル設計・RLS・招待フロー
- [03-directory-structure.md](./docs/03-directory-structure.md) — ディレクトリ構成方針
- [04-ui-design.md](./docs/04-ui-design.md) — 画面構成・デザイントークン
- [05-api-design.md](./docs/05-api-design.md) — Server Actions一覧・AI呼び出し設計

---

## 主な機能

- 食材の在庫管理(カテゴリ・保存場所・賞味期限・ワンタップ増減)
- Claude AIによるレシピ提案(作れる料理/あと1品で作れる料理/献立/賞味期限優先の無駄なく使う提案)
- 買い物リスト(手動追加 + AIによる不足食材の自動抽出)
- 招待URLタップだけで参加できる世帯共有(ログイン画面なし、Supabase匿名認証)
- リアルタイム同期(在庫・買い物リストを世帯内で即時共有)
- PWA対応(ホーム画面に追加してアプリのように利用可能)
- ダークモード対応

---

## 技術スタック

| レイヤー | 技術 |
|---|---|
| Frontend | Next.js 15 (App Router) / React 19 / TypeScript (strict) / Tailwind CSS / shadcn/ui |
| Backend | Next.js Server Actions / Route Handlers |
| DB / Auth / Storage | Supabase (PostgreSQL / Auth / Storage / Realtime) |
| AI | Claude API (`@anthropic-ai/sdk`, Tool Useによる構造化出力) |
| フォーム/バリデーション | React Hook Form + Zod |
| テスト | Vitest + Testing Library |

---

## セットアップ手順

### 1. 前提条件

- Node.js 20以上
- npmが使えること
- [Supabase](https://supabase.com)アカウント(無料枠でOK)
- [Anthropic Console](https://console.anthropic.com)のAPIキー

### 2. 依存パッケージのインストール

```bash
npm install
```

### 3. Supabaseプロジェクトの作成

1. Supabaseダッシュボードで新規プロジェクトを作成
2. プロジェクトの `Settings > API` から以下を控える
   - Project URL
   - `anon` `public` キー
   - `service_role` キー(サーバー専用、絶対にクライアントに公開しない)

### 4. データベースのマイグレーション適用

[Supabase CLI](https://supabase.com/docs/guides/cli)を使う場合:

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

CLIを使わない場合は、`supabase/migrations/`配下のSQLファイルを、ファイル名の連番順にSupabaseダッシュボードのSQL Editorで実行してください。

適用後、`Database > Replication`で`ingredients`と`shopping_list_items`がRealtime publicationに含まれていることを確認してください(マイグレーション`20260723000012_enable_realtime.sql`で自動設定されます)。

### 5. 環境変数の設定

`.env.local.example`を`.env.local`にコピーして値を埋めてください。

```bash
cp .env.local.example .env.local
```

### 6. 開発サーバーの起動

```bash
npm run dev
```

`http://localhost:3000` を開くと、まだ世帯に参加していない場合は自動的にオンボーディング画面(`/onboarding`)へ遷移します。「はじめる」を押すと匿名認証で世帯が作成されます。

設定画面から発行される招待URLを、同居している方に共有すると、ログイン不要でそのまま同じ在庫が見られるようになります(詳細は [02-database-design.md](./docs/02-database-design.md) の招待フロー参照)。

---

## 環境変数一覧

| 変数名 | 必須 | 説明 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | SupabaseプロジェクトのURL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabaseの`anon`キー(クライアントに公開される) |
| `SUPABASE_SERVICE_ROLE_KEY` | - | 現状未使用。将来のバッチ処理/Cron機能追加時にサーバー専用で使用予定 |
| `AI_PROVIDER` | ✅ | 使用するAIプロバイダ。現状`claude`のみ実装 |
| `ANTHROPIC_API_KEY` | ✅ | Claude APIキー。サーバーサイドのみで使用、クライアントには一切露出しない |
| `NEXT_PUBLIC_APP_URL` | - | 本番URL。招待URL生成は現状`window.location.origin`を使用しているため必須ではないが、将来のサーバーサイド生成(LINE通知等)に備えて設定推奨 |

---

## Claude API設定方法

1. [Anthropic Console](https://console.anthropic.com)でAPIキーを発行
2. `.env.local`(ローカル)またはVercelの環境変数(本番)に`ANTHROPIC_API_KEY`として設定
3. `AI_PROVIDER=claude`を設定(デフォルト値)

AI呼び出しは `lib/ai/provider.ts` の `getAiProvider()` を経由し、実装は `lib/ai/providers/claude-provider.ts` にあります。Claudeのtool use機能で構造化出力を強制しているため、レスポンスは常にZodスキーマ(`lib/ai/types.ts`)で検証されます。

### 将来、OpenAI/Geminiに切り替える場合

1. `lib/ai/providers/openai-provider.ts`(または`gemini-provider.ts`)を作成し、`AiProvider`インターフェース([lib/ai/types.ts](./lib/ai/types.ts))を実装
2. `lib/ai/provider.ts`の`switch`文にケースを追加
3. 環境変数`AI_PROVIDER`の値を切り替える

`features/*`・`services/*`はこのインターフェースのみに依存しているため、他のコードを変更する必要はありません。

---

## 開発手順

### ディレクトリ構成

詳細は [03-directory-structure.md](./docs/03-directory-structure.md) を参照。概要:

```
app/            ルーティング(Next.js App Router)
features/       機能単位のUI・Server Actions・バリデーション
services/       ビジネスロジック本体(DBアクセス・AI呼び出し)
lib/            AI Provider抽象化・Supabaseクライアント・汎用ユーティリティ
components/     featureに依存しない共通UI(shadcn/ui含む)
types/          DB型定義
supabase/       マイグレーション・シードSQL
```

依存方向は `app → features → services → lib` の一方向。詳細な理由はディレクトリ構成ドキュメント参照。

### コマンド一覧

```bash
npm run dev        # 開発サーバー起動
npm run build       # 本番ビルド
npm run start        # 本番ビルドの起動
npm run lint          # ESLint
npm run typecheck      # tsc --noEmit
npm run test            # Vitestでテスト実行
npm run test:watch       # Vitest watchモード
```

### 新機能を追加する場合

1. `services/<feature>/`にビジネスロジックを追加(DBアクセス・AI呼び出し)
2. `features/<feature>/schema.ts`にZodスキーマを定義
3. `features/<feature>/actions.ts`にServer Actionsを追加(`{ success, data | error }`形式で返す)
4. `features/<feature>/components/`にUIを実装
5. `app/(dashboard)/<feature>/page.tsx`でルーティング

---

## デプロイ手順(Vercel)

1. GitHubリポジトリにpush
2. [Vercel](https://vercel.com)で新規プロジェクトとしてインポート
3. 環境変数一覧の値をVercelプロジェクトの`Settings > Environment Variables`に設定(Production/Preview両方)
4. デプロイを実行

Vercel + Supabase + Claude APIのみで動作し、他のインフラは不要です。

### デプロイ後の確認

- `/onboarding`で世帯が作成できること
- 設定画面の招待URLをシークレットウィンドウ等別セッションで開き、参加できること(ログイン画面が出ないこと)
- 在庫追加後、別セッション(パートナー役)の画面にRealtimeで反映されること
- レシピ提案がClaude APIから正常に返ること(`ANTHROPIC_API_KEY`が正しく設定されているか確認)

---

## 未実装・今後の拡張(設計上は対応済み)

以下は要求定義時点で「将来対応」として合意済みの機能です。データベース設計・ディレクトリ構成はこれらを見据えて作られており、既存構造を壊さずに追加できます。詳細は [01-architecture.md](./docs/01-architecture.md) の「将来拡張との整合性」を参照。

- レシートOCRによる食材自動登録
- バーコード読み取りによる商品名自動入力
- LINE通知(期限間近のリマインド)
- 「今週安い食材」とスーパーのチラシ情報を組み合わせた献立提案
- 食費・食品ロスの可視化(`ingredient_logs`テーブルに集計元データは記録済み)
- ネイティブアプリ化(React Native / Expo)を見据えた、UIから独立したservices層

---

## テスト

`lib/`・`features/*/schema.ts`・主要コンポーネントに対するユニット/コンポーネントテストを [Vitest](https://vitest.dev) + Testing Libraryで実装しています。

```bash
npm run test
```

Server Actions・Supabase連携部分の結合テスト、E2Eテスト(Playwright等)は現時点未整備です。追加する場合は`services/*`層をモック可能な設計にしているため、単体テストしやすい構造になっています。
