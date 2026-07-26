import { Header } from '@/components/layout/header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IngredientList } from '@/features/ingredients/components/ingredient-list';
import { PANTRY_ITEMS, PantrySetupCard } from '@/features/ingredients/components/pantry-setup-card';
import { StapleFoodsPanel } from '@/features/ingredients/components/staple-foods-panel';
import { listIngredients } from '@/services/ingredients/ingredient-service';
import { getCurrentHouseholdId } from '@/services/household/household-service';

/**
 * 常備調味料をこの数だけ登録していれば、案内は出さない。
 * 設定画面からいつでも追加できるので、一覧の邪魔をし続けないようにする。
 */
const PANTRY_PROMPT_THRESHOLD = 3;

export default async function IngredientsPage() {
  const [ingredients, householdId] = await Promise.all([listIngredients(), getCurrentHouseholdId()]);

  // 調味料が登録されていないと「作れるレシピ」がほとんど出ないので、
  // 最初のうちだけ在庫画面にも登録カードを出す。設定画面に埋もれると気づかれない。
  const names = ingredients.map((i) => i.name);
  const registeredPantryCount = PANTRY_ITEMS.filter((item) => names.includes(item)).length;

  return (
    <>
      <Header title="在庫" />
      <div className="space-y-4 px-4 md:px-0">
        <Tabs defaultValue="list">
          <TabsList className="w-full">
            <TabsTrigger value="list" className="flex-1">
              一覧
            </TabsTrigger>
            <TabsTrigger value="staples" className="flex-1">
              定番
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="mt-4 space-y-4">
            {registeredPantryCount < PANTRY_PROMPT_THRESHOLD && (
              <PantrySetupCard existingNames={names} />
            )}
            <IngredientList initialIngredients={ingredients} householdId={householdId} />
          </TabsContent>

          <TabsContent value="staples" className="mt-4">
            <StapleFoodsPanel ingredients={ingredients} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
