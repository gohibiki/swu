// Star Wars Unlimited FAQ â€” single source of truth for both the homepage
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
// Order on the homepage follows learning sequence (basics â†’ advanced â†’
// current news â†’ external tools), not raw search volume.

export const faqs = [
  {
    slug: 'play-swu-tcg-online',
    keyword: 'swu tcg online',
    q: 'Can I play Star Wars Unlimited online?',
    short:
      "There is no official Fantasy Flight Games-hosted online client as of mid-2026. Most digital play is community-run on Tabletop Simulator. The official Fantasy Flight Games TCG+ platform handles event registration but not gameplay.",
    long: `
      <p>As of mid-2026, <strong>Fantasy Flight Games has not released a native digital client</strong> for the Star Wars Unlimited. All online play is community-run, with a handful of practical options.</p>

      <h2>Tabletop Simulator (most active)</h2>
      <p>The most-used unofficial client is a fan-made <strong>Tabletop Simulator</strong> mod. The Star Wars Unlimited subreddit and the official-adjacent Discord servers track the latest mod links. TTS requires a one-time Steam purchase (~$20) but the mod itself is free. Setup is manual: you import a deck list, place cards into zones, and rules enforcement is honor-system rather than automated.</p>

      <h3>Pros and cons</h3>
      <ul>
        <li><strong>Pros</strong>: full card pool, free updates, voice chat, plays exactly like paper.</li>
        <li><strong>Cons</strong>: no rules engine, both players need to know the rules; finding opponents requires a Discord ping or tournament signup; no built-in matchmaking.</li>
      </ul>

      <h2>Fantasy Flight Games TCG+ (event registration only)</h2>
      <p>The official <strong>Fantasy Flight Games TCG+</strong> mobile app handles tournament registration, store qualifiers, and prize tracking, but does <strong>not</strong> include digital gameplay. It's the place to find sanctioned events near you, not to play remotely.</p>

      <h2>Other community options</h2>
      <ul>
        <li><strong>Untap.in</strong>: a browser-based proxy table that supports custom games. Some players have set up Star Wars Unlimited decks here, but card images and templates are user-submitted.</li>
        <li><strong>Cockatrice / OCTGN</strong>: older platforms with possible Star Wars Unlimited definitions in development. Activity is significantly lower than TTS.</li>
        <li><strong>Discord webcam play</strong>: for casual matches, plenty of players just point a webcam at their playmat.</li>
      </ul>

      <h2>Will there be an official online client?</h2>
      <p>Fantasy Flight Games has not announced one. Their other TCG (Digimon Card Game) launched in 2020 and still does not have a native digital client either, so a Star Wars Unlimited release in the near term seems unlikely. Community-run TTS is currently the best supported option.</p>

      <h2>Where to find opponents</h2>
      <p>The Star Wars Unlimited subreddit and Discord servers are the main matchmaking hubs. Most online tournaments are organized through Discord and use the TTS mod as the play platform. Once you have a deck list ready in the <a href="/builder">deck builder</a>, you can export it as text and import it directly into TTS.</p>

      <h2>Practice without an opponent</h2>
      <p>If you want to learn the rules before playing live, build a deck in the <a href="/builder">deck builder</a> and play both sides on TTS. Pair this with the <a href="/how-to-play">rules walkthrough</a> and the official Fantasy Flight Games PDF for combat math.</p>
    `.trim(),
  },
  {
    slug: 'buy-swu-card-singles',
    keyword: 'buy swu card singles',
    q: 'Where can I buy Star Wars Unlimited singles and sealed product?',
    short:
      "Singles are widely available on TCGplayer (added the game to its catalog in 2025). Sealed product is sold through Fantasy Flight Games TCG+ authorized retailers and most local game stores carrying Fantasy Flight Games titles.",
    long: `
      <p>The Star Wars Unlimited is sold through three main channels in North America and Europe: <strong>TCGplayer</strong> (singles), <strong>local game stores</strong> (sealed + singles), and <strong>Fantasy Flight Games TCG+ authorized online retailers</strong> (sealed). Each has trade-offs.</p>

      <h2>TCGplayer (singles)</h2>
      <p>TCGplayer added Star Wars Unlimited to its catalog in 2025 and now has the largest secondary market for singles. Sellers list individual cards, prices are comparable across vendors, and bulk shipping runs through TCGplayer Direct. Every card page on this site links to the matching TCGplayer listing. Those links carry an affiliate tag, so purchases through them support the database at no extra cost.</p>

      <h3>How to buy a full deck on TCGplayer</h3>
      <p>The fastest path: build the list in our <a href="/builder">deck builder</a>, click <strong>Buy on TCGplayer</strong>, and the modal generates a single mass-entry URL with every card and quantity pre-filled. You confirm cart contents on TCGplayer and check out once. This typically saves 10-30% versus buying cards individually because the cart auto-optimizes for sellers who carry multiple cards on your list.</p>

      <h2>Local game stores (sealed + tournaments)</h2>
      <p>Most stores that already stock Fantasy Flight Games TCGs (Digimon, One Piece) also carry Star Wars Unlimited boosters and starter decks. Sealed pricing matches MSRP. Your local store is where sanctioned tournaments and casual play nights happen, so buying sealed there is what builds an in-person scene to play in.</p>
      <p>Use the <strong>Fantasy Flight Games TCG+ store locator</strong> on the official Fantasy Flight Games website to find authorized retailers.</p>

      <h2>Fantasy Flight Games TCG+ authorized online retailers</h2>
      <p>For sealed cases, displays, and pre-orders of new sets, the authorized online retailers (CardKingdom, ChannelFireball, TrollAndToad, and regional equivalents in Europe and Asia) have the broadest inventory at MSRP. Pre-orders for new sets typically open 4-6 weeks before street date.</p>

      <h2>What about Amazon and eBay?</h2>
      <ul>
        <li><strong>Amazon</strong>: third-party listings exist but quality control is inconsistent. Counterfeits have been reported, especially on rare singles. Stick to Amazon's first-party Fantasy Flight Games-branded listings if you go this route.</li>
        <li><strong>eBay</strong>: best for graded singles or hard-to-find promos. Verify the seller's ratings on TCG-specific transactions and confirm the card matches the official art via our <a href="/database">card database</a>.</li>
      </ul>

      <h2>Pricing reference</h2>
      <p>Card prices on this database are pulled from TCGplayer's market price daily. They reflect actual recent sale prices, not asking prices, so they're a reliable benchmark for whether a single is over- or under-listed elsewhere.</p>
    `.trim(),
  },
  {
    slug: 'best-starter-deck-for-beginners',
    keyword: 'best swu tcg starter deck for beginners',
    q: 'What deck should a beginner buy?',
    short:
      "Start with the newest legal Starter Deck from your region rather than building from boosters. The Generation Pulse [ST10] starter line is the latest scheduled wave. Fantasy Flight Games also runs a dedicated Starter Deck Battle Event throughout 2026 specifically for new-player on-ramps.",
    long: `
      <p><strong>Buy a current-format Starter Deck before you buy any boosters.</strong> A starter is pre-built and tournament-legal, and the box includes a 50-card main deck, a 10-card resource deck, paper play mats, and a rules sheet. Boosters are random card packs, which is a poor first purchase for a new player.</p>

      <h2>Which starter to buy in 2026</h2>
      <p>Fantasy Flight Games's Starter Deck line uses the <strong>ST</strong> prefix (ST01 through the latest release). Each starter focuses on one or two colors and a specific theme, usually based on a Mobile Suit Star Wars Unlimited series like the original UC era, Wing, SEED, or 00.</p>
      <p>The most up-to-date starters as of mid-2026 are the latest two waves; the upcoming <strong>Generation Pulse [ST10]</strong> wave releases in June 2026. Newer is generally better for beginners because:</p>
      <ul>
        <li>The starter cards are designed against the current card pool, so deck balance is realistic.</li>
        <li>Local store inventory is highest for the newest release.</li>
        <li>Reprint cards in newer starters often replace older versions, so you don't need to backtrack.</li>
      </ul>

      <h3>How to pick between starters</h3>
      <p>Each ST starter plays differently, but they're all roughly similar in power. Pick by <strong>which Star Wars Unlimited series you like</strong> rather than trying to optimize. The flavor of playing your favorite anime characters carries you through learning the rules.</p>
      <ul>
        <li><strong>Original UC fan?</strong> Look for starters featuring RX-78-2, Char's Zaku, or Amuro Ray.</li>
        <li><strong>Wing fan?</strong> Wing Zero / Heavyarms / Deathscythe themed starters.</li>
        <li><strong>SEED / 00 fan?</strong> Look for Strike Star Wars Unlimited or Exia themed starters.</li>
      </ul>

      <h2>Starter Deck Battle Event</h2>
      <p>Throughout 2026, Fantasy Flight Games runs a <strong>Starter Deck Battle</strong> series at participating local game stores. Every entrant has to use a <strong>single, unmodified Starter Deck</strong>: no upgrades, no boosters mixed in. That makes it the best entry point for a brand-new player. Everyone is on equal footing, matches are short, and prizes are usually promo cards rather than booster boxes, so you leave with collectibles regardless of placement.</p>
      <p>Ask your local store about the schedule when you buy your starter.</p>

      <h2>What to buy second</h2>
      <p>After 6-10 games with your starter, you'll know what to upgrade. Common second purchases:</p>
      <ol>
        <li><strong>A second copy of the same starter</strong> (~$15) gives you the playset (4 copies) of the strong cards in your starter, doubling deck consistency.</li>
        <li><strong>Singles from <a href="/decklists">tournament decklists</a></strong> in your colors: 2-3 specific cards that your starter is missing, available cheaply on <a href="/faq/buy-swu-card-singles">TCGplayer</a>.</li>
        <li><strong>One booster box of the latest set</strong> only after the above two; opens up build-around card options but is a high-variance purchase.</li>
      </ol>

      <h2>What to avoid as a beginner</h2>
      <ul>
        <li><strong>Buying old starters off eBay just because they're cheap.</strong> The card pool moves; an ST01 starter from 2024 plays into a 2026 meta poorly and the included cards may have been reprinted.</li>
        <li><strong>Building a homebrew deck before you've played 10+ games.</strong> Pilot your starter first to learn the combat system, then iterate.</li>
        <li><strong>Buying singles for a deck idea you saw online.</strong> Top-tier decks reference cards from across multiple sets and cost $200+ to assemble. Do this only after you know you love the game.</li>
      </ul>

      <p>Once you've played a few games, browse the <a href="/decklists">tournament decklists</a> to see what competitive lists look like, or open the <a href="/builder">deck builder</a> to plan your first upgrade path.</p>
    `.trim(),
  },
];
