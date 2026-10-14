import { useEffect, useRef, useState } from 'react';
import LessonPlayer from './LessonPlayer';
import { loadPublished, mergeGames, type Bundle } from './content';
import { games, programmingModes, type Game, type ProgrammingMode, type LessonMode, type Improvement } from './games';

type Screen = { page: 'catalog' } | { page: 'game'; game: Game }
  | { page: 'lesson'; game: Game; mode: LessonMode }
  | { page: 'improvements'; game: Game }
  | { page: 'improvement-mode'; game: Game; extra: Improvement }
  | { page: 'improvement'; game: Game; mode: LessonMode; extra: Improvement };

function Difficulty({ value }: { value: number }) {
  return <span className="game-difficulty" aria-label={`Сложность: ${value} из 5`}>
    <span aria-hidden="true">{'★'.repeat(value)}{'☆'.repeat(5 - value)}</span>
  </span>;
}

function GameCover({ game }: { game: Game }) {
  return <div className={`game-cover ${'layout' in game.metadata.cover ? 'cover-' + game.metadata.cover.layout : ''}`} aria-hidden="true">
    <span className="cover-hero">{game.metadata.cover.hero}</span>
    {'enemy' in game.metadata.cover && <span className="cover-enemy">{game.metadata.cover.enemy}</span>}
    <span className="cover-star star-one">{game.metadata.cover.collectible}</span>
    <span className="cover-star star-two">{game.metadata.cover.collectible}</span>
    <span className="cover-star star-three">{game.metadata.cover.collectible}</span>
    <span className="cover-ground" />
  </div>;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>({ page: 'catalog' });
  const heading = useRef<HTMLHeadingElement>(null);

  const [catalog, setCatalog] = useState(games);
  const [pending, setPending] = useState<Bundle | null>(null);
  const [message, setMessage] = useState('');
  const [available, setAvailable] = useState(false);
  const [busy, setBusy] = useState(false);
  async function check(manual = true) {
    if (!window.learningContent) return;
    setBusy(true);
    try {
      const result = await window.learningContent.check();
      setAvailable(result.state === 'available');
      if (result.state === 'available') setMessage('Доступны новые материалы. Появились новые игры или обновления уроков.');
      else if (manual) setMessage('Все материалы обновлены');
    } catch { if (manual) setMessage('Не удалось проверить материалы. Проверь подключение к интернету. Уроки доступны офлайн.'); }
    finally { setBusy(false); }
  }
  async function install() {
    if (!window.learningContent) return;
    setBusy(true); setMessage('Загрузка материалов…');
    try {
      setPending(await window.learningContent.install()); setAvailable(false);
      setMessage('Материалы обновлены');
    } catch { setMessage('Не удалось обновить материалы. Предыдущие уроки сохранены. Попробуй позже.'); }
    finally { setBusy(false); }
  }
  useEffect(() => {
    let active = true;
    loadPublished().then(bundle => { if (active && bundle) setPending(bundle); }).finally(() => { if (active) void check(false); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (pending && screen.page === 'catalog') {
      setCatalog(mergeGames(pending.games)); setPending(null);
    }
  }, [pending, screen.page]);


  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [screen]);

  if (screen.page === 'lesson') {
    return <LessonPlayer key={screen.mode} lesson={screen.game.lessons[screen.mode]!} resources={screen.game.resources} mode={screen.mode} onBack={() => setScreen({ page: 'game', game: screen.game })}
      onCatalog={() => setScreen({ page: 'catalog' })} onImprove={screen.game.improvements.length ? () => setScreen({ page: 'improvements', game: screen.game }) : undefined} />;
  }
  if (screen.page === 'improvement') {
    return <LessonPlayer key={`${screen.extra.metadata.id}:${screen.mode}`} lesson={screen.extra.lessons[screen.mode]!} resources={screen.game.resources} mode={screen.mode}
      onBack={() => setScreen({ page: 'game', game: screen.game })}
      onFinish={() => setScreen({ page: 'improvements', game: screen.game })} />;
  }

  return <div className="catalog-shell">
    <header className="catalog-header">
      <div className="brand"><span className="brand-mark" aria-hidden="true">iC</span> Айкуб Игры</div>
      {screen.page !== 'catalog' && <button className="back-link" onClick={() => setScreen({ page: 'catalog' })}>← Все игры</button>}
    </header>
    <main>
      {window.learningContent && <div className="content-updates">
        <button className="back-link" disabled={busy} onClick={() => void check()}>Проверить обновления</button>
        <span role="status">{message}</span>
        {available && <button className="button primary" disabled={busy} onClick={() => void install()}>Обновить</button>}
      </div>}
      {screen.page === 'catalog' ? <>
        <h1 className="catalog-title" ref={heading} tabIndex={-1}>Выбери игру</h1>
        <div className="game-grid">
          {catalog.map(game => <button className="game-card game-card-with-cover" key={game.metadata.id}
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
      </> : screen.page === 'improvements' ? <section className="game-details lesson-card improvement-details">
        <button className="back-link" onClick={() => setScreen({ page: 'game', game: screen.game })}>← К игре</button>
        <h1 ref={heading} tabIndex={-1}>Улучши свою игру</h1>
        <p className="game-description">Уже создал «{screen.game.metadata.title}»? Добавь в неё новые возможности!</p>
        <div className="mode-grid">{screen.game.improvements.map(extra => <button className="mode-card" key={extra.metadata.id} onClick={() => setScreen({ page: 'improvement-mode', game: screen.game, extra })}>
          <span className="mode-card-heading">{extra.metadata.icon} {extra.metadata.title}</span><span>{extra.metadata.description}</span>
        </button>)}</div>
      </section> : screen.page === 'improvement-mode' ? <section className="game-details lesson-card improvement-details">
        <button className="back-link" onClick={() => setScreen({ page: 'improvements', game: screen.game })}>← К улучшениям</button>
        <h1 ref={heading} tabIndex={-1}>{screen.extra.metadata.title}</h1>
        <p className="game-description">Улучшаем игру «{screen.game.metadata.title}»: {screen.extra.metadata.description}</p>
        <section className="mode-selection">
        <h2>Выбери способ программирования</h2>
        <div className="mode-grid">{(Object.keys(screen.extra.lessons) as LessonMode[]).map(mode => <button className="mode-card" key={mode} onClick={() => setScreen({ page: 'improvement', game: screen.game, extra: screen.extra, mode })}>
          <span className="mode-card-heading">{programmingModes[mode].title}</span><span>{programmingModes[mode].description}</span>
        </button>)}</div>
        </section>
      </section> : <article className="game-details lesson-card">
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
              const available = screen.game.metadata.modes[mode]!.available;
              const info = programmingModes[mode];
              return <button className="mode-card" key={mode} disabled={!available}
                onClick={() => { if (mode in screen.game.lessons) setScreen({ page: 'lesson', game: screen.game, mode: mode as LessonMode }); }}>
                <span className="mode-card-heading">{info.title}{!available && <span className="soon-badge">Скоро</span>}</span>
                <span>{info.description}</span>
              </button>;
            })}
          </div>
        </section>
        {screen.game.improvements.length > 0 && <section className="improvement-section">
          <h2>Улучши свою игру</h2><p>Уже создал игру? Добавь в неё новые возможности!</p>
          <div className="mode-grid">{screen.game.improvements.map(extra => <button className="mode-card" key={extra.metadata.id} onClick={() => setScreen({ page: 'improvement-mode', game: screen.game, extra })}>
            <span className="mode-card-heading">{extra.metadata.icon} {extra.metadata.title}</span><span>{extra.metadata.description}</span><span>Открыть инструкцию →</span>
          </button>)}</div>
        </section>}
      </article>}
    </main>
  </div>;
}
