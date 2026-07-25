import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const RECIPES = path.join(ROOT, 'data', 'recipes.json');
const SCRATCH =
  'C:/Users/user/AppData/Local/Temp/claude/C--Users-user/004132d5-0408-457a-8355-5577293ee747/scratchpad';
const PATCH = path.join(SCRATCH, 'steps-patch2.json');

const recipes = JSON.parse(fs.readFileSync(RECIPES, 'utf8'));
const patch = JSON.parse(fs.readFileSync(PATCH, 'utf8'));

const byTitle = new Map(recipes.map((r) => [r.title, r]));
let updated = 0;
const missing = [];

for (const [title, steps] of Object.entries(patch)) {
  const recipe = byTitle.get(title);
  if (!recipe) {
    missing.push(title);
    continue;
  }
  if (!Array.isArray(steps) || steps.length === 0) {
    console.error(`invalid steps for ${title}`);
    process.exit(1);
  }
  recipe.steps = steps;
  updated++;
}

if (missing.length) {
  console.error('NOT FOUND:\n' + missing.join('\n'));
  process.exit(1);
}

fs.writeFileSync(RECIPES, JSON.stringify(recipes, null, 2) + '\n');
console.log(`updated=${updated} total=${recipes.length}`);
