import { Header } from '@/components/layout/header';
import { ShoppingListView } from '@/features/shopping-list/components/shopping-list-view';
import { listShoppingItems } from '@/services/shopping-list/shopping-list-service';
import { getCurrentHouseholdId } from '@/services/household/household-service';

export default async function ShoppingListPage() {
  const [items, householdId] = await Promise.all([listShoppingItems(), getCurrentHouseholdId()]);

  return (
    <>
      <Header title="買い物リスト" />
      <div className="px-4 md:px-0">
        <ShoppingListView initialItems={items} householdId={householdId} />
      </div>
    </>
  );
}
