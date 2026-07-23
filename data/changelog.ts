export interface ChangelogEntry {
  version: string;
  date: string; // YYYY-MM-DD
  changes: string[];
}

// 大きな変更があったときにこの配列の先頭に追記する。
export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '1.1.0',
    date: '2026-07-24',
    changes: [
      'アプリ名を「Kukku」に変更',
      'レシピ辞書を約200種類に拡張（和洋中・季節料理を網羅）',
      '「旬」タブを追加し、季節の食材を使ったレシピを提案',
      'レシピ提案に無料モード（在庫から探す）を追加。AIは任意',
    ],
  },
  {
    version: '1.0.0',
    date: '2026-07-23',
    changes: [
      '初回リリース',
      '食材の在庫管理（登録・編集・ワンタップ増減・賞味期限管理）',
      'AIレシピ提案・献立提案・買い物リスト',
      '招待URLによる世帯共有とリアルタイム同期',
      'ダークモード・PWA対応',
    ],
  },
];

export const APP_VERSION = CHANGELOG[0]?.version ?? '1.0.0';
