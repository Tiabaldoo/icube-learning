import { useEffect, useRef, useState } from 'react';
import type { Lesson, LessonMode } from './games';
import LessonImages from './LessonImages';
import JavaScriptCode from './JavaScriptCode';
import { codeProtection } from './codeProtection';

export type MiniLesson = { id: string; title: string; steps: Lesson['steps'] };
type PlayerLesson = MiniLesson;

export default function LessonPlayer({ lesson, mode, onBack, onImprove, onFinish, onCatalog, resources }: {
  lesson: PlayerLesson; mode: LessonMode; onBack: () => void; onImprove?: () => void; onFinish?: () => void; onCatalog?: () => void; resources?: Record<string, string>;
}) {
  const [progress, setProgress] = useState<{ phase: 'lesson' | 'result'; step: number }>({ phase: 'lesson', step: 0 });
  const heading = useRef<HTMLHeadingElement>(null);
  const stepTrack = useRef<HTMLOListElement>(null);
  const step = lesson.steps[progress.step];
  const mini = Boolean(onFinish);

  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [progress.phase, progress.step]);

  useEffect(() => {
    const track = stepTrack.current;
    const circle = track?.querySelector<HTMLElement>('[aria-current="step"] > span:first-child');
    if (!track || !circle) return;

    const trackBounds = track.getBoundingClientRect();
    const circleBounds = circle.getBoundingClientRect();
    const edgePadding = 12;
    const leftEdge = trackBounds.left + edgePadding;
    const rightEdge = trackBounds.left + track.clientWidth - edgePadding;
    if (circleBounds.left < leftEdge) {
      track.scrollLeft += circleBounds.left - leftEdge;
    } else if (circleBounds.right > rightEdge) {
      track.scrollLeft += circleBounds.right - rightEdge;
    }
  }, [progress.phase, progress.step]);

  return (
    <div className={`app-shell ${progress.phase === 'lesson' ? 'lesson-screen' : ''}`}>
      <header className="lesson-header">
        <div className="brand"><span className="brand-mark" aria-hidden="true">iC</span> Айкуб Игры <button className="back-link lesson-back" onClick={onBack}>← К игре</button></div>
        <div className="lesson-heading">
          <div><p className="eyebrow">{mode === 'python' ? 'Python' : mode === 'javascript' ? 'JavaScript' : 'Блоки'}</p><h1>{lesson.title}</h1></div>
        </div>
        {<ol ref={stepTrack} className="step-track" aria-label="Шаги урока">
          {lesson.steps.map((item, index) => (
            <li key={item.id} className={progress.phase !== 'lesson' || index < progress.step ? 'done' : index === progress.step ? 'current' : ''}
              aria-current={progress.phase === 'lesson' && index === progress.step ? 'step' : undefined}>
              <span>{progress.phase !== 'lesson' || index < progress.step ? '✓' : index + 1}</span>
              <span className="sr-only">{item.title}</span>
            </li>
          ))}
        </ol>}
      </header>

      <main>
        {progress.phase === 'lesson' && <>
          <section className="lesson-card step-card" aria-labelledby="screen-title">
            {step.visual.type === 'code' ? <div className="lesson-code-visual"><JavaScriptCode key={step.id} lessonId={lesson.id} codeFile={step.visual.codeFile} newLines={step.newLines} changedLines={step.changedLines} sourceRoot={mini ? 'extras' : 'lessons'} language={mode === 'python' ? 'python' : 'javascript'} sourceText={resources?.[`${mini ? 'extras' : 'lessons'}/${lesson.id}/${step.visual.codeFile}`]} />{step.visual.images?.length ? <LessonImages key={step.id} lessonId={lesson.id} visual={step.visual} title={step.title} mini={mini} resources={resources} /> : null}</div> : <LessonImages key={step.id} lessonId={lesson.id} visual={step.visual} title={step.title} mini={mini} resources={resources} />}
            <div className="step-content">
              <div className="card-intro">
                <p className="step-label">Шаг {progress.step + 1} из {lesson.steps.length}</p>
                <h2 id="screen-title" ref={heading} tabIndex={-1}>{step.title}</h2>
              </div>
              <section className="step-goal"><h3>Что делаем</h3><p>{step.goal}</p></section>
              <ol className="action-instructions">{step.instructions.map((instruction, index) => <li key={index}>{instruction}</li>)}</ol>
              {step.blocks.length > 0 && <section className="block-guide" aria-labelledby="block-guide-title">
                <h3 id="block-guide-title">Где найти</h3>
                <ul>
                  {step.blocks.map((block, index) => <li key={index}>
                    <span className="block-category" data-category={block.category}>{block.category}</span>
                    <strong>«{block.name}»</strong>
                  </li>)}
                </ul>
              </section>}
              {step.actionType === 'type-code' && step.commands.length > 0 && <section className="command-guide" aria-labelledby="command-guide-title">
                <h3 id="command-guide-title">Что написать</h3>
                <ul>{step.commands.map((command, index) => <li key={index}><code className="protected-code" tabIndex={0} {...codeProtection}>{command.code}</code><p>{command.purpose}</p></li>)}</ul>
              </section>}
              {step.change.before && <section className="code-change"><h3>Что изменить</h3><p>Было:</p><code className="protected-code" tabIndex={0} {...codeProtection}>{step.change.before}</code><p>Стало:</p><code className="protected-code" tabIndex={0} {...codeProtection}>{step.change.after}</code></section>}
              <section className="expected"><h3>Проверь</h3><p>{step.check}</p></section>
              {step.challenge && <section className="challenge"><h3>Попробуй сам</h3><p>{step.challenge}</p></section>}
              <details className="step-theory" key={step.id}>
                <summary>Почему это работает?</summary>
                {step.theory.split('\n\n').map((paragraph, index) => <p key={index}>{paragraph}</p>)}
              </details>
            </div>
          </section>
          <nav className="navigation" aria-label="Переход между шагами">
            <button className="button secondary" disabled={progress.step === 0}
              onClick={() => setProgress({ ...progress, step: progress.step - 1 })}>Назад</button>
            <button className="button primary" onClick={() => {
              setProgress(progress.step === lesson.steps.length - 1
                ? { ...progress, phase: 'result' }
                : { ...progress, step: progress.step + 1 });
            }}>
              {progress.step === lesson.steps.length - 1 ? (mini ? 'Улучшение готово!' : 'Игра готова!') : 'Следующий шаг'} <span aria-hidden="true">→</span>
            </button>
          </nav>
        </>}

        {progress.phase === 'result' && <section className="lesson-card result-card" aria-labelledby="screen-title">
          <div className="result-star" aria-hidden="true">✦</div>
          <h2 id="screen-title" ref={heading} tabIndex={-1}>{mini ? 'Улучшение готово!' : 'Игра готова!'}</h2>
          <p className="explanation">{mini ? 'Теперь в твоей игре появилась новая возможность.' : 'Ты создал свою игру. Теперь можешь поиграть или добавить новые возможности.'}</p>
          {onImprove && <button className="button primary" onClick={onImprove}>Улучши свою игру</button>}
          {onFinish && <button className="button primary" onClick={onFinish}>К списку улучшений</button>}
          <button className="button secondary" onClick={mini ? onBack : onCatalog || onBack}>{mini ? 'К карточке игры' : 'Все игры'}</button>
        </section>}
      </main>
    </div>
  );
}
