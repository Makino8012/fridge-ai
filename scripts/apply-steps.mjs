// 手順詳細化パッチ(タイトル -> 手順配列)を data/recipes.json に反映する。
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const RECIPES = path.join(ROOT, 'data', 'recipes.json');
const SCRATCH =
  'C:/Users/user/AppData/Local/Temp/claude/C--Users-user/004132d5-0408-457a-8355-5577293ee747/scratchpad';

const patchName = process.argv[2];
if (!patchName) {
  console.error('usage: node scripts/apply-steps.mjs <patch-file.json>');
  process.exit(1);
}

const recipes = JSON.parse(fs.readFileSync(RECIPES, 'utf8'));
const patch = JSON.parse(fs.readFileSync(path.join(SCRATCH, patchName), 'utf8'));

const byTitle = new Map(recipes.map((r) => [r.title, r]));
let updated = 0;
const problems = [];

for (const [title, steps] of Object.entries(patch)) {
  const recipe = byTitle.get(title);
  if (!recipe) {
    problems.push(`NOT FOUND: ${title}`);
    continue;
  }
  if (!Array.isArray(steps) || steps.length < 3) {
    problems.push(`TOO FEW STEPS: ${title}`);
    continue;
  }
  if (steps.some((s) => typeof s !== 'string' || s.trim() === '')) {
    problems.push(`EMPTY STEP: ${title}`);
    continue;
  }
  // 英単語の混入チェック(単位や NG などの略語だけ許可)
  const ALLOWED = new Set(['ml', 'cm', 'mm', 'kg', 'NG', 'OK', 'g', 'L', 'W']);
  for (const s of steps) {
    for (const word of s.match(/[A-Za-z]+/g) ?? []) {
      if (!ALLOWED.has(word)) problems.push(`ENGLISH WORD "${word}" in ${title}`);
    }
  }
  recipe.steps = steps;
  updated++;
}

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}

fs.writeFileSync(RECIPES, JSON.stringify(recipes, null, 2) + '\n');

// 処理済みタイトルを記録し、次のバッチで重複して出さないようにする。
const DONE_FILE = path.join(ROOT, 'scripts', 'detailed-titles.json');
const done = new Set(JSON.parse(fs.readFileSync(DONE_FILE, 'utf8')));
for (const title of Object.keys(patch)) done.add(title);
fs.writeFileSync(DONE_FILE, JSON.stringify([...done], null, 0));

console.log(`updated=${updated} 詳細済み=${done.size}/${recipes.length} 残り=${recipes.length - done.size}`);
