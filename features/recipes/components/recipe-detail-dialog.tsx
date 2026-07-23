import { Check, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { FavoriteButton } from '@/features/recipes/components/favorite-button';
import type { RecipeSuggestion } from '@/lib/ai/types';

const DIFFICULTY_LABEL: Record<string, string> = { easy: '簡単', normal: '普通', hard: '本格的' };

export function RecipeDetailDialog({
  recipe,
  open,
  onOpenChange,
}: {
  recipe: RecipeSuggestion | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!recipe) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-start justify-between gap-2 pr-6">
            <DialogTitle>{recipe.title}</DialogTitle>
            <FavoriteButton recipe={recipe} />
          </div>
        </DialogHeader>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="font-normal">
            難易度: {DIFFICULTY_LABEL[recipe.difficulty]}
          </Badge>
          <Badge variant="outline" className="font-normal">
            調理時間: {recipe.cookingTimeMinutes}分
          </Badge>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold">必要な材料</h3>
          <ul className="space-y-1 text-sm">
            {recipe.ingredients.map((ing, i) => (
              <li key={i} className="flex items-center gap-2">
                {ing.owned ? (
                  <Check className="size-4 text-success" />
                ) : (
                  <X className="size-4 text-muted-foreground" />
                )}
                <span className={!ing.owned ? 'text-muted-foreground' : ''}>
                  {ing.name} {ing.quantity}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold">作り方</h3>
          <ol className="space-y-2 text-sm">
            {recipe.steps.map((step, i) => (
              <li key={i} className="flex gap-2">
                <span className="shrink-0 font-medium text-muted-foreground">{i + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </DialogContent>
    </Dialog>
  );
}
