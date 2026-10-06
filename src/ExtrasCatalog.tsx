import { useEffect, useRef } from 'react';
import { extras, type Extra } from './extras';

export default function ExtrasCatalog({ onOpen, onBack }: { onOpen: (extra: Extra) => void; onBack: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, []);
  return <div className="catalog-shell">
    <header className="catalog-header">
      <div className="brand"><span className="brand-mark" aria-hidden="true">iC</span> Айкуб Игры</div>
      <button className="back-link" onClick={onBack}>← К игре</button>
    </header>
    <main>
      <h1 className="catalog-title" ref={heading} tabIndex={-1}>Улучши свою игру</h1>
      <p className="game-description">Выбери, что хочешь добавить</p>
      <div className="game-grid">
        {extras.map(extra => <button className="game-card" key={extra.metadata.id} onClick={() => onOpen(extra)}>
          <span className="game-card-body">
            <span className="extra-icon" aria-hidden="true">{extra.metadata.icon}</span>
            <span className="game-card-title">{extra.metadata.title}</span>
            <span>{extra.metadata.description}</span>
          </span>
        </button>)}
      </div>
    </main>
  </div>;
}
