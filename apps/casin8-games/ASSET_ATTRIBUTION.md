## Card Artwork Attribution

The poker/blackjack card faces are now vendored locally under:

- `apps/casin8-games/assets/cards/english_pattern_*_of_*.svg` (52 files)

Primary source page:

- https://commons.wikimedia.org/wiki/File:English_pattern_playing_cards_deck.svg

Additional user-provided card asset sources for potential local bundling:

- https://opengameart.org/content/playing-cards-vector-png
- https://sourceforge.net/projects/vector-cards/

Note:

- Runtime now uses local files first and falls back to Wikimedia
  `Special:FilePath` if an asset is missing.
