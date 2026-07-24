// バーコード(JAN/EAN)から商品名を照会する。無料のOpen Food Facts APIを利用。
// 日本の商品は登録が限定的なため、見つからないこともある(その場合は名前を手入力してもらう)。

interface OpenFoodFactsResponse {
  status: number;
  product?: {
    product_name?: string;
    product_name_ja?: string;
    generic_name_ja?: string;
    generic_name?: string;
    brands?: string;
  };
}

export interface BarcodeLookupResult {
  found: boolean;
  name: string | null;
}

export async function lookupBarcode(barcode: string): Promise<BarcodeLookupResult> {
  const code = barcode.trim();
  if (!/^\d{8,14}$/.test(code)) {
    return { found: false, name: null };
  }

  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=product_name,product_name_ja,generic_name_ja,generic_name,brands`,
      {
        headers: { 'User-Agent': 'Kukku/1.0 (household fridge app)' },
        // 商品マスタは頻繁には変わらないため一定時間キャッシュ
        next: { revalidate: 60 * 60 * 24 },
      },
    );

    if (!res.ok) return { found: false, name: null };

    const data = (await res.json()) as OpenFoodFactsResponse;
    if (data.status !== 1 || !data.product) return { found: false, name: null };

    const p = data.product;
    const name =
      p.product_name_ja || p.generic_name_ja || p.product_name || p.generic_name || null;

    return { found: Boolean(name), name: name ? name.trim() : null };
  } catch {
    return { found: false, name: null };
  }
}
