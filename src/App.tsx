import { useEffect, useRef, useState } from 'react';
import LessonPlayer from './LessonPlayer';
import { games, programmingModes, type Game, type ProgrammingMode } from './games';

type Screen = { page: 'catalog' } | { page: 'game' | 'lesson'; game: Game };

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
    return <LessonPlayer lesson={screen.game.lesson} onBack={() => setScreen({ page: 'game', game: screen.game })} />;
  }

  return <div className="catalog-shell">
    <header className="catalog-header">
      <div className="brand"><span className="brand-mark" aria-hidden="true">✦</span> ICUBE LEARNING</div>
      {screen.page === 'game' && <button className="back-link" onClick={() => setScreen({ page: 'catalog' })}>← Все игры</button>}
    </header>
    <main>
      {screen.page === 'catalog' ? <>
        <h1 ref={heading} tabIndex={-1}>ICUBE LEARNING</h1>
        <p className="catalog-subtitle">Выбери игру и начни создавать</p>
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
                onClick={() => setScreen({ page: 'lesson', game: screen.game })}>
                <span className="mode-card-heading">{info.title}{!available && <span className="soon-badge">Скоро</span>}</span>
                <span>{info.description}</span>
              </button>;
            })}
          </div>
        </section>
      </article>}
    </main>
    <footer className="page-footer catalog-footer">Создавай. Пробуй. Смотри, что изменилось.</footer>
  </div>;
}
