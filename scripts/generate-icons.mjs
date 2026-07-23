// PWAアイコン生成スクリプト。ロゴを差し替えたら `node scripts/generate-icons.mjs` で再生成する。
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'public', 'icons');
mkdirSync(outDir, { recursive: true });

const svg = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="112" fill="#fb923c"/>
  <rect x="140" y="96" width="232" height="320" rx="28" fill="white"/>
  <rect x="140" y="96" width="232" height="96" rx="28" fill="white"/>
  <rect x="164" y="132" width="10" height="36" rx="5" fill="#fb923c"/>
  <rect x="164" y="228" width="10" height="36" rx="5" fill="#fb923c"/>
  <line x1="140" y1="204" x2="372" y2="204" stroke="#fb923c" stroke-width="8"/>
</svg>
`;

const targets = [
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
  { file: 'apple-touch-icon.png', size: 180 },
  { file: 'maskable-icon-512.png', size: 512 },
];

for (const t of targets) {
  await sharp(Buffer.from(svg)).resize(t.size, t.size).png().toFile(path.join(outDir, t.file));
  console.log(`generated ${t.file}`);
}
