/**
 * 実質同じレシピを1つにまとめる。
 *
 * 「里芋の煮っころがし」と「さといもの煮っころがし」のように
 * 表記だけ違う料理が辞書に並んでおり、献立の同じ週に両方出てしまっていた。
 * タイトルの重複チェックは完全一致なので、表記ゆれをそろえて判定する。
 *
 * 残す方は、手順が詳しい方 → 材料が多い方 の順に選ぶ。
 */
import fs from 'node:fs';
import path from 'node:path';

const RECIPES = path.join(process.cwd(), 'data', 'recipes.json');

/** 表記ゆれをそろえる。 */
function normalizeTitle(title) {
  return title
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\s　()（）・,、]/g, '')
    .replace(/さといも/g, '里芋')
    .replace(/じゃがいも/g, 'ジャガイモ')
    .replace(/たまねぎ/g, '玉ねぎ')
    .replace(/にんじん/g, '人参')
    .replace(/たまご/g, '卵')
    .replace(/玉子/g, '卵')
    .replace(/ごはん/g, 'ご飯')
    .replace(/(風|基本)$/, '');
}

/** 情報量が多い方を残す。 */
function betterOf(a, b) {
  if (a.steps.length !== b.steps.length) return a.steps.length > b.steps.length ? a : b;
  if (a.ingredients.length !== b.ingredients.length)
    return a.ingredients.length > b.ingredients.length ? a : b;
  return a;
}

const recipes = JSON.parse(fs.readFileSync(RECIPES, 'utf8'));
const kept = new Map();
const removed = [];

for (const recipe of recipes) {
  const key = normalizeTitle(recipe.title);
  const existing = kept.get(key);
  if (!existing) {
    kept.set(key, recipe);
    continue;
  }
  const winner = betterOf(existing, recipe);
  const loser = winner === existing ? recipe : existing;
  // 残す方に、消す方のタグを取り込んでおく(片方にしかない分類を失わないため)。
  for (const tag of loser.tags) if (!winner.tags.includes(tag)) winner.tags.push(tag);
  kept.set(key, winner);
  removed.push(`${loser.title} (残した方: ${winner.title})`);
}

const result = [...kept.values()];
fs.writeFileSync(RECIPES, JSON.stringify(result, null, 2) + '\n', 'utf8');

console.log(`${recipes.length}件 → ${result.length}件`);
for (const line of removed) console.log(`  削除: ${line}`);
