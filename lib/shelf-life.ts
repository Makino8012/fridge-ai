import { addDays, format } from 'date-fns';
import type { CategoryId, StorageLocationId } from '@/types/database.types';

/**
 * 賞味期限の入力は任意なので、実際にはほとんど入っていない。
 * その結果「早めに使いたい食材」も「使い切りレシピ」も空のまま、という状態になりがち。
 *
 * そこで期限が未入力の食材には、カテゴリと保存場所から日持ちの目安を当てて補う。
 * ただし推定値はあくまで目安なので、
 * - 画面では「目安」と明示する
 * - 「期限切れ○件」のような断定的な数字には使わない
 * という線引きを守る。
 */

/** 冷蔵での日持ちの目安(日)。 */
const BASE_SHELF_LIFE_DAYS: Record<CategoryId, number> = {
  fish: 2,
  meat: 3,
  bread: 4,
  vegetable: 7,
  fruit: 7,
  dairy: 8,
  egg: 18,
  noodle: 40,
  drink: 30,
  grain: 180,
  frozen: 60,
  seasoning: 180,
  other: 21,
};

/** 冷凍すればずっと保つし、常温の物はそもそも日持ちする物が多い。 */
const STORAGE_MULTIPLIER: Record<StorageLocationId, number> = {
  fridge: 1,
  freezer: 8,
  room_temp: 2,
};

/**
 * 目安を出しても意味がない(そんなに早く傷まない)カテゴリ。
 * 調味料や米に「そろそろ使い切って」と言われても困る。
 */
const SKIP_ESTIMATE: CategoryId[] = ['seasoning', 'grain', 'drink', 'frozen'];

export interface ShelfLifeInput {
  category_id: CategoryId;
  storage_location_id: StorageLocationId;
  expiry_date: string | null;
  created_at: string;
}

export interface EffectiveExpiry {
  /** YYYY-MM-DD。 */
  date: string;
  /** true なら推定値。画面では「目安」と添えること。 */
  estimated: boolean;
}

/** 買った日から何日もつかの目安。目安を出さないカテゴリは null。 */
export function estimateShelfLifeDays(
  category: CategoryId,
  storage: StorageLocationId,
): number | null {
  if (SKIP_ESTIMATE.includes(category)) return null;
  const base = BASE_SHELF_LIFE_DAYS[category] ?? 21;
  return Math.round(base * (STORAGE_MULTIPLIER[storage] ?? 1));
}

/**
 * 実際の期限を返す。入力があればそれをそのまま、無ければ登録日からの推定を返す。
 * 推定もできない場合は null。
 */
export function effectiveExpiry(item: ShelfLifeInput): EffectiveExpiry | null {
  if (item.expiry_date) return { date: item.expiry_date, estimated: false };

  const days = estimateShelfLifeDays(item.category_id, item.storage_location_id);
  if (days === null) return null;

  const base = new Date(item.created_at);
  if (Number.isNaN(base.getTime())) return null;

  // toISOString は UTC に寄るので、日本時間だと1日ずれる。ローカル日付で組み立てる。
  return { date: format(addDays(base, days), 'yyyy-MM-dd'), estimated: true };
}
