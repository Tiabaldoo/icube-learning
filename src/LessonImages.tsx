import { useState } from 'react';
import type { LessonStep } from './games';
import BlocksImage from './BlocksImage';
const images = import.meta.glob<string>(['../lessons/*/images/blocks/*.png', '../lessons/*/images/ui/*.png', '../extras/*/images/*.png', '../extras/*/images/ui/*.png'], { eager: true, query: '?url', import: 'default' });
export default function LessonImages({ lessonId, visual, title, mini, resources }: { lessonId: string; visual: LessonStep['visual']; title: string; mini: boolean; resources?: Record<string, string> }) {
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState<number | null>(null);
  const pictures = visual.images?.length ? visual.images : [{ src: visual.src, caption: visual.caption, type: visual.type }];
  const picture = pictures[index];
  const key = `${mini ? 'extras' : 'lessons'}/${lessonId}/${picture.src}`;
  const source = resources ? resources[key] : images['../' + key];
  return <figure className="blocks-picture">
    {!source || failed === index ? <p role="alert">Не удалось загрузить картинку. Попробуй обновить страницу.</p> : <BlocksImage key={index} src={source} alt={picture.caption || `MakeCode: ${title}`} onError={() => setFailed(index)} />}
    <figcaption aria-live="polite">{picture.caption}</figcaption>
    {pictures.length > 1 && <nav className="picture-navigation" aria-label="Изображения текущего шага">
      <button type="button" disabled={index === 0} onClick={() => setIndex(index - 1)}>Назад</button>
      <span aria-live="polite">{index + 1} / {pictures.length}</span>
      <button type="button" disabled={index === pictures.length - 1} onClick={() => setIndex(index + 1)}>Далее</button>
    </nav>}
  </figure>;
}
