// 手順を詳細化する対象を、指定件数ずつ材料つきで書き出す作業用スクリプト。
// scripts/detailed-titles.json に記録済みのレシピは対象から除外する。
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const recipes = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'recipes.json'), 'utf8'));
const done = new Set(JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts', 'detailed-titles.json'), 'utf8')));

const size = Number(process.argv[2] ?? 50);
const need = recipes.filter((r) => !done.has(r.title));

console.log(`残り${need.length}品 / このバッチ${Math.min(size, need.length)}品`);
for (const r of need.slice(0, size)) {
  const ing = r.ingredients.map((i) => `${i.name}${i.quantity}`).join('、');
  console.log(`@@ ${r.title} | ${r.cookingTimeMinutes}分 | ${ing}`);
}
