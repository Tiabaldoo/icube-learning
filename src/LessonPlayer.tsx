import { useEffect, useRef, useState } from 'react';
import type { Lesson, LessonMode } from './games';
import BlocksImage from './BlocksImage';
import JavaScriptCode from './JavaScriptCode';

const images = import.meta.glob<string>(['../lessons/*/images/blocks/*.png', '../lessons/*/images/ui/*.png'], {
  eager: true, query: '?url', import: 'default',
});

type Progress = {
  phase: 'lesson' | 'quiz' | 'result';
  step: number;
  lessonCompleted: boolean;
  questionIndex: number;
  answers: (number | null)[];
  result: number | null;
};

function freshProgress(lesson: Lesson): Progress {
  return {
    phase: 'lesson', step: 0, lessonCompleted: false, questionIndex: 0,
    answers: lesson.quiz.map(() => null), result: null,
  };
}

function countCorrect(answers: Progress['answers'], lesson: Lesson) {
  return answers.filter((answer, index) => answer === lesson.quiz[index].correct).length;
}

export default function LessonPlayer({ lesson, mode, onBack }: { lesson: Lesson; mode: LessonMode; onBack: () => void }) {
  const [progress, setProgress] = useState(() => freshProgress(lesson));
  const [imageFailed, setImageFailed] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const step = lesson.steps[progress.step];
  const question = lesson.quiz[progress.questionIndex];
  const chosen = progress.answers[progress.questionIndex];
  const imageKey = `../lessons/${lesson.id}/${step.visual.src}`;

  useEffect(() => {
    setImageFailed(false);
    heading.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [progress.phase, progress.step, progress.questionIndex]);

  function advanceQuiz() {
    if (chosen === null) return;
    if (progress.questionIndex === lesson.quiz.length - 1) {
      setProgress({ ...progress, phase: 'result', result: countCorrect(progress.answers, lesson) });
    } else {
      setProgress({ ...progress, questionIndex: progress.questionIndex + 1 });
    }
  }

  return (
    <div className={`app-shell ${progress.phase === 'lesson' ? 'lesson-screen' : ''}`}>
      <header className="lesson-header">
        <div className="brand"><span className="brand-mark" aria-hidden="true">iC</span> Айкуб Игры <button className="back-link lesson-back" onClick={onBack}>← К игре</button></div>
        <div className="lesson-heading">
          <div><p className="eyebrow">{mode === 'javascript' ? 'JavaScript' : 'Блоки'}</p><h1>{lesson.title}</h1></div>
        </div>
        <ol className="step-track" aria-label="Шаги урока">
          {lesson.steps.map((item, index) => (
            <li key={item.id} className={progress.phase !== 'lesson' || index < progress.step ? 'done' : index === progress.step ? 'current' : ''}
              aria-current={progress.phase === 'lesson' && index === progress.step ? 'step' : undefined}>
              <span>{progress.phase !== 'lesson' || index < progress.step ? '✓' : index + 1}</span>
              <span className="sr-only">{item.title}</span>
            </li>
          ))}
        </ol>
      </header>

      <main>
        {progress.phase === 'lesson' && <>
          <section className="lesson-card step-card" aria-labelledby="screen-title">
            {step.visual.type === 'code' ? <JavaScriptCode key={step.id} lessonId={lesson.id} codeFile={step.visual.codeFile} newLines={step.newLines} changedLines={step.changedLines} /> : <figure className="blocks-picture">
              {imageFailed || !images[imageKey]
                ? <p role="alert">Не удалось загрузить картинку. Попробуй обновить страницу.</p>
                : <BlocksImage key={step.id} src={images[imageKey]} alt={`${step.visual.type === 'ui' ? 'Интерфейс' : 'Блоки'} MakeCode: ${step.title}`} onError={() => setImageFailed(true)} />}
              <figcaption>{step.visual.caption}</figcaption>
            </figure>}
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
                <ul>{step.commands.map((command, index) => <li key={index}><code>{command.code}</code><p>{command.purpose}</p></li>)}</ul>
              </section>}
              {step.change.before && <section className="code-change"><h3>Что изменить</h3><p>Было:</p><code>{step.change.before}</code><p>Стало:</p><code>{step.change.after}</code></section>}
              <section className="expected"><h3>Проверь</h3><p>{step.check}</p></section>
              {step.challenge && <section className="challenge"><h3>Попробуй сам</h3><p>{step.challenge}</p></section>}
              <details className="step-theory" key={step.id}>
                <summary>Почему это работает?</summary>
                <p>{step.theory}</p>
              </details>
            </div>
          </section>
          <nav className="navigation" aria-label="Переход между шагами">
            <button className="button secondary" disabled={progress.step === 0}
              onClick={() => setProgress({ ...progress, step: progress.step - 1 })}>Назад</button>
            <button className="button primary" onClick={() => setProgress(progress.step === lesson.steps.length - 1
              ? { ...progress, phase: 'quiz', lessonCompleted: true }
              : { ...progress, step: progress.step + 1 })}>
              {progress.step === lesson.steps.length - 1 ? 'Перейти к тесту' : 'Далее'} <span aria-hidden="true">→</span>
            </button>
          </nav>
        </>}

        {progress.phase === 'quiz' && <section className="lesson-card quiz-card" aria-labelledby="screen-title">
          <p className="step-label">Вопрос {progress.questionIndex + 1} из {lesson.quiz.length}</p>
          <h2 id="screen-title" ref={heading} tabIndex={-1}>Проверим, что ты узнал</h2>
          <fieldset className="answers" disabled={chosen !== null}>
            <legend>{question.question}</legend>
            {question.answers.map((answer, index) => <label key={index}
              className={`answer ${chosen === index ? 'selected' : ''} ${chosen !== null && index === question.correct ? 'correct' : ''}`}>
              <input type="radio" name={`question-${progress.questionIndex}`} checked={chosen === index}
                onChange={() => setProgress({ ...progress, answers: progress.answers.map((value, i) => i === progress.questionIndex ? index : value) })} />
              <span>{answer}</span>
            </label>)}
          </fieldset>
          {chosen !== null && <div className={`feedback ${chosen === question.correct ? 'success' : 'retry'}`} role="status">
            <h3>{chosen === question.correct ? 'Верно!' : 'Пока не совсем верно'}</h3>
            {chosen !== question.correct && <p>Правильный ответ: {question.answers[question.correct]}.</p>}
            <p>{question.explanation}</p>
          </div>}
          <div className="quiz-navigation"><button className="button primary" disabled={chosen === null} onClick={advanceQuiz}>
            {progress.questionIndex === lesson.quiz.length - 1 ? 'Показать результат' : 'К следующему вопросу'} <span aria-hidden="true">→</span>
          </button></div>
        </section>}

        {progress.phase === 'result' && <section className="lesson-card result-card" aria-labelledby="screen-title">
          <div className="result-star" aria-hidden="true">✦</div>
          <p className="step-label">Урок пройден</p>
          <h2 id="screen-title" ref={heading} tabIndex={-1}>Результат: {progress.result} из {lesson.quiz.length}</h2>
          <p className="explanation">{progress.result === lesson.quiz.length
            ? 'Все ответы верные! Ты знаешь, как работает твоя игра.'
            : 'Ты прошёл весь урок! Можно повторить шаги и попробовать ещё раз.'}</p>
          <button className="button primary" onClick={() => setProgress(freshProgress(lesson))}>Пройти урок заново</button>
        </section>}
      </main>
    </div>
  );
}
