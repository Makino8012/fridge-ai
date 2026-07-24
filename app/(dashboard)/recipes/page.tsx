import { Header } from '@/components/layout/header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SuggestRecipesPanel } from '@/features/recipes/components/suggest-recipes-panel';
import { SeasonalPanel } from '@/features/recipes/components/seasonal-panel';
import { BrowsePanel } from '@/features/recipes/components/browse-panel';
import { MissingIngredientsPanel } from '@/features/recipes/components/missing-ingredients-panel';
import { MenuPlanPanel } from '@/features/menu-plan/components/menu-plan-panel';
import { FavoritesList } from '@/features/recipes/components/favorites-list';
import { HistoryList } from '@/features/recipes/components/history-list';
import { getFavorites, getHistory } from '@/services/recipes/recipe-service';
import { RECIPE_COUNT } from '@/services/recipes/local-recipe-service';

export default async function RecipesPage() {
  const [favorites, history] = await Promise.all([getFavorites(), getHistory()]);

  return (
    <>
      <Header title="レシピ提案" />
      <div className="px-4 md:px-0">
        <Tabs defaultValue="suggest">
          <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
            <TabsList className="w-max">
              <TabsTrigger value="suggest">作れる</TabsTrigger>
              <TabsTrigger value="browse">一覧</TabsTrigger>
              <TabsTrigger value="seasonal">旬</TabsTrigger>
              <TabsTrigger value="missing">あと1品</TabsTrigger>
              <TabsTrigger value="menu">献立</TabsTrigger>
              <TabsTrigger value="favorites">お気に入り</TabsTrigger>
              <TabsTrigger value="history">履歴</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="suggest" className="mt-4">
            <SuggestRecipesPanel />
          </TabsContent>
          <TabsContent value="browse" className="mt-4">
            <BrowsePanel totalCount={RECIPE_COUNT} />
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
