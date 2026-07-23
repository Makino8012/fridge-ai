# ⑤ API設計

## 1. 方針

- **ユーザー操作(CRUD)は全てServer Actions**。フォーム送信・型安全・`revalidatePath`による再検証がシンプルにまとまるため
- **外部からの入力を受けるものだけRoute Handlers**(将来のLINE Webhook等)。現時点でRoute Handlersの実装対象はなし(招待参加もServer Action + RPCで完結)
- 全Server Actionsは共通パターンに従う:
  1. Zodで入力検証
  2. `services/*`層の関数を呼ぶ(DBアクセス/AI呼び出しは一切ここに書かない)
  3. 成功時は`revalidatePath`、失敗時は`{ success: false, error }`形式で返す(例外を投げてクライアントをクラッシュさせない)

```typescript
// features/ingredients/actions.ts のパターン例
'use server'

export async function createIngredient(input: CreateIngredientInput) {
  const parsed = createIngredientSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.flatten() };

  try {
    const ingredient = await ingredientService.create(parsed.data);
    revalidatePath('/ingredients');
    return { success: true, data: ingredient };
  } catch (e) {
    return { success: false, error: 'INGREDIENT_CREATE_FAILED' };
  }
}
```

---

## 2. Server Actions 一覧

### `features/ingredients/actions.ts`
| 関数 | 入力 | 説明 |
|---|---|---|
| `createIngredient` | name, quantity, unit, categoryId, storageLocationId, expiryDate?, memo? | 食材登録 |
| `updateIngredient` | id + 上記(部分更新) | 編集 |
| `deleteIngredient` | id | 削除 |
| `adjustQuantity` | id, delta, reason | ワンタップ増減。`ingredients.quantity`更新+`ingredient_logs`記録をトランザクションで実行 |
| `searchIngredients` | query?, categoryId?, sort? | 一覧取得(Server Component内で直接呼ぶ読み取り専用、`services`経由) |

### `features/recipes/actions.ts`
| 関数 | 入力 | 説明 |
|---|---|---|
| `suggestRecipes` | (在庫は自動取得) | 「作れる料理」5件をAIから取得し`recipe_history`に保存 |
| `suggestWithMissingIngredient` | missingIngredientName | 「あと1品で作れる」提案 |
| `toggleFavorite` | recipeSnapshot | お気に入り登録/解除 |
| `getFavorites` / `getHistory` | - | 一覧取得 |

### `features/menu-plan/actions.ts`
| 関数 | 入力 | 説明 |
|---|---|---|
| `suggestMenuPlan` | timeframe: `today_dinner`\|`tomorrow_breakfast`\|`this_week` | 献立提案 |

### `features/shopping-list/actions.ts`
| 関数 | 入力 | 説明 |
|---|---|---|
| `addShoppingItem` | name, quantity?, unit? | 手動追加 |
| `importFromRecipe` | missingIngredientNames[] | AI提案の不足食材を一括追加(`source: ai_suggested`) |
| `toggleChecked` | id | チェック切替 |
| `deleteShoppingItem` | id | 削除 |
| `clearChecked` | - | 完了済み一括削除 |

### `features/household/actions.ts`
| 関数 | 入力 | 説明 |
|---|---|---|
| `joinHousehold` | inviteToken, displayName | 匿名認証後に`join_household_by_invite` RPCを呼ぶ |
| `regenerateInviteToken` | - | 招待URL再発行 |
| `updateDietaryPreferences` | allergies[], dislikes[], diet | `profiles.dietary_preferences`更新 |

### `features/dashboard/queries.ts`(読み取り専用、Server Component直呼び出し)
| 関数 | 説明 |
|---|---|
| `getDashboardSummary` | 期限切れ件数、期限間近件数、登録食材数を集計 |
| `getTodaysSuggestion` | 期限が近い食材を優先したAIおすすめ1件(④の「豆腐が明日期限なので麻婆豆腐」) |

---

## 3. Route Handlers(現状 / 将来)

| パス | 状態 | 用途 |
|---|---|---|
| `app/api/webhooks/line/route.ts` | 将来 | LINE通知の返信・友だち追加イベント受信 |
| `app/api/cron/expiry-check/route.ts` | 将来 | Supabase Cron/Vercel Cronから叩かれ、期限間近食材をLINE通知する定期実行 |

現時点(⑥〜⑨実装スコープ)ではRoute Handlersは実装しない。

---

## 4. AI呼び出しのAPI形状(services/recipes/recipe-service.ts が内部で使う)

`lib/ai/types.ts`で定義する入出力(Zod)は共通化し、Server Action側はこの型のみを意識する。

```typescript
type SuggestRecipesInput = {
  ingredients: { name: string; quantity: number; unit: string; expiryDate: string | null }[];
  dietaryPreferences: { allergies: string[]; dislikes: string[]; diet: string | null };
};

type RecipeSuggestion = {
  title: string;
  difficulty: 'easy' | 'normal' | 'hard';
  cookingTimeMinutes: number;
  ingredients: { name: string; quantity: string; owned: boolean }[];
  steps: string[];
  usesExpiringIngredient: boolean;
};
```

Claudeへの応答は**Tool Use(構造化出力)を強制**し、自由文からのパースを避ける(⑥で実装)。

---

## 5. エラーハンドリング方針

- Server Actionsは例外を投げず`{ success, error }`形式で返却し、UI側で`Sonner`トーストに表示
- AI呼び出し(Claude API)がタイムアウト/レート制限した場合は、`services/recipes`側でリトライ(最大1回, 指数バックオフ)後にエラーを返す
- Vercel実行時間制限対策: レシピ提案はStreaming(`streamText`相当)ではなく、Claude側でmax_tokensを抑えたTool Use呼び出しにして通常10秒以内に収める設計とし、Node.js Runtimeを使用(Edge Runtimeは使わない。Anthropic SDKの安定動作を優先)

---

## 6. この工程での設計レビュー観点

- ✅ Server Actionsの入出力パターンを統一し、UI側のエラー表示ロジックを共通化できる
- ✅ AI呼び出しはTool Useで構造化出力を強制し、パース失敗による表示崩れを防ぐ
- ✅ 招待フローが`features/household/actions.ts`の2関数(join/regenerate)に集約され、②のDB設計とずれがない
- ⚠️ `suggestRecipes`等のAI呼び出しは呼び出し課金が発生するため、将来的にレート制限(1世帯あたり1日N回まで等)を検討する余地あり(現時点ではスコープ外として明記)
