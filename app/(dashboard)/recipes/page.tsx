import { Header } from '@/components/layout/header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SuggestRecipesPanel } from '@/features/recipes/components/suggest-recipes-panel';
import { SeasonalPanel } from '@/features/recipes/components/seasonal-panel';
import { BrowsePanel } from '@/features/recipes/components/browse-panel';
import { UseUpPanel } from '@/features/recipes/components/use-up-panel';
import { MissingIngredientsPanel } from '@/features/recipes/components/missing-ingredients-panel';
import { MenuPlanPanel } from '@/features/menu-plan/components/menu-plan-panel';
import { FavoritesList } from '@/features/recipes/components/favorites-list';
import { HistoryList } from '@/features/recipes/components/history-list';
import { getFavorites, getHistory } from '@/services/recipes/recipe-service';
import { RECIPE_COUNT, getBrowseRecipes } from '@/services/recipes/local-recipe-service';
import { getTonightPicks } from '@/services/dashboard/dashboard-service';

export default async function RecipesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const [favorites, history, initialBrowse, picks, params] = await Promise.all([
    getFavorites(),
    getHistory(),
    getBrowseRecipes({}),
    getTonightPicks(),
    searchParams,
  ]);

  // ホームの「早めに使いたい食材」から ?tab=useup で直接開けるようにする。
  const defaultTab = params.tab === 'useup' ? 'useup' : 'suggest';

  return (
    <>
      <Header title="レシピ提案" />
      <div className="px-4 md:px-0">
        <Tabs defaultValue={defaultTab}>
          <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
            <TabsList className="w-max">
              <TabsTrigger value="suggest">作れる</TabsTrigger>
              <TabsTrigger value="useup">使い切り</TabsTrigger>
              <TabsTrigger value="browse">一覧</TabsTrigger>
              <TabsTrigger value="seasonal">旬</TabsTrigger>
              <TabsTrigger value="missing">買い足せば作れる</TabsTrigger>
              <TabsTrigger value="menu">献立</TabsTrigger>
              <TabsTrigger value="favorites">お気に入り</TabsTrigger>
              <TabsTrigger value="history">履歴</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="suggest" className="mt-4">
            <SuggestRecipesPanel />
          </TabsContent>
          <TabsContent value="useup" className="mt-4">
            <UseUpPanel targets={picks.expiring} />
          </TabsContent>
          <TabsContent value="browse" className="mt-4">
            <BrowsePanel totalCount={RECIPE_COUNT} initialResults={initialBrowse} />
          </TabsContent>
          <TabsContent value="seasonal" className="mt-4">
            <SeasonalPanel />
          </TabsContent>
          <TabsContent value="missing" className="mt-4">
            <MissingIngredientsPanel />
          </TabsContent>
          <TabsContent value="menu" className="mt-4">
            <MenuPlanPanel />
          </TabsContent>
          <TabsContent value="favorites" className="mt-4">
            <FavoritesList favorites={favorites} />
          </TabsContent>
          <TabsContent value="history" className="mt-4">
            <HistoryList history={history} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
