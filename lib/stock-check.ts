import type { CategoryId, StorageLocationId } from '@/types/database.types';

/**
 * 在庫データは必ず現実とズレる。使ったのに減らし忘れる、腐らせて捨てたのに残っている。
 * ズレたままだと「作れるレシピ」も「買い物リスト」も嘘になるので、
 * 「そろそろ怪しい食材」を数点だけ選んで、ときどき確認してもらう。
 *
 * 全部まとめて棚卸しさせるのは続かないので、1回あたり数点に絞るのが肝心。
 */

/** カテゴリごとの「これくらい経ったら怪しい」日数。 */
const CATEGORY_WINDOW_DAYS: Record<CategoryId, number> = {
  fish: 4,
  meat: 5,
  vegetable: 7,
  fruit: 7,
  dairy: 8,
  bread: 7,
  egg: 16,
  noodle: 30,
  grain: 45,
  drink: 21,
  frozen: 60,
  seasoning: 90,
  other: 30,
};

/** 冷凍・常温は日持ちするので、確認までの日数を伸ばす。 */
const STORAGE_MULTIPLIER: Record<StorageLocationId, number> = {
  fridge: 1,
  freezer: 4,
  room_temp: 2,
};

export interface StockCheckCandidate {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category_id: CategoryId;
  storage_location_id: StorageLocationId;
  expiry_date: string | null;
  updated_at: string;
}

export interface StockCheckItem extends StockCheckCandidate {
  /** 最後に触ってからの日数。 */
  daysSinceUpdate: number;
  /** なぜ確認したいのかを一言で。 */
  reason: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function daysBetween(from: string, now: Date): number {
  const diff = now.getTime() - new Date(from).getTime();
  return Math.floor(diff / DAY_MS);
}

/**
 * 確認したい食材を怪しい順に返す。
 *
 * @param limit 一度に出す数。多すぎると答える気が失せるので既定は3。
 */
export function pickStockCheckItems(
  ingredients: StockCheckCandidate[],
  now: Date = new Date(),
  limit = 3,
): StockCheckItem[] {
  const scored = ingredients
    .filter((item) => item.quantity > 0)
    .map((item) => {
      const daysSinceUpdate = daysBetween(item.updated_at, now);
      const window =
        (CATEGORY_WINDOW_DAYS[item.category_id] ?? 30) *
        (STORAGE_MULTIPLIER[item.storage_location_id] ?? 1);

      // 賞味期限切れは日数に関係なく最優先。捨てた物が残り続けるのが一番困る。
      const daysPastExpiry = item.expiry_date ? daysBetween(item.expiry_date, now) : null;
      if (daysPastExpiry !== null && daysPastExpiry > 0) {
        return {
          item,
          score: 10 + daysPastExpiry / 30,
          entry: {
            ...item,
            daysSinceUpdate,
            reason: `賞味期限が${daysPastExpiry}日過ぎています`,
          } satisfies StockCheckItem,
        };
      }

      return {
        item,
        score: daysSinceUpdate / window,
        entry: {
          ...item,
          daysSinceUpdate,
          reason: `${daysSinceUpdate}日間さわっていません`,
        } satisfies StockCheckItem,
      };
    })
    .filter((s) => s.score >= 1)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((s) => s.entry);
}
