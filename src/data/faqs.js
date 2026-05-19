// Star Wars Unlimited FAQ — single source of truth for both the homepage
// FAQ accordion and the dedicated /faq/{slug} pages.
//
// Each entry has:
//   slug    URL slug used at /faq/{slug}
//   q       the question (also used as page H1)
//   keyword the head term this entry targets (informational)
//   short   condensed answer for the homepage accordion
//   long    long-form HTML for the dedicated page (~600-1000 words);
//           omit to skip generating a dedicated page
//
// This file currently carries the short entries only. Long-form pages can
// be filled in incrementally as we have content to back them.

export const faqs = [
  {
    slug: 'play-swu-online',
    keyword: 'swu online',
    q: 'Can I play Star Wars Unlimited online?',
    short:
      "There is no official Fantasy Flight Games-hosted digital client as of mid-2026. Most digital play happens on Tabletop Simulator (the most active community option) and through Discord matchmaking. The official Star Wars Unlimited Companion app handles deck registration and event check-ins but not gameplay.",
  },
  {
    slug: 'buy-swu-singles',
    keyword: 'buy swu singles',
    q: 'Where can I buy Star Wars Unlimited singles and sealed product?',
    short:
      "Sealed product (booster boxes, starter decks, prerelease kits) is sold through Fantasy Flight Games authorized retailers and most local game stores. Singles are widely available on TCGplayer. Card pages on this site link to TCGplayer with affiliate tagging.",
  },
  {
    slug: 'best-starter-deck-for-beginners',
    keyword: 'best swu starter deck for beginners',
    q: 'What deck should a beginner buy?',
    short:
      "Start with a Two-Player Starter Set or an Intro Battle product (such as Intro Battle: Hoth). Each contains two pre-built tournament-legal decks with their Leaders, Bases, and damage tokens. After that, pick up a booster box of the latest main set in your favorite Leader's aspects.",
  },
];

// Some homepage templates may inject live data (latest set name, card
// counts, etc) into a FAQ entry. Keep this helper around so future entries
// can opt in by setting `keyword: 'latest-swu-set'`.
export function hydrateFaq(faq, vars) {
  if (!faq || !vars) return faq;
  const replace = s => s
    .replace(/\{setName\}/g, vars.name || '')
    .replace(/\{setId\}/g, vars.id || '')
    .replace(/\{setCount\}/g, String(vars.count ?? ''));
  return {
    ...faq,
    short: typeof faq.short === 'string' ? replace(faq.short) : faq.short,
    long: typeof faq.long === 'string' ? replace(faq.long) : faq.long,
  };
}
