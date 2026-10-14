export const difficultyGroups = [
  { id: 'beginner', label: 'Начальный', title: 'Начальный уровень — 1–2 ★', description: 'Учимся основам программирования', min: 1, max: 2 },
  { id: 'intermediate', label: 'Средний', title: 'Средний уровень — 3 ★', description: 'Создаём более сложные игры', min: 3, max: 3 },
  { id: 'advanced', label: 'Сложный', title: 'Сложный уровень — 4–5 ★', description: 'Больше самостоятельности и сложных задач', min: 4, max: 5 },
];
export function filterByDifficulty<T extends { metadata: { difficulty: number } }>(games: T[], id: string) {
  const group = difficultyGroups.find(group => group.id === id);
  return group ? games.filter(game => game.metadata.difficulty >= group.min && game.metadata.difficulty <= group.max) : games;
}
