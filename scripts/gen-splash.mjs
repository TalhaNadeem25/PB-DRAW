import sharp from 'sharp';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const sizes = [
  { name: 'splash-2732x2732.png',                 w: 2732, h: 2732 },
  { name: 'splash-2732x2732-1.png',               w: 2732, h: 2732 },
  { name: 'splash-2732x2732-2.png',               w: 2732, h: 2732 },
  { name: 'Default@1x~universal~anyany.png',       w:  390, h:  844 },
  { name: 'Default@2x~universal~anyany.png',       w:  780, h: 1688 },
  { name: 'Default@3x~universal~anyany.png',       w: 1170, h: 2532 },
  { name: 'Default@1x~universal~anyany-dark.png',  w:  390, h:  844 },
  { name: 'Default@2x~universal~anyany-dark.png',  w:  780, h: 1688 },
  { name: 'Default@3x~universal~anyany-dark.png',  w: 1170, h: 2532 },
];

const CREAM = '#F5F2EB';
const AMBER = '#C2691A';
// #1F4A2E as RGB
const BG_R = 31, BG_G = 74, BG_B = 46;

async function generate(w, h, outPath) {
  const short = Math.min(w, h);

  // ── 1. Mark PNG ────────────────────────────────────────────────────────────
  // Content spans ~73% of the 240×240 viewBox. Target content = 56% of short side.
  const markSize = Math.round((short * 0.56) / 0.733);

  const markSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${markSize}" height="${markSize}" viewBox="0 0 240 240" fill="none">
  <g stroke="${CREAM}" stroke-width="18" stroke-linecap="square" fill="none">
    <path d="M 40 56 L 96 56"/>
    <path d="M 40 184 L 96 184"/>
    <path d="M 96 56 L 96 96"/>
    <path d="M 96 184 L 96 144"/>
    <path d="M 96 96 L 144 96"/>
    <path d="M 96 144 L 144 144"/>
    <path d="M 144 96 L 144 144"/>
    <path d="M 144 120 L 188 120"/>
  </g>
  <circle cx="200" cy="120" r="12" fill="${AMBER}"/>
</svg>`;

  const markBuf = await sharp(Buffer.from(markSvg))
    .resize(markSize, markSize, { fit: 'fill' })
    .png()
    .toBuffer();

  // ── 2. Grid PNG ────────────────────────────────────────────────────────────
  // Draw into a 100×100 normalised space then scale to exact canvas size.
  const gapH = (markSize / w)  * 60;  // horizontal gap radius in normalised units
  const gapV = (markSize / h)  * 60;  // vertical gap radius
  const pad  = 8;
  const sw   = 0.15;

  const gridSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100" fill="none">
  <g opacity="0.12" stroke="${CREAM}" stroke-width="${sw}" fill="none">
    <rect x="${pad}" y="${pad}" width="${100 - pad * 2}" height="${100 - pad * 2}"/>
    <line x1="${pad}"       y1="50" x2="${50 - gapH}" y2="50"/>
    <line x1="${50 + gapH}" y1="50" x2="${100 - pad}" y2="50"/>
    <line x1="50" y1="${pad}"       x2="50" y2="${50 - gapV}"/>
    <line x1="50" y1="${50 + gapV}" x2="50" y2="${100 - pad}"/>
  </g>
</svg>`;

  const gridBuf = await sharp(Buffer.from(gridSvg))
    .resize(w, h, { fit: 'fill' })
    .png()
    .toBuffer();

  // ── 3. Compose: solid BG + grid + mark centered ───────────────────────────
  const left = Math.round((w - markSize) / 2);
  const top  = Math.round((h - markSize) / 2);

  await sharp({
    create: { width: w, height: h, channels: 3, background: { r: BG_R, g: BG_G, b: BG_B } },
  })
    .composite([
      { input: gridBuf,  top: 0,   left: 0    },
      { input: markBuf,  top,      left        },
    ])
    .png()
    .toFile(outPath);

  console.log(`✓  ${outPath.split('/').pop()}  (${w}×${h})`);
}

const outDir = join(root, 'ios/App/App/Assets.xcassets/Splash.imageset');
for (const { name, w, h } of sizes) {
  await generate(w, h, join(outDir, name));
}
console.log('\nDone.');
