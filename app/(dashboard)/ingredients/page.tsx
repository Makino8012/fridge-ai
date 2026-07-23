import { Header } from '@/components/layout/header';
import { IngredientList } from '@/features/ingredients/components/ingredient-list';
import { listIngredients } from '@/services/ingredients/ingredient-service';
import { getCurrentHouseholdId } from '@/services/household/household-service';

export default async function IngredientsPage() {
  const [ingredients, householdId] = await Promise.all([listIngredients(), getCurrentHouseholdId()]);

  return (
    <>
      <Header title="在庫一覧" />
      <div className="px-4 md:px-0">
        <IngredientList initialIngredients={ingredients} householdId={householdId} />
      </div>
    </>
  );
}
