/**
 * レシピのバッチを取り込む前に検証する。
 *
 * 過去に「みたらし団子が副菜に出る」「手順に英単語が混ざる」といった
 * 取り込み後に気づく不具合が続いたので、追加前にまとめて弾く。
 *
 * 使い方: node scripts/validate-batch.mjs <ファイル...>
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const RECIPES = path.join(ROOT, 'data', 'recipes.json');

/** 役割が確定するタグ。lib/recipes/dish-role.ts と揃えること。 */
const MAIN_TAGS = ['主菜', '主食', '丼', '麺', 'ご飯', '米料理', 'パスタ', 'カレー', '鍋', 'ラーメン', 'うどん', 'そば', 'グラタン', 'サンドイッチ', 'トースト', 'パン', '背徳飯'];
const SIDE_TAGS = ['副菜', 'おつまみ', 'デザート', 'おやつ', 'ドリンク', '汁物', 'サラダ', '常備菜', '漬物'];
const ROLE_TAGS = [...MAIN_TAGS, ...SIDE_TAGS];

/** 日本語の手順に出てきてよい英字。単位や機器の表記。 */
const ALLOWED_WORDS = new Set(['cm', 'mm', 'ml', 'g', 'kg', 'l', 'w', 'c']);

const REQUIRED = ['title', 'difficulty', 'cookingTimeMinutes', 'ingredients', 'steps', 'tags', 'seasons'];
const DIFFICULTIES = ['easy', 'normal', 'hard'];
const SEASONS = ['all', 'spring', 'summer', 'autumn', 'winter'];

const existing = JSON.parse(fs.readFileSync(RECIPES, 'utf8'));
const existingTitles = new Set(existing.map((r) => r.title));

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('検証するファイルを指定してください');
  process.exit(1);
}

const problems = [];
const seen = new Set();
let count = 0;

/** 手順や食材名に英単語が紛れ込んでいないか。 */
function findForeignWords(recipe) {
  const texts = [recipe.title, ...recipe.steps, ...recipe.ingredients.map((i) => i.name)];
  const found = new Set();
  for (const text of texts) {
    for (const word of String(text).match(/[A-Za-z]+/g) ?? []) {
      if (!ALLOWED_WORDS.has(word.toLowerCase())) found.add(word);
    }
    // キリル文字・ハングルの混入も過去にあった
    for (const word of String(text).match(/[Ѐ-ӿ가-힯]+/g) ?? []) found.add(word);
  }
  return [...found];
}

for (const file of files) {
  const batch = JSON.parse(fs.readFileSync(file, 'utf8'));
  const name = path.basename(file);

  for (const recipe of batch) {
    count++;
    const label = `${name}: "${recipe.title ?? '(タイトルなし)'}"`;

    for (const key of REQUIRED) {
      if (recipe[key] === undefined) problems.push(`${label} に ${key} がない`);
    }
    if (!DIFFICULTIES.includes(recipe.difficulty)) problems.push(`${label} の difficulty が不正: ${recipe.difficulty}`);
    if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) problems.push(`${label} に材料がない`);
    if (!Array.isArray(recipe.steps) || recipe.steps.length < 3) problems.push(`${label} の手順が3つ未満`);
    if (!Array.isArray(recipe.seasons) || recipe.seasons.some((s) => !SEASONS.includes(s))) problems.push(`${label} の seasons が不正`);

    // 献立が組めるよう、役割タグを必ず持たせる
    if (!(recipe.tags ?? []).some((t) => ROLE_TAGS.includes(t))) {
      problems.push(`${label} に役割タグ(主菜/副菜/汁物など)がない`);
    }

    for (const ing of recipe.ingredients ?? []) {
      if (!ing.name || !ing.quantity) problems.push(`${label} の材料に name か quantity がない`);
      if (typeof ing.staple !== 'boolean') problems.push(`${label} の材料 "${ing.name}" に staple がない`);
    }

    const foreign = findForeignWords(recipe);
    if (foreign.length > 0) problems.push(`${label} に英字が混入: ${foreign.join(', ')}`);

    if (existingTitles.has(recipe.title)) problems.push(`${label} は辞書に既にある`);
    if (seen.has(recipe.title)) problems.push(`${label} がバッチ内で重複`);
    seen.add(recipe.title);
  }
}

console.log(`検証したレシピ: ${count}件`);
if (problems.length === 0) {
  console.log('問題なし');
} else {
  console.log(`問題 ${problems.length}件:`);
  for (const p of problems) console.log(`  - ${p}`);
  process.exit(1);
}
