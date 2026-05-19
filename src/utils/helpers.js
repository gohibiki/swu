// Card images are mirrored from dotgg's CDN to public/cards/{id}.webp by
// scripts/download-images.js (runs daily via GitHub Actions). Cloudflare
// Pages serves them with a 1-year immutable cache (see public/_headers).
//
// We use card.id (e.g. "012-001"), NOT card.slug â€” the CDN keys by id.
export function getImageUrl(card) {
  if (!card?.id) return null;
  return `/cards/${card.id}.webp`;
}

// Responsive card images. scripts/process-card-images.js generates two
// downscaled variants alongside the original:
//   /cards/{id}-160w.webp  (~5-15 KB, ~160px wide)
//   /cards/{id}-640w.webp  (~30-60 KB, ~640px wide)
//   /cards/{id}.webp       (full source ~1468x2048)
//
// `sizes` matches the largest natural width of card thumbnails on the
// site (â‰ˆ80px on phone, 200px on tablet, 320px on desktop grids).
export function getImageSrcSet(card) {
  if (!card?.id) return null;
  const base = `/cards/${card.id}`;
  return {
    src: `${base}-160w.webp`,
    srcset: `${base}-160w.webp 160w, ${base}-640w.webp 640w, ${base}.webp 1600w`,
    sizes: '(max-width: 767px) 80px, (max-width: 1024px) 200px, 320px',
  };
}

// TCGPlayer affiliate (Impact Radius) â€” same account as optcg.one.
// subId1 distinguishes traffic source in TCGPlayer reports â€” keep it
// per-site so Star Wars Unlimited revenue rolls up separately from OP.
const TCG_AFFILIATE_BASE = 'https://partner.tcgplayer.com/c/7021525/1780961/21018';

export function getTcgAffiliateUrl(tcgPlayerId, subId = 'swutcg-card') {
  if (!tcgPlayerId) return null;
  const productUrl = `https://www.tcgplayer.com/product/${tcgPlayerId}`;
  return `${TCG_AFFILIATE_BASE}?u=${encodeURIComponent(productUrl)}&subId1=${subId}`;
}

// Wrap any TCGPlayer URL with the affiliate prefix so commission tracks.
// Used for the mass-entry buy-deck flow on the decklists page.
export function wrapTcgAffiliate(tcgUrl, subId = 'swutcg-decklist') {
  if (!tcgUrl) return null;
  return `${TCG_AFFILIATE_BASE}?u=${encodeURIComponent(tcgUrl)}&subId1=${subId}`;
}

// Build a TCGPlayer mass-entry URL for a deck. Items are {qty, tcgPlayerId} pairs.
// productline value should match TCGPlayer's exact label for Star Wars Unlimited â€” verify
// in their search UI when wiring decklists. Placeholder below uses the most
// likely candidate; correct on first scrape.
export function buildTcgMassEntryUrl(items) {
  const filtered = items.filter(i => i.tcgPlayerId && i.qty > 0);
  if (filtered.length === 0) return null;
  const c = filtered.map(i => `${i.qty}-${i.tcgPlayerId}`).join('||');
  const url = `https://www.tcgplayer.com/massentry?c=${c}&productline=Star Wars Unlimited%20Card%20Game`;
  return wrapTcgAffiliate(url);
}

export function escapeHtml(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
