import type { MenuPlanInput } from '@/lib/ai/types';
import { formatDietaryPreferencesForPrompt, formatIngredientsForPrompt } from './system';

const TIMEFRAME_LABEL: Record<MenuPlanInput['timeframe'], string> = {
  today_dinner: '今日の夕食1食分',
  tomorrow_breakfast: '明日の朝食1食分',
  this_week: '今週(平日5日分)の夕食',
};

export function buildMenuPlanPrompt(input: MenuPlanInput): string {
  return `現在の在庫食材:
${formatIngredientsForPrompt(input.ingredients)}

${formatDietaryPreferencesForPrompt(input.dietaryPreferences)}

${TIMEFRAME_LABEL[input.timeframe]}の献立を提案してください。
${input.timeframe === 'this_week' ? '5日分、それぞれ mealLabel に「月曜日」のように曜日を入れてください。' : 'plansは1件で構いません。mealLabelには献立の呼び名を入れてください。'}
在庫食材をできるだけ使い切れるよう、複数日にまたがる場合は食材が偏らないようにしてください。`;
}
