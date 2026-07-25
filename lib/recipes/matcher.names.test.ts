import { describe, expect, it } from 'vitest';
import { namesMatch } from './matcher';

describe('namesMatch / 同じ食材とみなすべきもの', () => {
  const same: [string, string][] = [
    ['豚肉', '豚こま肉'],
    ['鶏もも肉', '鶏肉'],
    ['トマト', 'ミニトマト'],
    ['のり', '刻みのり'],
    ['チーズ', '粉チーズ'],
    ['大根', '大根おろし'],
    ['卵', '卵黄'],
    ['キャベツ', '春キャベツ'],
    ['玉ねぎ', '新玉ねぎ'],
    ['しめじ', 'ぶなしめじ'],
    ['にんじん', '人参'],
  ];

  it.each(same)('%s と %s は同じ食材', (a, b) => {
    expect(namesMatch(a, b)).toBe(true);
  });
});

describe('namesMatch / 別の食材として区別すべきもの', () => {
  // 以前は部分一致だったため、これらを「在庫にある」と誤判定していた
  const different: [string, string][] = [
    ['ねぎ', '玉ねぎ'],
    ['油', '油揚げ'],
    ['ごま', 'ごま油'],
    ['塩', '塩昆布'],
    ['卵', 'うずら卵'],
    ['米', 'もち米'],
    ['豆腐', '厚揚げ'],
    ['牛乳', '牛肉'],
    ['酒', '日本酒'],
    ['玉ねぎ', 'にんじん'],
  ];

  it.each(different)('%s と %s は別の食材', (a, b) => {
    expect(namesMatch(a, b)).toBe(false);
  });
});
