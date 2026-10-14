export function mergeGames(builtin, downloaded) {
  return [...new Map([...builtin, ...downloaded].map(game => [game.metadata.id, game])).values()];
}
