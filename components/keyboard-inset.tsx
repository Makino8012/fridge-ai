'use client';

import { useEffect } from 'react';

/**
 * スマホでキーボードが開いたときの高さを CSS 変数 --kb-inset に入れる。
 *
 * iOS Safari はキーボードが出てもページ自体は縮まないため、画面下に固定した
 * ボタンやドロワーがキーボードの裏に隠れてしまう。VisualViewport で実際に
 * 見えている高さを測り、その差分を各所の余白に使えるようにする。
 */
export function KeyboardInset() {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const update = () => {
      // 画面の高さと、実際に見えている領域の差がキーボードの高さ。
      const inset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      document.documentElement.style.setProperty('--kb-inset', `${Math.round(inset)}px`);
      // 端末のURLバー分の変動を拾わないよう、ある程度の高さがあるときだけ「開いた」とみなす。
      document.documentElement.classList.toggle('keyboard-open', inset > 120);
    };

    update();
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);
    return () => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
      document.documentElement.style.removeProperty('--kb-inset');
      document.documentElement.classList.remove('keyboard-open');
    };
  }, []);

  return null;
}
