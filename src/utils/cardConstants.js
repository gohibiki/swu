// Star Wars Unlimited filter values, derived from the official Comprehensive
// Rules v1.6.0 (April 9, 2026) â€” see public/swu-comprehensive-rules-1.6.0.pdf
// Sections: 3 (Card Types), 6-1 (Deck Construction), 13 (Keyword Effects).

// The 5 colors a deck may be built from (max 2 colors per deck â€” rule
// 6-1-1-2). `key` matches the API `color` field exactly (mixed case).
// Hex values were sampled from the cost-indicator region of multiple
// real Fantasy Flight Games card scans (see scripts/sample-color-hex.js) and averaged
// across 3-4 cards per color to filter out noise.
export const COLORS = [
  { key: 'Blue',   label: 'Blue',   hex: '#0772B2' },  /* Federation blue */
  { key: 'Green',  label: 'Green',  hex: '#62A43D' },  /* Earth green */
  { key: 'Purple', label: 'Purple', hex: '#734D90' },  /* Witch from Mercury / IBO violet */
  { key: 'Red',    label: 'Red',    hex: '#B60651' },  /* Char's red â€” magenta-leaning */
  { key: 'White',  label: 'White',  hex: '#FDFDFD' }   /* near-pure white from card frame */
];

// Backwards-compat alias for legacy imports (lorcana fork pages still use INKS).
export const INKS = COLORS;

// Card types (rule 3-1). Resource cards live in the resource deck only;
// the main deck holds Unit, Pilot, Command, Base.
export const CARD_TYPES = ['Unit', 'Pilot', 'Command', 'Base', 'Resource'];

// Rarity codes as they appear in dotgg's data, in roughly ascending value order.
export const RARITIES = [
  { key: 'C',   label: 'Common' },
  { key: 'U',   label: 'Uncommon' },
  { key: 'R',   label: 'Rare' },
  { key: 'SR',  label: 'Super Rare' },
  { key: 'LR',  label: 'Legendary Rare' },
  { key: 'P',   label: 'Promo' }
];

// The seven keyword effects (rule 13-1) plus the timing keywords (rule 13-2)
// commonly used as filter targets. Tests match either the bracketed keyword
// form (`<Repair X>`, `[Deploy]`) or the bare word, since dotgg's description
// text uses both depending on the card.
export const ABILITIES = [
  // Keyword effects (13-1)
  { key: 'repair',         label: 'Repair',         test: t => /<Repair\b|\bRepair\s*\d/i.test(t) },
  { key: 'breach',         label: 'Breach',         test: t => /<Breach\b|\bBreach\s*\d/i.test(t) },
  { key: 'support',        label: 'Support',        test: t => /<Support\b|\bSupport\s*\d/i.test(t) },
  { key: 'blocker',        label: 'Blocker',        test: t => /<Blocker\b|\bBlocker\b/i.test(t) },
  { key: 'first-strike',   label: 'First Strike',   test: t => /<First\s*Strike\b|\bFirst\s*Strike\b/i.test(t) },
  { key: 'high-maneuver',  label: 'High-Maneuver',  test: t => /<High[\s-]?Maneuver\b|\bHigh[\s-]?Maneuver\b/i.test(t) },
  { key: 'suppression',    label: 'Suppression',    test: t => /<Suppression\b|\bSuppression\b/i.test(t) },
  // Timing keywords (13-2)
  { key: 'deploy',         label: 'Deploy',         test: t => /\[Deploy\]/i.test(t) },
  { key: 'attack',         label: 'Attack',         test: t => /\[Attack\]/i.test(t) },
  { key: 'destroyed',      label: 'Destroyed',      test: t => /\[Destroyed\]/i.test(t) },
  { key: 'when-paired',    label: 'When Paired',    test: t => /\[When\s*Paired\]/i.test(t) },
  { key: 'during-pair',    label: 'During Pair',    test: t => /\[During\s*Pair\]/i.test(t) },
  { key: 'main',           label: 'Main',           test: t => /\[Main\]/i.test(t) },
  { key: 'action',         label: 'Action',         test: t => /\[Action\]/i.test(t) },
  { key: 'burst',          label: 'Burst',          test: t => /\[Burst\]/i.test(t) },
  { key: 'activate-main',  label: 'Activateãƒ»Main',  test: t => /(Activate[ãƒ»Â·]?Main|\[Activate[ãƒ»Â·\s]Main\])/i.test(t) }
];

// Format a Star Wars Unlimited description string for display. dotgg returns descriptions
// either as plain text (older imports) or with HTML markup (newer cards).
const _ABILITY_RE = /(\b[A-Z][A-Z'!]*(?![a-z])(?:[\s,]+(?:[A-Z][A-Z'!]*(?![a-z])|\+\d+))+|\b[A-Z]{2,}[A-Z'!]*(?![a-z]))/g;

export function boldKeywords(text) {
  if (!text) return '';
  if (/<(?:mark|b|i|br)[\s>/]/i.test(text)) return _convertHtmlMarkup(text);
  return _formatPlainText(text);
}

function _convertHtmlMarkup(text) {
  return text
    .replace(/<br\s*\/?>/gi, '\x01BR\x01')
    .replace(/<mark[^>]*>\s*([\s\S]*?)\s*<\/mark>/gi, '<span class="effect-ability">$1</span>')
    .replace(/<b\b[^>]*>([\s\S]*?)<\/b>/gi, '<strong class="effect-keyword">$1</strong>')
    .replace(/<i\b[^>]*>([\s\S]*?)<\/i>/gi, '<em class="effect-reminder">$1</em>')
    .replace(/\x01BR\x01/g, '<br>')
    .replace(/\n+/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function _formatPlainText(text) {
  let s = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  s = s.replace(/\s*\n+\s*/g, '<br>').trim();

  const parts = s.split(/(\([^)]+\))/);
  return parts.map((part, i) => {
    if (i % 2 === 1) return '<em class="effect-reminder">' + part + '</em>';
    return part.replace(_ABILITY_RE, '<span class="effect-ability">$1</span>');
  }).join('');
}

export function detectAbilities(descriptionText) {
  if (!descriptionText) return [];
  return ABILITIES.filter(a => a.test(descriptionText)).map(a => a.key);
}
