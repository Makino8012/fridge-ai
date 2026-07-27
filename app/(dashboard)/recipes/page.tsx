import { Header } from '@/components/layout/header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BrowsePanel } from '@/features/recipes/components/browse-panel';
import { SuggestSection } from '@/features/recipes/components/suggest-section';
import { SavedSection } from '@/features/recipes/components/saved-section';
import { getFavorites, getHistory } from '@/services/recipes/recipe-service';
import { RECIPE_COUNT, getBrowseRecipes } from '@/services/recipes/local-recipe-service';
import { getTonightPicks } from '@/services/dashboard/dashboard-service';
import { getCurrentProfile } from '@/services/household/household-service';

export default async function RecipesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const [favorites, history, initialBrowse, picks, profile, params] = await Promise.all([
    getFavorites(),
    getHistory(),
    getBrowseRecipes({}),
    getTonightPicks(),
    getCurrentProfile(),
    searchParams,
  ]);

  // 設定の食事方針(高タンパク)を献立の初期値に使う。
  const prefs = profile?.dietary_preferences as { diet?: string } | null;
  const highProtein = prefs?.diet === 'high_protein';

  // ホームの「早めに使いたい食材」から ?tab=useup で使い切りを直接開けるようにする。
  const initialMode = params.tab === 'useup' ? 'useup' : 'makeable';

  return (
    <>
      <Header title="レシピ" />
      <div className="space-y-4 px-4 md:px-0">
        <Tabs defaultValue="suggest">
          <TabsList className="w-full">
            <TabsTrigger value="suggest" className="flex-1">
              提案
            </TabsTrigger>
            <TabsTrigger value="browse" className="flex-1">
              一覧
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex-1">
              保存
            </TabsTrigger>
          </TabsList>

          <TabsContent value="suggest" className="mt-4">
            <SuggestSection
              useUpTargets={picks.expiring}
              initialMode={initialMode}
              highProtein={highProtein}
            />
          </TabsContent>
          <TabsContent value="browse" className="mt-4">
            <BrowsePanel totalCount={RECIPE_COUNT} initialListing={initialBrowse} />
          </TabsContent>
          <TabsContent value="saved" className="mt-4">
            <SavedSection favorites={favorites} history={history} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
