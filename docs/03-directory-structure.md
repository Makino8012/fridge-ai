# ③ ディレクトリ構成

## 1. 設計方針

- **feature単位**でUI・hooks・Server Actions・バリデーションをまとめる(機能追加/削除がフォルダ単位で完結し、保守性が高い)
- **依存方向を一方向に固定**(Clean Architectureの簡易版):
  ```
  app (ルーティング/ページ)
    → features (機能ごとのUI・操作)
      → services (ビジネスロジック・DBアクセス・AI呼び出し)
        → lib (Supabaseクライアント、AI Provider実装、汎用ユーティリティ)
  types (全レイヤー共通、下から上まで参照可)
  components (featuresに依存しない共通UI部品、shadcn/ui含む)
  ```
  逆方向の参照(例: `services`が`features`をimportする等)は禁止。
- Server Actionsは**featureフォルダ内に配置**し、フォームやコンポーネントから直接呼べるようにする。ただしDBアクセスやAI呼び出しの実処理は必ず`services/`に委譲する(Server Action自身はリクエスト検証と呼び出しの薄いレイヤーに留める)。

---

## 2. ディレクトリツリー

```
fridge-ai/
├── app/
│   ├── (auth)/
│   │   └── join/
│   │       └── [token]/
│   │           └── page.tsx              # 招待URL受付(匿名認証→join_household_by_invite)
│   ├── (dashboard)/
│   │   ├── layout.tsx                    # 共通レイアウト(下部タブナビ等)
│   │   ├── page.tsx                      # ダッシュボード(⑤で詳細)
│   │   ├── ingredients/
│   │   │   ├── page.tsx                  # 在庫一覧
│   │   │   └── [id]/
│   │   │       └── page.tsx              # 在庫詳細/編集
│   │   ├── recipes/
│   │   │   ├── page.tsx                  # AIレシピ提案トップ
│   │   │   ├── favorites/page.tsx
│   │   │   └── history/page.tsx
│   │   ├── menu-plan/
│   │   │   └── page.tsx                  # 献立提案
│   │   ├── shopping-list/
│   │   │   └── page.tsx
│   │   └── settings/
│   │       ├── page.tsx                  # 世帯設定(招待URL再発行等)
│   │       └── profile/page.tsx          # アレルギー/苦手食材/ダイエット設定
│   ├── api/
│   │   └── webhooks/
│   │       └── line/
│   │           └── route.ts              # (将来)LINE通知Webhook
│   ├── manifest.ts                       # PWA manifest
│   ├── layout.tsx                        # RootLayout(フォント、テーマProvider)
│   └── globals.css
│
├── features/
│   ├── ingredients/
│   │   ├── components/
│   │   │   ├── ingredient-list.tsx
│   │   │   ├── ingredient-card.tsx
│   │   │   ├── ingredient-form.tsx
│   │   │   ├── quantity-quick-adjust.tsx  # ワンタップ増減ボタン
│   │   │   └── expiry-badge.tsx
│   │   ├── hooks/
│   │   │   ├── use-ingredients.ts         # Realtime購読込み
│   │   │   └── use-ingredient-filters.ts  # 検索/ソート状態管理
│   │   ├── actions.ts                     # Server Actions (create/update/delete/adjustQuantity)
│   │   └── schema.ts                      # Zodスキーマ(フォーム/Action入力共通)
│   │
│   ├── recipes/
│   │   ├── components/
│   │   │   ├── recipe-suggestion-card.tsx
│   │   │   ├── recipe-detail-dialog.tsx
│   │   │   ├── missing-ingredients-panel.tsx
│   │   │   └── favorite-button.tsx
│   │   ├── hooks/
│   │   │   └── use-recipe-suggestions.ts
│   │   ├── actions.ts                     # suggestRecipes, toggleFavorite等
│   │   └── schema.ts
│   │
│   ├── menu-plan/
│   │   ├── components/
│   │   │   └── menu-plan-view.tsx
│   │   ├── actions.ts
│   │   └── schema.ts
│   │
│   ├── shopping-list/
│   │   ├── components/
│   │   │   ├── shopping-list-view.tsx
│   │   │   └── shopping-item-row.tsx
│   │   ├── hooks/
│   │   │   └── use-shopping-list.ts       # Realtime購読
│   │   ├── actions.ts
│   │   └── schema.ts
│   │
│   ├── dashboard/
│   │   ├── components/
│   │   │   ├── expiry-summary-card.tsx
│   │   │   ├── stock-summary-card.tsx
│   │   │   └── todays-suggestion-card.tsx
│   │   └── queries.ts                     # ダッシュボード集計クエリ(読み取り専用)
│   │
│   └── household/
│       ├── components/
│       │   ├── invite-link-card.tsx       # 招待URL表示/再発行/コピー
│       │   └── dietary-preferences-form.tsx
│       ├── actions.ts                     # joinHousehold, regenerateInviteToken等
│       └── schema.ts
│
├── services/
│   ├── ingredients/
│   │   └── ingredient-service.ts          # DB CRUD + ログ記録
│   ├── recipes/
│   │   └── recipe-service.ts              # AI Provider呼び出し + recipe_history保存
│   ├── shopping-list/
│   │   └── shopping-list-service.ts
│   ├── household/
│   │   └── household-service.ts           # 招待発行/参加処理のRPC呼び出しラップ
│   └── dashboard/
│       └── dashboard-service.ts
│
├── lib/
│   ├── ai/
│   │   ├── types.ts                       # AiProvider interface, Zod入出力スキーマ
│   │   ├── provider.ts                    # getAiProvider()ファクトリ
│   │   ├── prompts/
│   │   │   ├── suggest-recipes.ts
│   │   │   ├── missing-ingredients.ts
│   │   │   ├── menu-plan.ts
│   │   │   └── waste-reduction.ts
│   │   └── providers/
│   │       ├── claude-provider.ts
│   │       ├── openai-provider.ts         # (将来)
│   │       └── gemini-provider.ts         # (将来)
│   ├── supabase/
│   │   ├── client.ts                      # ブラウザ用クライアント
│   │   ├── server.ts                      # Server Component/Action用クライアント(cookie連携)
│   │   └── middleware.ts                  # セッションリフレッシュ
│   ├── date.ts                            # 賞味期限計算等の日付ユーティリティ
│   └── utils.ts                           # cn()等の汎用ヘルパー
│
├── components/
│   ├── ui/                                # shadcn/ui生成コンポーネント(button, card, dialog等)
│   ├── layout/
│   │   ├── bottom-nav.tsx                 # スマホ用下部タブ
│   │   ├── header.tsx
│   │   └── theme-toggle.tsx
│   └── shared/
│       ├── empty-state.tsx
│       └── loading-spinner.tsx
│
├── types/
│   ├── database.types.ts                  # `supabase gen types typescript`で自動生成
│   └── domain.ts                          # アプリ独自の合成型(必要な場合のみ)
│
├── supabase/
│   ├── migrations/                        # ②で設計したSQL群
│   └── seed.sql
│
├── middleware.ts                          # Supabaseセッション同期(Next.js middleware)
├── public/
│   ├── icons/                             # PWAアイコン各サイズ
│   └── ...
├── .env.local.example
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## 3. 各レイヤーの役割と依存ルール

| レイヤー | 役割 | 依存してよいもの |
|---|---|---|
| `app/` | ルーティング・ページ構成・レイアウト。Server Componentが基本 | `features/*`, `components/*` |
| `features/*/components` | 機能固有のUI(Client/Server Component) | 同一feature内の`hooks`/`actions`、共通`components/ui` |
| `features/*/actions.ts` | Server Actions。入力をZodで検証し、`services/`へ委譲するだけの薄い層 | `services/*`, `features/*/schema.ts` |
| `services/*` | ビジネスロジック本体。DB CRUD、AI Provider呼び出し、`ingredient_logs`記録などのドメインルール | `lib/supabase`, `lib/ai`, `types/*` |
| `lib/ai/*` | AI Provider抽象化。プロンプト組み立てとプロバイダ実装 | `types/*`のみ |
| `lib/supabase/*` | Supabaseクライアント初期化のみ | 外部SDKのみ |
| `components/*` | featureに依存しない共通UI | `lib/utils.ts`のみ |
| `types/*` | 全レイヤー共通の型 | 依存なし(最下層) |

この表がそのまま「ESLintの`import`制限ルール」の元になる(⑤以降で`eslint-plugin-boundaries`等の導入を検討)。

---

## 4. なぜこの構成か

- **feature単位**にすることで、「レシート撮影機能を追加する」となった時に`features/receipt-ocr/`を1つ足すだけで済み、既存機能への影響を最小化できる
- **services層を挟む**ことで、Server Action(Web特有の関数形式)からビジネスロジックを分離。将来React Native/Expo化する際もservices層はほぼそのまま再利用可能
- **lib/ai を独立**させることで、AIプロバイダ切替がこのフォルダ内で完結し、features/servicesは`AiProvider`インターフェースしか知らない
- **components/ui(shadcn)**と**features内のcomponents**を分けることで、「デザインシステム部品」と「機能固有のUI」の境界が明確になり、shadcn/uiのアップデート(コンポーネント再生成)時の影響範囲が予測しやすい

---

## 5. この工程での設計レビュー観点

- ✅ ②DB設計の`households`招待フローが`app/(auth)/join/[token]`と`features/household`にそのまま対応
- ✅ 将来機能(レシートOCR/バーコード/LINE通知)がすべて「featureフォルダの追加」または「app/api/webhooksの追加」で対応でき、既存構造の変更が不要
- ✅ Service層がAI Provider・DBアクセスを一手に引き受け、Server Actionsが薄く保たれることでテストしやすい(Service層を単体でテスト可能)
- ⚠️ `features`間の相互依存(例: `recipes`が`ingredients`のZodスキーマを参照する等)が発生しうるため、共有すべき型は`types/domain.ts`に切り出すルールを徹底する
