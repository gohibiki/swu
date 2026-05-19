// Star Wars Unlimited filter values.
// Cards have two aspects: one Alignment (Heroism/Villainy) + one Style
// (Vigilance/Cunning/Aggression/Command), or "None" for neutral cards/tokens.
// TCGCSV serves them semicolon-joined in extendedData.Aspect, e.g. "Command;Villainy".

// All six aspects + a None bucket for neutral cards.
export const ASPECTS = [
  { key: 'Heroism',    label: 'Heroism',    hex: '#3A77BC' },  // blue
  { key: 'Villainy',   label: 'Villainy',   hex: '#1F1F1F' },  // black
  { key: 'Vigilance',  label: 'Vigilance',  hex: '#2D6BB1' },  // royal blue
  { key: 'Cunning',    label: 'Cunning',    hex: '#E8C72B' },  // yellow
  { key: 'Aggression', label: 'Aggression', hex: '#C8362A' },  // red
  { key: 'Command',    label: 'Command',    hex: '#5D7C3F' },  // olive green
  { key: 'None',       label: 'Neutral',    hex: '#888888' }   // grey
];

// Backwards-compat aliases for templates carried over from the gundam fork
// (still reference COLORS / INKS in places). Map all three to ASPECTS so
// the filter UI keeps working until those pages are migrated.
export const COLORS = ASPECTS;
export const INKS   = ASPECTS;

// Card types per the SWU comprehensive rules.
// Leader + Base are 1-of slots in a legal deck; Unit, Event, Upgrade live in the main deck.
export const CARD_TYPES = ['Leader', 'Base', 'Unit', 'Event', 'Upgrade'];

// Arenas where Units fight. Set on Units only; Leaders/Bases/Events/Upgrades have no arena.
export const ARENAS = ['Ground', 'Space'];

// Rarity codes as TCGCSV serves them. SWU uses Common/Uncommon/Rare/Legendary/Special.
export const RARITIES = [
  { key: 'C', label: 'Common' },
  { key: 'U', label: 'Uncommon' },
  { key: 'R', label: 'Rare' },
  { key: 'L', label: 'Legendary' },
  { key: 'S', label: 'Special' }
];

// SWU keyword abilities (the ones cards reference in description text).
// Tests look for either bracketed forms or the bare word.
// Source: SWU comprehensive rules + community wiki.
export const ABILITIES = [
  { key: 'ambush',     label: 'Ambush',     test: t => /\bAmbush\b/i.test(t) },
  { key: 'bounty',     label: 'Bounty',     test: t => /\bBounty\b/i.test(t) },
  { key: 'coordinate', label: 'Coordinate', test: t => /\bCoordinate\b/i.test(t) },
  { key: 'exploit',    label: 'Exploit',    test: t => /\bExploit\b/i.test(t) },
  { key: 'grit',       label: 'Grit',       test: t => /\bGrit\b/i.test(t) },
  { key: 'hidden',     label: 'Hidden',     test: t => /\bHidden\b/i.test(t) },
  { key: 'overwhelm',  label: 'Overwhelm',  test: t => /\bOverwhelm\b/i.test(t) },
  { key: 'piloting',   label: 'Piloting',   test: t => /\bPiloting\b/i.test(t) },
  { key: 'raid',       label: 'Raid',       test: t => /\bRaid\b/i.test(t) },
  { key: 'restore',    label: 'Restore',    test: t => /\bRestore\b/i.test(t) },
  { key: 'saboteur',   label: 'Saboteur',   test: t => /\bSaboteur\b/i.test(t) },
  { key: 'sentinel',   label: 'Sentinel',   test: t => /\bSentinel\b/i.test(t) },
  { key: 'shielded',   label: 'Shielded',   test: t => /\bShielded\b/i.test(t) },
  { key: 'smuggle',    label: 'Smuggle',    test: t => /\bSmuggle\b/i.test(t) },
];

// Format a SWU description string for display. TCGCSV returns descriptions
// either as plain text or with HTML markup (mark/b/i/br).
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
