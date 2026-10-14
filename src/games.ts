import registry from '../content/registry.json';
import extraCatalog from '../extras/catalog.json';

export type LessonStep = {
  id: string; title: string; actionType: string; goal: string; check: string; challenge: string; theory: string;
  instructions: string[]; visual: { type: string; src: string; codeFile: string; caption: string };
  blocks: { category: string; name: string; purpose: string }[]; commands: { code: string; purpose: string }[];
  newLines: number[][]; changedLines: number[][]; change: { before: string; after: string };
};
export type Lesson = { id: string; title: string; steps: LessonStep[] };
export type Improvement = { metadata: { id: string; gameId: string; title: string; description: string; icon: string; optional: boolean }; lessons: Partial<Record<LessonMode, Lesson>> };
export type Game = { metadata: { id: string; title: string; description: string; difficulty: number; cover: { hero: string; collectible: string; enemy?: string; layout?: string }; learns: string[]; modes: Partial<Record<ProgrammingMode, { available: boolean }>> }; lessons: Partial<Record<LessonMode, Lesson>>; improvements: Improvement[]; resources?: Record<string, string> };
export const programmingModes = {
  blocks: { title: 'Блоки', description: 'Собирай программу из визуальных блоков.' },
  javascript: { title: 'JavaScript', description: 'Пиши ту же игру текстовым кодом.' },
  python: { title: 'Python', description: 'Создавай игру на Python.' },
};

const metadata = import.meta.glob<Game['metadata']>('../lessons/*/game.json', { eager: true, import: 'default' });
const lessons = import.meta.glob<Lesson>('../lessons/**/lesson.json', { eager: true, import: 'default' });
const miniLessons = import.meta.glob<Lesson>('../extras/*/{blocks,javascript,python}/lesson.json', { eager: true, import: 'default' });
export const games: Game[] = registry.games.map(entry => ({
  metadata: metadata[`../lessons/${entry.id}/game.json`],
  lessons: Object.fromEntries(Object.entries(entry.lessons).map(([mode, file]) => [mode, lessons[`../lessons/${entry.id}/${file}`]])),
  improvements: entry.improvements.map(id => {
    const info = extraCatalog.find(extra => extra.id === id)!;
    return { metadata: { ...info, gameId: entry.id, optional: true }, lessons: Object.fromEntries(Object.entries(info.modes).filter(([, available]) => available).map(([mode]) => [mode, miniLessons[`../extras/${id}/${mode}/lesson.json`]])) };
  }),
}));
export type LessonMode = 'blocks' | 'javascript' | 'python';
export type ProgrammingMode = keyof typeof programmingModes;
