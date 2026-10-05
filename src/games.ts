import collectStarsGame from '../lessons/collect-stars-01/game.json';
import collectStarsLesson from '../lessons/collect-stars-01/lesson.json';

export type Lesson = typeof collectStarsLesson;
export const programmingModes = {
  blocks: { title: 'Блоки', description: 'Собирай программу из визуальных блоков.' },
  javascript: { title: 'JavaScript', description: 'Пиши ту же игру текстовым кодом.' },
  python: { title: 'Python', description: 'Создавай игру на Python.' },
};

// To add a game, import its metadata and Blocks lesson and register them here.
export const games = [{ metadata: collectStarsGame, lesson: collectStarsLesson }];
export type Game = (typeof games)[number];
export type ProgrammingMode = keyof typeof programmingModes;
