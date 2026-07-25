'use client';

import { useState } from 'react';
import { Heart, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FavoritesList } from '@/features/recipes/components/favorites-list';
import { HistoryList } from '@/features/recipes/components/history-list';
import type { Database } from '@/types/database.types';

type FavoriteRow = Database['public']['Tables']['recipe_favorites']['Row'];
type HistoryRow = Database['public']['Tables']['recipe_history']['Row'];

/** お気に入りと履歴を1つのタブにまとめる。 */
export function SavedSection({
  favorites,
  history,
}: {
  favorites: FavoriteRow[];
  history: HistoryRow[];
}) {
  const [mode, setMode] = useState<'favorites' | 'history'>('favorites');

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          type="button"
          variant={mode === 'favorites' ? 'default' : 'outline'}
          size="sm"
          className="h-9 rounded-full px-4 font-normal"
          onClick={() => setMode('favorites')}
        >
          <Heart className="size-4" />
          お気に入り {favorites.length > 0 && favorites.length}
        </Button>
        <Button
          type="button"
          variant={mode === 'history' ? 'default' : 'outline'}
          size="sm"
          className="h-9 rounded-full px-4 font-normal"
          onClick={() => setMode('history')}
        >
          <History className="size-4" />
          履歴
        </Button>
      </div>

      {mode === 'favorites' ? (
        <FavoritesList favorites={favorites} />
      ) : (
        <HistoryList history={history} />
      )}
    </div>
  );
}
