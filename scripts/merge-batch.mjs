import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const RECIPES = path.join(ROOT, 'data', 'recipes.json');
const SCRATCH =
  'C:/Users/user/AppData/Local/Temp/claude/C--Users-user/004132d5-0408-457a-8355-5577293ee747/scratchpad';
const BATCHES = ['batch18.json', 'batch19.json'];

const existing = JSON.parse(fs.readFileSync(RECIPES, 'utf8'));
const titles = new Set(existing.map((r) => r.title));

const REQUIRED = ['title', 'difficulty', 'cookingTimeMinutes', 'ingredients', 'steps', 'tags', 'seasons'];
let added = 0;
let skipped = 0;
const problems = [];

for (const file of BATCHES) {
  const batch = JSON.parse(fs.readFileSync(path.join(SCRATCH, file), 'utf8'));
  for (const r of batch) {
    for (const key of REQUIRED) {
      if (r[key] === undefined) problems.push(`${file}: "${r.title ?? '?'}" missing ${key}`);
    }
    if (!Array.isArray(r.ingredients) || r.ingredients.length === 0)
      problems.push(`${file}: "${r.title}" has no ingredients`);
    if (!Array.isArray(r.steps) || r.steps.length === 0)
      problems.push(`${file}: "${r.title}" has no steps`);
    if (titles.has(r.title)) {
      skipped++;
      continue;
    }
    titles.add(r.title);
    existing.push(r);
    added++;
  }
}

if (problems.length) {
  console.error('VALIDATION PROBLEMS:\n' + problems.join('\n'));
  process.exit(1);
}

fs.writeFileSync(RECIPES, JSON.stringify(existing, null, 2) + '\n');
console.log(`added=${added} skipped(dup)=${skipped} total=${existing.length}`);
