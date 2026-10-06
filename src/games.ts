import collectStarsGame from '../lessons/collect-stars-01/game.json';
import collectStarsLesson from '../lessons/collect-stars-01/lesson.json';
import collectStarsJavaScript from '../lessons/collect-stars-01/javascript/lesson.json';
import collectStarsPython from '../lessons/collect-stars-01/python/lesson.json';
import mazeGame from '../lessons/maze-01/game.json';
import mazeBlocks from '../lessons/maze-01/blocks/lesson.json';
import mazeJavaScript from '../lessons/maze-01/javascript/lesson.json';
import mazePython from '../lessons/maze-01/python/lesson.json';

export type Lesson = typeof collectStarsLesson | typeof collectStarsJavaScript | typeof collectStarsPython | typeof mazeBlocks | typeof mazeJavaScript | typeof mazePython;
export const programmingModes = {
  blocks: { title: 'Блоки', description: 'Собирай программу из визуальных блоков.' },
  javascript: { title: 'JavaScript', description: 'Пиши ту же игру текстовым кодом.' },
  python: { title: 'Python', description: 'Создавай игру на Python.' },
};

// To add a game, import its metadata and available lessons and register them here.
export const games = [
  { metadata: collectStarsGame, lessons: { blocks: collectStarsLesson, javascript: collectStarsJavaScript, python: collectStarsPython } },
  { metadata: mazeGame, lessons: { blocks: mazeBlocks, javascript: mazeJavaScript, python: mazePython } },
];
export type LessonMode = keyof (typeof games)[number]['lessons'];
export type Game = (typeof games)[number];
export type ProgrammingMode = keyof typeof programmingModes;
