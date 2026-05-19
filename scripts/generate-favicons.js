// One-shot favicon variant generator from public/favicon.svg.
// Run when the source favicon SVG changes.
//   node scripts/generate-favicons.js
//
// Outputs (all written to public/):
//   favicon-96x96.png    â€” browser tab fallback
//   apple-touch-icon.png â€” iOS home screen (180Ã—180)
//   icon-192.png         â€” PWA manifest
//   icon-512.png         â€” PWA manifest
//
// All variants get a Star Wars Unlimited-kelp background (#1C1C1A) so the gold icon
// reads well in browser tab strips and on iOS dark/light home screens.
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const SRC = path.join(process.cwd(), 'public', 'favicon.svg');
const OUT = path.join(process.cwd(), 'public');

const BG = { r: 19, g: 19, b: 22, alpha: 1 }; // #131316 â€” deep-space background

const variants = [
  { name: 'favicon-96x96.png',    size: 96,  pad: 0.10 },
  { name: 'apple-touch-icon.png', size: 180, pad: 0.12 },
  { name: 'icon-192.png',         size: 192, pad: 0.12 },
  { name: 'icon-512.png',         size: 512, pad: 0.12 },
];

async function main() {
  if (!fs.existsSync(SRC)) {
    console.error(`No favicon.svg at ${SRC}`);
    process.exit(1);
  }
  const svg = fs.readFileSync(SRC);

  // Source viewBox is ~2653Ã—3000. Pick a density that keeps rasterization
  // at ~2Ã— the target size for sharpness without hitting sharp's pixel
  // ceiling (268M default). For a 512px target â†’ density ~28 â†’ ~1030px source.
  for (const v of variants) {
    const inner = Math.round(v.size * (1 - v.pad * 2));
    const density = Math.max(8, Math.ceil(72 * (inner * 2) / 2653));
    const rendered = await sharp(svg, { density })
      .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();
    await sharp({
      create: { width: v.size, height: v.size, channels: 4, background: BG }
    })
      .composite([{ input: rendered, gravity: 'center' }])
      .png()
      .toFile(path.join(OUT, v.name));
    console.log(`  ${v.name} (${v.size}Ã—${v.size}, density=${density})`);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
