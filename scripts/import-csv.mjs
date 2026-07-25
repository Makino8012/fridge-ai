// 高タンパクレシピのCSVを data/recipes.json の形式に変換して取り込む。
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const RECIPES = path.join(ROOT, 'data', 'recipes.json');
const CSV = process.argv[2];

if (!CSV) {
  console.error('usage: node scripts/import-csv.mjs <csv-path>');
  process.exit(1);
}

/** 引用符内の改行・カンマに対応した簡易CSVパーサ。 */
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\r') {
      /* 無視 */
    } else if (c === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else field += c;
  }
  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

// CSVのカテゴリを、アプリのタグに対応させる。
const CATEGORY_TAGS = {
  '鶏肉（むね・ささみ）': ['主菜', '鶏肉'],
  '大豆製品・卵': ['主菜', '豆腐'],
  魚介類: ['主菜', '魚'],
  '主食系（オートミール・お米）': ['ご飯', 'ヘルシー'],
  'スイーツ・プロテイン': ['デザート', 'ヘルシー'],
};

// 常備調味料とみなす材料(在庫照合の対象外にする)。
const STAPLE_WORDS = [
  '塩', 'こしょう', '胡椒', '醤油', 'しょうゆ', '味噌', 'みそ', '砂糖', '酢', 'みりん', '酒',
  '油', 'オイル', 'ソース', 'ケチャップ', 'マヨネーズ', 'めんつゆ', 'ポン酢', 'だし',
  'コンソメ', '鶏ガラスープの素', '鶏がらスープの素', 'カレー粉', 'にんにく', 'ニンニク',
  '生姜', 'しょうが', 'ショウガ', '片栗粉', '小麦粉', 'パン粉', 'ごま', 'ゴマ', 'はちみつ',
  'コチュジャン', '豆板醤', 'オイスター', 'ラー油', '七味', 'わさび', 'からし', 'バニラ',
  'ベーキングパウダー', 'レモン汁', '水',
];

// 「筋トレ」タグを付ける下限(1人分のタンパク質g)。
const TRAINING_TAG_THRESHOLD = 20;

function isStaple(name) {
  return STAPLE_WORDS.some((w) => name.includes(w));
}

/** 「鶏むね肉: 600g、」の一覧を材料の配列にする。 */
function parseIngredients(text) {
  return text
    .split(/[、\n]/)
    .map((line) => line.trim())
    .filter((line) => line !== '')
    .map((line) => {
      const index = line.indexOf(':');
      const name = (index === -1 ? line : line.slice(0, index)).trim();
      const quantity = (index === -1 ? '適量' : line.slice(index + 1)).trim() || '適量';
      return { name, quantity, staple: isStaple(name) };
    })
    .filter((ing) => ing.name !== '');
}

/** 「1. 〜」の手順を配列にする。 */
function parseSteps(text) {
  return text
    .split('\n')
    .map((line) => line.trim().replace(/^\d+[.．)]\s*/, ''))
    .filter((line) => line !== '');
}

/** 調理時間はレシピ内容から推定する(CSVに項目がないため)。 */
function estimateMinutes(steps, ingredients) {
  const all = steps.join('') + ingredients.map((i) => i.name).join('');
  if (/オーブン|焼き上げ|冷やし固め|一晩/.test(all)) return 40;
  if (/煮込|30分|20分/.test(all)) return 30;
  if (/レンジ|混ぜるだけ|和える/.test(all)) return 15;
  return 20;
}

function estimateDifficulty(steps) {
  if (steps.length >= 8) return 'hard';
  if (steps.length >= 5) return 'normal';
  return 'easy';
}

const rows = parseCSV(fs.readFileSync(CSV, 'utf8').replace(/^﻿/, ''));
const recipes = JSON.parse(fs.readFileSync(RECIPES, 'utf8'));
const existing = new Set(recipes.map((r) => r.title));

let added = 0;
let skipped = 0;
const problems = [];

for (const row of rows.slice(1)) {
  if (row.length < 6 || !row[2]) continue;
  const [, category, title, ingredientsText, stepsText, proteinText] = row;

  if (existing.has(title)) {
    skipped++;
    continue;
  }

  const ingredients = parseIngredients(ingredientsText);
  const steps = parseSteps(stepsText);

  if (ingredients.length === 0) problems.push(`材料なし: ${title}`);
  if (steps.length < 3) problems.push(`手順が少ない: ${title}`);

  // CSVの「推定タンパク質(2人前合計)」を1人分に直して持たせる。
  const total = Number((proteinText ?? '').replace(/[^0-9]/g, ''));
  const proteinPerServing = Number.isFinite(total) && total > 0 ? Math.round(total / 2) : undefined;

  // 実際に高タンパクなものだけ「筋トレ」タグを付ける(表示と中身をそろえる)。
  const tags = [...(CATEGORY_TAGS[category] ?? ['主菜'])];
  if (proteinPerServing !== undefined && proteinPerServing >= TRAINING_TAG_THRESHOLD) {
    tags.push('筋トレ', '高タンパク');
  } else {
    tags.push('ヘルシー');
  }

  recipes.push({
    title,
    difficulty: estimateDifficulty(steps),
    cookingTimeMinutes: estimateMinutes(steps, ingredients),
    ingredients,
    steps,
    tags,
    seasons: ['all'],
    ...(proteinPerServing !== undefined ? { proteinPerServing } : {}),
  });
  existing.add(title);
  added++;
}

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}

fs.writeFileSync(RECIPES, JSON.stringify(recipes, null, 2) + '\n');
console.log(`added=${added} skipped(dup)=${skipped} total=${recipes.length}`);
