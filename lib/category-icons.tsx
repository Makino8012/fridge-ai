import { Beef, CupSoda, FlaskConical, Carrot, Fish, Shapes, Snowflake, type LucideIcon } from 'lucide-react';
import type { CategoryId } from '@/types/database.types';

export const CATEGORY_ICONS: Record<CategoryId, LucideIcon> = {
  vegetable: Carrot,
  meat: Beef,
  fish: Fish,
  drink: CupSoda,
  frozen: Snowflake,
  seasoning: FlaskConical,
  other: Shapes,
};
