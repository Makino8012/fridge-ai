'use client';

import { useState, useTransition } from 'react';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toggleFavoriteAction } from '@/features/recipes/actions';
import type { RecipeSuggestion } from '@/lib/ai/types';

export function FavoriteButton({ recipe, className }: { recipe: RecipeSuggestion; className?: string }) {
  const [favorited, setFavorited] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    const next = !favorited;
    setFavorited(next);
    startTransition(async () => {
      const result = await toggleFavoriteAction(recipe);
      if (!result.success) {
        setFavorited(!next);
        toast.error(result.error);
      }
    });
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn('size-8 shrink-0', className)}
      disabled={isPending}
      onClick={(e) => {
        e.stopPropagation();
        handleClick();
      }}
      aria-label="お気に入り"
    >
      <Heart className={cn('size-4.5', favorited && 'fill-destructive text-destructive')} />
    </Button>
  );
}
