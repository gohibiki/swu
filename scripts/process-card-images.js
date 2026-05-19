// Generate downscaled variants of every card image so we can use srcset
// for responsive loading. Inputs and outputs both live in public/cards/:
//
//   {id}.webp       (existing, ~1468x2048 source)
//   {id}-160w.webp  (new, ~160px wide for phone grids)
//   {id}-640w.webp  (new, ~640px wide for desktop grids and modal)
//
// Same size pattern as optcg.one (which dropped 1024w to fit Cloudflare
// Pages' 20k file limit). 3 sizes x 3000 cards = ~9000 files, comfortably
// under the limit.
//
// Run: `node scripts/process-card-images.js`
// Reruns are idempotent — already-generated variants are skipped, so
// only new cards from the daily fetch get processed.

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const CARDS_DIR = path.join(process.cwd(), 'public', 'cards');
const SIZES = [
  { suffix: '-160w', width: 160, quality: 80 },
  { suffix: '-640w', width: 640, quality: 82 },
];

async function main() {
  if (!fs.existsSync(CARDS_DIR)) {
    console.error('public/cards/ not found');
    process.exit(1);
  }

  const all = fs.readdirSync(CARDS_DIR);
  const sources = all.filter(f =>
    f.endsWith('.webp') && !f.includes('-160w') && !f.includes('-640w')
  );

  console.log(`Found ${sources.length} source card images.`);

  let made = 0;
  let skipped = 0;
  let errored = 0;

  for (let i = 0; i < sources.length; i++) {
    const file = sources[i];
    const base = file.replace(/\.webp$/, '');
    const src = path.join(CARDS_DIR, file);

    for (const { suffix, width, quality } of SIZES) {
      const dst = path.join(CARDS_DIR, `${base}${suffix}.webp`);
      if (fs.existsSync(dst)) { skipped++; continue; }
      try {
        await sharp(src)
          .resize({ width, withoutEnlargement: true })
          .webp({ quality, effort: 5 })
          .toFile(dst);
        made++;
      } catch (err) {
        console.error(`  [error] ${file} ${suffix}: ${err.message}`);
        errored++;
      }
    }

    // Progress every 100 cards
    if ((i + 1) % 100 === 0 || i + 1 === sources.length) {
      process.stdout.write(`\rProcessed ${i + 1}/${sources.length} cards...`);
    }
  }
  console.log('');
  console.log(`Done: ${made} created, ${skipped} already existed, ${errored} errors.`);
}

main().catch(err => { console.error('Failed:', err); process.exit(1); });
