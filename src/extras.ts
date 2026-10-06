import catalog from '../extras/catalog.json';
import type { MiniLesson } from './LessonPlayer';
import type { LessonMode } from './games';

const lessons = import.meta.glob<MiniLesson>('../extras/*/{blocks,javascript}/lesson.json', {
  eager: true, import: 'default',
});

// One global registry: no game IDs or copied content.
export const extras = catalog.map(metadata => {
  const modes = Object.fromEntries((['blocks', 'javascript'] as const).map(mode => {
    const lesson = lessons[`../extras/${metadata.id}/${mode}/lesson.json`];
    if (!lesson || !metadata.modes[mode]) throw new Error(`Missing improvement lesson: ${metadata.id}/${mode}`);
    return [mode, lesson];
  })) as Record<LessonMode, MiniLesson>;
  return { metadata, lessons: modes };
});
export type Extra = (typeof extras)[number];
