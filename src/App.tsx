import { useEffect, useRef, useState } from 'react';
import LessonPlayer from './LessonPlayer';
import ExtrasCatalog from './ExtrasCatalog';
import type { Extra, ExtraMode } from './extras';
import { games, programmingModes, type Game, type ProgrammingMode, type LessonMode } from './games';

type Screen = { page: 'catalog' } | { page: 'game'; game: Game }
  | { page: 'lesson'; game: Game; mode: LessonMode }
  | { page: 'improvements'; game: Game; mode: ExtraMode }
  | { page: 'improvement'; game: Game; mode: ExtraMode; extra: Extra };

function Difficulty({ value }: { value: number }) {
  return <span className="game-difficulty" aria-label={`Сложность: ${value} из 5`}>
    <span aria-hidden="true">{'★'.repeat(value)}{'☆'.repeat(5 - value)}</span>
  </span>;
}

function GameCover({ game }: { game: Game }) {
  return <div className="game-cover" aria-hidden="true">
    <span className="cover-hero">{game.metadata.cover.hero}</span>
    <span className="cover-star star-one">{game.metadata.cover.collectible}</span>
    <span className="cover-star star-two">{game.metadata.cover.collectible}</span>
    <span className="cover-star star-three">{game.metadata.cover.collectible}</span>
    <span className="cover-ground" />
  </div>;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>({ page: 'catalog' });
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    // Discard only obsolete lesson progress; never read or persist personal progress.
    try {
      games.forEach(game => localStorage.removeItem(`icube-learning:${game.metadata.id}:progress:v1`));
    } catch { /* Catalog and lessons also work when storage is unavailable. */ }
  }, []);

  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [screen]);

  if (screen.page === 'lesson') {
    const improvementMode = screen.mode === 'python' ? null : screen.mode;
    return <LessonPlayer key={screen.mode} lesson={screen.game.lessons[screen.mode]} mode={screen.mode} onBack={() => setScreen({ page: 'game', game: screen.game })}
      onImprove={improvementMode ? () => setScreen({ page: 'improvements', game: screen.game, mode: improvementMode }) : undefined} />;
  }
  if (screen.page === 'improvements') {
    return <ExtrasCatalog onBack={() => setScreen({ page: 'game', game: screen.game })}
      onOpen={extra => setScreen({ page: 'improvement', game: screen.game, mode: screen.mode, extra })} />;
  }
  if (screen.page === 'improvement') {
    return <LessonPlayer key={`${screen.extra.metadata.id}:${screen.mode}`} lesson={screen.extra.lessons[screen.mode]} mode={screen.mode}
      onBack={() => setScreen({ page: 'game', game: screen.game })}
      onFinish={() => setScreen({ page: 'improvements', game: screen.game, mode: screen.mode })} />;
  }

  return <div className="catalog-shell">
    <header className="catalog-header">
      <div className="brand"><span className="brand-mark" aria-hidden="true">iC</span> Айкуб Игры</div>
      {screen.page === 'game' && <button className="back-link" onClick={() => setScreen({ page: 'catalog' })}>← Все игры</button>}
    </header>
    <main>
      {screen.page === 'catalog' ? <>
        <h1 className="catalog-title" ref={heading} tabIndex={-1}>Выбери игру</h1>
        <div className="game-grid">
          {games.map(game => <button className="game-card" key={game.metadata.id}
            aria-label={`Открыть игру «${game.metadata.title}»`}
            onClick={() => setScreen({ page: 'game', game })}>
            <GameCover game={game} />
            <span className="game-card-body">
              <span className="game-card-title">{game.metadata.title}</span>
              <Difficulty value={game.metadata.difficulty} />
              <span className="game-learns">{game.metadata.learns.join(' • ')}</span>
            </span>
          </button>)}
        </div>
      </> : <article className="game-details lesson-card">
        <div className="game-overview">
          <GameCover game={screen.game} />
          <div>
            <h1 ref={heading} tabIndex={-1}>{screen.game.metadata.title}</h1>
            <Difficulty value={screen.game.metadata.difficulty} />
            <p className="game-description">{screen.game.metadata.description}</p>
            <h2 className="learns-heading">Ты научишься</h2>
            <ul className="learns-list">{screen.game.metadata.learns.map(item => <li key={item}>{item}</li>)}</ul>
          </div>
        </div>
        <section className="mode-selection" aria-labelledby="mode-title">
          <h2 id="mode-title">Выбери способ программирования</h2>
          <div className="mode-grid">
            {(Object.keys(screen.game.metadata.modes) as ProgrammingMode[]).map(mode => {
              const available = screen.game.metadata.modes[mode].available;
              const info = programmingModes[mode];
              return <button className="mode-card" key={mode} disabled={!available}
                onClick={() => { if (mode in screen.game.lessons) setScreen({ page: 'lesson', game: screen.game, mode: mode as LessonMode }); }}>
                <span className="mode-card-heading">{info.title}{!available && <span className="soon-badge">Скоро</span>}</span>
                <span>{info.description}</span>
              </button>;
            })}
          </div>
        </section>
      </article>}
    </main>
  </div>;
}
