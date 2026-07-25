import {
  Apple,
  Beef,
  Croissant,
  CupSoda,
  Egg,
  FlaskConical,
  Carrot,
  Fish,
  Milk,
  Shapes,
  Snowflake,
  Soup,
  Wheat,
  type LucideIcon,
} from 'lucide-react';
import type { CategoryId } from '@/types/database.types';

export const CATEGORY_ICONS: Record<CategoryId, LucideIcon> = {
  vegetable: Carrot,
  fruit: Apple,
  meat: Beef,
  fish: Fish,
  egg: Egg,
  dairy: Milk,
  noodle: Soup,
  bread: Croissant,
  grain: Wheat,
  drink: CupSoda,
  frozen: Snowflake,
  seasoning: FlaskConical,
  other: Shapes,
};
