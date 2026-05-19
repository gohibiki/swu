// Mirror Star Wars Unlimited card images from TCGPlayer's CDN to public/cards/{id}.webp.
//
// Filename:  card.id (which is the Fantasy Flight Games code, plus a _p1/_p2 suffix on
//            non-canonical printings â€” see fetch-data.js for the
//            disambiguation logic). One file per printing.
// Source:    TCGplayer CDN, keyed by productId â€” every printing has its
//            own unique productId so each gets its own image.
//
//   https://tcgplayer-cdn.tcgplayer.com/product/{productId}_in_1000x1000.jpg
//
// Sharp converts .jpg â†’ .webp at quality 85. Skips files already on disk
// â€” safe to run daily; only downloads new cards each run.
//
// Note: scripts/process-card-images.js then generates the -160w/-640w
// responsive variants from each newly downloaded webp.
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import sharp from 'sharp';

const CONCURRENCY = 6;          // be polite to the TCGPlayer CDN
const RETRY_LIMIT = 3;
const RETRY_BACKOFF_MS = 1500;
const UA = 'Mozilla/5.0 swutcg.one (+https://www.swutcg.one)';

const root = process.cwd();
const dataDir = path.join(root, 'data');
const outDir = path.join(root, 'public', 'cards');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

function loadCards() {
  const files = fs.readdirSync(dataDir)
    .filter(f => f.startsWith('cards-') && f.endsWith('.json.br'))
    .sort()
    .reverse();
  if (files.length === 0) {
    throw new Error('No cards-*.json.br in data/. Run `npm run fetch-data` first.');
  }
  const compressed = fs.readFileSync(path.join(dataDir, files[0]));
  const cards = JSON.parse(zlib.brotliDecompressSync(compressed).toString('utf8'));
  return cards;
}

async function downloadOne(card) {
  const dest = path.join(outDir, `${card.id}.webp`);
  if (fs.existsSync(dest)) return { id: card.id, skipped: true };

  if (!card.tcgPlayerId) return { id: card.id, missing: true, reason: 'no productId' };

  const url = `https://tcgplayer-cdn.tcgplayer.com/product/${card.tcgPlayerId}_in_1000x1000.jpg`;
  for (let attempt = 1; attempt <= RETRY_LIMIT; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      if (res.status === 404) return { id: card.id, missing: true, reason: '404' };
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 1000) throw new Error(`Suspiciously small response (${buf.length} bytes)`);
      // Convert JPEG â†’ WebP at quality 85 (good balance for source images;
      // process-card-images.js will produce the smaller responsive variants).
      const webp = await sharp(buf).webp({ quality: 85 }).toBuffer();
      fs.writeFileSync(dest, webp);
      return { id: card.id, downloaded: true, bytes: webp.length };
    } catch (err) {
      if (attempt === RETRY_LIMIT) {
        return { id: card.id, error: err.message };
      }
      await new Promise(r => setTimeout(r, RETRY_BACKOFF_MS * attempt));
    }
  }
}

async function runWithConcurrency(items, worker, concurrency) {
  const results = [];
  let i = 0;
  const next = async () => {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await worker(items[idx]);
    }
  };
  await Promise.all(Array.from({ length: concurrency }, next));
  return results;
}

async function main() {
  const cards = loadCards();
  console.log(`Total cards in data: ${cards.length}`);

  // Skip ones we already have on disk for fast progress reporting
  const missing = cards.filter(c => !fs.existsSync(path.join(outDir, `${c.id}.webp`)));
  console.log(`Already on disk: ${cards.length - missing.length}`);
  console.log(`To download:     ${missing.length}`);
  if (missing.length === 0) {
    console.log('All images present. Done.');
    return;
  }

  let done = 0;
  const results = await runWithConcurrency(
    missing,
    async (card) => {
      const r = await downloadOne(card);
      done++;
      if (done % 25 === 0 || done === missing.length) {
        console.log(`  ${done}/${missing.length}`);
      }
      return r;
    },
    CONCURRENCY
  );

  const downloaded = results.filter(r => r?.downloaded).length;
  const notFound = results.filter(r => r?.missing).length;
  const errors = results.filter(r => r?.error);
  console.log('');
  console.log(`Downloaded: ${downloaded}`);
  console.log(`Missing:    ${notFound}`);
  console.log(`Errors:     ${errors.length}`);
  if (errors.length) {
    console.log('First few errors:');
    errors.slice(0, 5).forEach(e => console.log(`  ${e.id}: ${e.error}`));
  }
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
