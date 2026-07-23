import { Heart } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { RecipeSuggestionCard } from '@/features/recipes/components/recipe-suggestion-card';
import type { RecipeSuggestion } from '@/lib/ai/types';
import type { Database } from '@/types/database.types';

type RecipeFavoriteRow = Database['public']['Tables']['recipe_favorites']['Row'];

export function FavoritesList({ favorites }: { favorites: RecipeFavoriteRow[] }) {
  if (favorites.length === 0) {
    return (
      <EmptyState icon={Heart} title="お気に入りはまだありません" description="レシピのハートマークで保存できます" />
    );
  }

  return (
    <div className="space-y-2.5">
      {favorites.map((fav) => (
        <RecipeSuggestionCard key={fav.id} recipe={fav.recipe_data as unknown as RecipeSuggestion} />
      ))}
    </div>
  );
}
