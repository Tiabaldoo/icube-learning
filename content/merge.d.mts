export function mergeGames<T extends { metadata: { id: string } }>(builtin: T[], downloaded: T[]): T[];
