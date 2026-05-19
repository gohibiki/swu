// Stub decklist loader. No tournament data source is wired yet for SWU.
// melee.gg and swustats.net are the candidates. Once one is scraped into
// data/decklists-*.json.br, this file should read from there.
//
// The /decklists page expects { decks, fetchedAt, source }. Returning an
// empty shape keeps the page rendering in its empty-state branch.

export async function loadDecklists() {
  return {
    decks: [],
    fetchedAt: null,
    source: null,
  };
}
