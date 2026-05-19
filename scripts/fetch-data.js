// Fetch Star Wars Unlimited catalog from TCGCSV (mirror of TCGplayer's
// catalog API). TCGCSV is free, no auth, updated daily, and has
// complete coverage of every set including future ones â€” vs dotgg's
// partial coverage (capped at GD02).
//
// Pulls per group (set):
//   1. /tcgplayer/79/{groupId}/products  â†’ metadata + extendedData
//   2. /tcgplayer/79/{groupId}/prices    â†’ low/mid/high/market by productId
// Joins them and outputs the canonical card schema this site uses.
//
// Output:
//   data/cards-YYYY-MM-DD.json.br   (datestamped snapshot)
//   data/cards.json.br              (latest, what loadCardData reads)
//   data/sets.json.br               (group metadata, what setData reads)
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const CATEGORY_ID = 79;                // Star Wars Unlimited
const TCGCSV = 'https://tcgcsv.com/tcgplayer';

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const today = new Date().toISOString().split('T')[0];

// TCGCSV gates the default Node fetch User-Agent (returns 401). Send a
// sensible one â€” they prefer apps to identify themselves so they can
// reach out if traffic causes problems.
const UA = 'Mozilla/5.0 swutcg.one (+https://www.swutcg.one)';

async function fetchJson(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      if (i === retries - 1) throw err;
      console.log(`   retry ${i + 1}/${retries} after: ${err.message}`);
      await sleep(2000 * (i + 1));
    }
  }
}

function brotli(jsonString) {
  return zlib.brotliCompressSync(jsonString, {
    params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 }
  });
}

// Map TCGPlayer's full rarity names to the short codes our pages expect
// (the existing cardConstants.js RARITIES list uses these short codes).
const RARITY_SHORT = {
  'Common':         'C',
  'Uncommon':       'U',
  'Rare':           'R',
  'Super Rare':     'SR',
  'Legend Rare':    'LR',
  'Promo':          'P',
};

// dotgg used `slug` for clean URLs (e.g. "GD03-001-swu-nt-1"). Synthesize one.
function slugify(id, name) {
  const safeName = (name || '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return safeName ? `${id}-${safeName}` : id;
}

function pickExt(extendedData, key) {
  if (!Array.isArray(extendedData)) return '';
  const hit = extendedData.find(e => e.name === key);
  return hit ? String(hit.value).trim() : '';
}

function toNumber(v) {
  if (v === '' || v === null || v === undefined || v === '-') return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

// Strip TCGplayer disambiguators that don't belong in display names:
//   1. The card's own ID in parens â€” e.g. "(GD04-001)", "(R-031)", "(ST07-005)"
//   2. Bare rarity tier tags        â€” e.g. "(R+)", "(LR++)", "(SR)"
// Everything else stays â€” pack/tournament/promo/sleeves tags carry real
// printing info, and meaningful parens like "(Destroy Mode)", "(Trans-Am)",
// "(Unicorn Mode)" are part of the canonical Fantasy Flight Games card name.
const RARITY_PAREN = / \((?:C|U|R|SR|LR|P)\++?\)/g;

function cleanCardName(raw, cardId) {
  if (!raw) return raw;
  let out = raw;
  // Remove any literal "(cardId)" â€” escape regex metachars for safety.
  if (cardId) {
    const safe = cardId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    out = out.replace(new RegExp(' \\(' + safe + '\\)', 'g'), '');
  }
  return out.replace(RARITY_PAREN, '').trim();
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// MAIN
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function main() {
  console.log('Fetching Star Wars Unlimited group list (sets)â€¦');
  const groupsRaw = await fetchJson(`${TCGCSV}/${CATEGORY_ID}/groups`);
  const groups = groupsRaw.results || groupsRaw;
  console.log(`  Found ${groups.length} groups`);

  const sets = [];
  const allCards = [];

  for (const g of groups) {
    const code = g.abbreviation || g.name;
    console.log(`\nâ”€â”€ ${code}  ${g.name}  (groupId=${g.groupId})`);

    // 1. Products
    const prodRaw = await fetchJson(`${TCGCSV}/${CATEGORY_ID}/${g.groupId}/products`);
    const products = prodRaw.results || prodRaw;
    console.log(`  ${products.length} products`);

    // 2. Prices â€” index by productId+subTypeName for quick join
    let pricesBySub = new Map();
    try {
      const priceRaw = await fetchJson(`${TCGCSV}/${CATEGORY_ID}/${g.groupId}/prices`);
      const prices = priceRaw.results || priceRaw;
      for (const p of prices) {
        const key = `${p.productId}::${p.subTypeName}`;
        pricesBySub.set(key, p);
      }
      console.log(`  ${prices.length} price entries`);
    } catch (err) {
      console.log(`  âš  no prices for ${code}: ${err.message}`);
    }

    let cardCount = 0;
    for (const p of products) {
      const cardCode = pickExt(p.extendedData, 'Number');
      // Skip sealed products (booster packs, boxes, etc.) â€” they have no
      // Number field. Only individual cards get included.
      if (!cardCode) continue;

      const rawRarity = pickExt(p.extendedData, 'Rarity');
      // Prefer Normal pricing (most cards); fall back to Holofoil if that's
      // the only printing.
      const priceNormal = pricesBySub.get(`${p.productId}::Normal`);
      const priceHolo = pricesBySub.get(`${p.productId}::Holofoil`);
      const priceObj = priceNormal || priceHolo;

      const displayName = cleanCardName(p.name, cardCode);
      const card = {
        id: cardCode,                                  // canonical card code, e.g. "GD03-001"
        slug: slugify(cardCode, displayName),
        name: displayName,                             // cleaned for display
        productName: p.name,                           // original TCGplayer product name (kept for reference)
        cleanName: p.cleanName,                        // ASCII-safe variant from TCGplayer
        set: g.abbreviation || cardCode.split('-')[0], // Set code from group
        groupId: g.groupId,
        type: pickExt(p.extendedData, 'CardType'),     // Unit / Leader / Base / Event / Upgrade
        // SWU aspects are multi-value, semicolon-separated (e.g. "Command;Villainy").
        aspects: (pickExt(p.extendedData, 'Aspect') || '').split(';').map(s => s.trim()).filter(Boolean),
        aspect: ((pickExt(p.extendedData, 'Aspect') || '').split(';')[0] || '').trim(),
        // Legacy alias so older templates that read `color` still see something.
        color: ((pickExt(p.extendedData, 'Aspect') || '').split(';')[0] || '').trim(),
        rarity: RARITY_SHORT[rawRarity] || rawRarity,  // map "Legend Rare" â†’ "LR"
        rarityFull: rawRarity,                         // keep the full label too
        cost: toNumber(pickExt(p.extendedData, 'Cost')),
        power: toNumber(pickExt(p.extendedData, 'Power')),
        hp: toNumber(pickExt(p.extendedData, 'HP')),
        // SWU traits are multi-value, semicolon-separated (e.g. "Imperial;Official").
        traits: (pickExt(p.extendedData, 'Traits') || '').split(';').map(s => s.trim()).filter(Boolean),
        trait: pickExt(p.extendedData, 'Traits'),       // raw string for legacy templates
        arena: pickExt(p.extendedData, 'Arena Type'),   // Ground | Space (Units only)
        description: pickExt(p.extendedData, 'Description'),
        // Alias for older templates that read `action`
        action: pickExt(p.extendedData, 'Description'),
        zone: '',                                      // TCGCSV doesn't expose zone
        source_title: '',                              // not in TCGCSV
        // TCGPlayer integration
        tcgPlayerId: String(p.productId),
        productUrl: p.url,
        imageUrl: p.imageUrl,
        // Pricing (Normal subtype preferred; Holofoil if only that exists)
        price: priceObj?.marketPrice ?? null,
        priceLow: priceObj?.lowPrice ?? null,
        priceMid: priceObj?.midPrice ?? null,
        priceHigh: priceObj?.highPrice ?? null,
        priceFoil: priceHolo?.marketPrice ?? null,
        delta7dPrice: 0,                               // TCGCSV doesn't track deltas (yet)
        // Release info
        releasedOn: p.presaleInfo?.releasedOn || null,
        isPresale: p.presaleInfo?.isPresale || false,
      };
      allCards.push(card);
      cardCount++;
    }
    console.log(`  âœ“ ${cardCount} cards extracted`);

    sets.push({
      id: code,
      groupId: g.groupId,
      name: g.name,
      abbreviation: code,
      slug: slugify(code, g.name).replace(`${code}-`, ''),
      cardsCount: cardCount,
      release: g.publishedOn ? g.publishedOn.split('T')[0] : null,
    });

    await sleep(500);  // be polite
  }

  // â”€â”€ Disambiguate multi-printing cards â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // TCGplayer treats every printing of a Fantasy Flight Games card as a separate
  // product (its own productId, image, and price). Multiple products
  // may share the same Fantasy Flight Games number â€” the base print plus C+ rarity
  // tournament promos, Edition Beta reprints, etc.
  //
  // Pick a canonical entry per Fantasy Flight Games code (the one in the matching
  // home set: ST02-002 in ST02, GD03-001 in GD03). Suffix the rest with
  // _p1, _p2, ... in stable productId order so the same product always
  // gets the same suffix across runs.
  const byCode = new Map();
  for (const c of allCards) {
    if (!byCode.has(c.id)) byCode.set(c.id, []);
    byCode.get(c.id).push(c);
  }

  let suffixedCount = 0;
  for (const [fantasy flight gamesId, prints] of byCode.entries()) {
    if (prints.length === 1) continue;

    // Canonical = printing whose set abbreviation matches the Fantasy Flight Games code
    // prefix (everything before the dash). Fall back to lowest productId.
    const homePrefix = fantasy flight gamesId.split('-')[0];
    const sortedByPid = [...prints].sort(
      (a, b) => Number(a.tcgPlayerId) - Number(b.tcgPlayerId)
    );
    let canonical = sortedByPid.find(p => p.set === homePrefix);
    if (!canonical) canonical = sortedByPid[0];

    // Stable, deterministic suffix order â€” by productId ascending.
    let n = 1;
    for (const p of sortedByPid) {
      if (p === canonical) continue;
      const suffixedId = `${fantasy flight gamesId}_p${n}`;
      p.id = suffixedId;
      p.baseId = fantasy flight gamesId;                            // expose the canonical Fantasy Flight Games code
      p.slug = slugify(suffixedId, p.name);
      n++;
      suffixedCount++;
    }
    canonical.baseId = fantasy flight gamesId;
  }

  // Backfill baseId on cards that never had a duplicate
  for (const c of allCards) {
    if (!c.baseId) c.baseId = c.id;
  }

  console.log(`\nDisambiguated ${suffixedCount} alt-printings (added _p1.._pN suffixes)`);

  // â”€â”€ Save cards â”€â”€
  const cardsCompressed = brotli(JSON.stringify(allCards, null, 2));
  fs.writeFileSync(path.join(dataDir, `cards-${today}.json.br`), cardsCompressed);
  fs.writeFileSync(path.join(dataDir, 'cards.json.br'), cardsCompressed);
  console.log(`\nSaved ${allCards.length} cards (${(cardsCompressed.length / 1024).toFixed(0)} KB)`);

  // â”€â”€ Save sets â”€â”€
  const setsCompressed = brotli(JSON.stringify(sets, null, 2));
  fs.writeFileSync(path.join(dataDir, 'sets.json.br'), setsCompressed);
  console.log(`Saved ${sets.length} sets (${(setsCompressed.length / 1024).toFixed(1)} KB)`);

  console.log('\n' + 'â”€'.repeat(50));
  console.log('SUMMARY');
  console.log('â”€'.repeat(50));
  console.log(`Cards:  ${allCards.length}`);
  console.log(`Sets:   ${sets.length}`);
  console.log(`Source: TCGCSV (categoryId=${CATEGORY_ID})`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
