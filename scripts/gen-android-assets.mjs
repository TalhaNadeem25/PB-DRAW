import sharp from 'sharp';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const res = join(root, 'android/app/src/main/res');

const CREAM = '#F5F2EB';
const AMBER = '#C2691A';
const BG = { r: 31, g: 74, b: 46 }; // #1F4A2E

// ── Mark SVG factory ────────────────────────────────────────────────────────
function markSvg(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 240 240" fill="none">
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
}

// ── Splash (green bg + grid + centered mark) ────────────────────────────────
async function generateSplash(w, h, outPath) {
  const short = Math.min(w, h);
  const markSize = Math.round((short * 0.56) / 0.733);

  const markBuf = await sharp(Buffer.from(markSvg(markSize)))
    .resize(markSize, markSize, { fit: 'fill' })
    .png()
    .toBuffer();

  const gapH = (markSize / w) * 60;
  const gapV = (markSize / h) * 60;
  const pad = 8, sw = 0.15;
  const gridSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100" fill="none">
  <g opacity="0.12" stroke="${CREAM}" stroke-width="${sw}" fill="none">
    <rect x="${pad}" y="${pad}" width="${100 - pad * 2}" height="${100 - pad * 2}"/>
    <line x1="${pad}" y1="50" x2="${50 - gapH}" y2="50"/>
    <line x1="${50 + gapH}" y1="50" x2="${100 - pad}" y2="50"/>
    <line x1="50" y1="${pad}" x2="50" y2="${50 - gapV}"/>
    <line x1="50" y1="${50 + gapV}" x2="50" y2="${100 - pad}"/>
  </g>
</svg>`;

  const gridBuf = await sharp(Buffer.from(gridSvg))
    .resize(w, h, { fit: 'fill' })
    .png()
    .toBuffer();

  const left = Math.round((w - markSize) / 2);
  const top  = Math.round((h - markSize) / 2);

  await sharp({ create: { width: w, height: h, channels: 3, background: BG } })
    .composite([{ input: gridBuf, top: 0, left: 0 }, { input: markBuf, top, left }])
    .png()
    .toFile(outPath);

  console.log(`✓  splash  ${outPath.replace(res + '/', '')}`);
}

// ── Full icon (green bg + mark) ─────────────────────────────────────────────
const iconSvgBuf = readFileSync(join(root, 'assets/brand/icon-1024.svg'));

async function generateIcon(size, outPath) {
  await sharp(iconSvgBuf)
    .resize(size, size, { fit: 'fill' })
    .png()
    .toFile(outPath);
  console.log(`✓  icon    ${outPath.replace(res + '/', '')}`);
}

// ── Round icon (circular mask applied) ─────────────────────────────────────
async function generateRoundIcon(size, outPath) {
  const r = size / 2;
  const circleMask = Buffer.from(
    `<svg width="${size}" height="${size}"><circle cx="${r}" cy="${r}" r="${r}" fill="white"/></svg>`
  );
  const iconBuf = await sharp(iconSvgBuf)
    .resize(size, size, { fit: 'fill' })
    .png()
    .toBuffer();

  await sharp(iconBuf)
    .composite([{ input: circleMask, blend: 'dest-in' }])
    .png()
    .toFile(outPath);
  console.log(`✓  round   ${outPath.replace(res + '/', '')}`);
}

// ── Adaptive icon background (solid green) ──────────────────────────────────
async function generateAdaptiveBg(size, outPath) {
  await sharp({ create: { width: size, height: size, channels: 3, background: BG } })
    .png()
    .toFile(outPath);
  console.log(`✓  adp-bg  ${outPath.replace(res + '/', '')}`);
}

// ── Adaptive icon foreground (mark on transparent) ──────────────────────────
async function generateAdaptiveFg(size, outPath) {
  const markSize = Math.round(size * 0.52); // fits within the 72/108dp safe zone
  const markBuf = await sharp(Buffer.from(markSvg(markSize)))
    .resize(markSize, markSize, { fit: 'fill' })
    .png()
    .toBuffer();

  const offset = Math.round((size - markSize) / 2);

  // Transparent canvas
  const canvas = await sharp({
    create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  }).png().toBuffer();

  await sharp(canvas)
    .composite([{ input: markBuf, top: offset, left: offset }])
    .png()
    .toFile(outPath);
  console.log(`✓  adp-fg  ${outPath.replace(res + '/', '')}`);
}

// ── Splash targets ──────────────────────────────────────────────────────────
const splashTargets = [
  // Portrait
  ['drawable-port-ldpi',         240,  320],
  ['drawable-port-mdpi',         320,  480],
  ['drawable-port-hdpi',         480,  800],
  ['drawable-port-xhdpi',        720, 1280],
  ['drawable-port-xxhdpi',       960, 1600],
  ['drawable-port-xxxhdpi',     1280, 1920],
  // Landscape
  ['drawable-land-ldpi',         320,  240],
  ['drawable-land-mdpi',         480,  320],
  ['drawable-land-hdpi',         800,  480],
  ['drawable-land-xhdpi',       1280,  720],
  ['drawable-land-xxhdpi',      1600,  960],
  ['drawable-land-xxxhdpi',     1920, 1280],
  // Night variants (same image — our splash is dark by default)
  ['drawable-port-night-ldpi',   240,  320],
  ['drawable-port-night-mdpi',   320,  480],
  ['drawable-port-night-hdpi',   480,  800],
  ['drawable-port-night-xhdpi',  720, 1280],
  ['drawable-port-night-xxhdpi', 960, 1600],
  ['drawable-port-night-xxxhdpi',1280, 1920],
  ['drawable-land-night-ldpi',   320,  240],
  ['drawable-land-night-mdpi',   480,  320],
  ['drawable-land-night-hdpi',   800,  480],
  ['drawable-land-night-xhdpi', 1280,  720],
  ['drawable-land-night-xxhdpi',1600,  960],
  ['drawable-land-night-xxxhdpi',1920, 1280],
  // Generic fallback
  ['drawable',                   480,  800],
  ['drawable-night',             480,  800],
];

// ── Icon targets ────────────────────────────────────────────────────────────
const iconTargets = [
  ['mipmap-ldpi',   36],
  ['mipmap-mdpi',   48],
  ['mipmap-hdpi',   72],
  ['mipmap-xhdpi',  96],
  ['mipmap-xxhdpi', 144],
  ['mipmap-xxxhdpi',192],
];

// Adaptive icon foreground/background sizes match the 108dp adaptive canvas
const adaptiveTargets = [
  ['mipmap-ldpi',    81],
  ['mipmap-mdpi',   108],
  ['mipmap-hdpi',   162],
  ['mipmap-xhdpi',  216],
  ['mipmap-xxhdpi', 324],
  ['mipmap-xxxhdpi',432],
];

// ── Run ─────────────────────────────────────────────────────────────────────
console.log('\n── Splash screens ──');
for (const [dir, w, h] of splashTargets) {
  await generateSplash(w, h, join(res, dir, 'splash.png'));
}

console.log('\n── App icons ──');
for (const [dir, size] of iconTargets) {
  await generateIcon(size, join(res, dir, 'ic_launcher.png'));
  await generateRoundIcon(size, join(res, dir, 'ic_launcher_round.png'));
}

console.log('\n── Adaptive icon layers ──');
for (const [dir, size] of adaptiveTargets) {
  await generateAdaptiveBg(size, join(res, dir, 'ic_launcher_background.png'));
  await generateAdaptiveFg(size, join(res, dir, 'ic_launcher_foreground.png'));
}

console.log('\nDone.');
