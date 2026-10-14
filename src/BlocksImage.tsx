import { useEffect, useId, useRef, useState, type PointerEvent } from 'react';

import type { ImageFocus } from './games';
import ImageFocusMask from './ImageFocusMask';
type ImageProps = { src: string; alt: string; onError: () => void; focus?: ImageFocus[]; focusVisible?: boolean; onToggleFocus?: () => void };
const limit = (value: number, maximum: number) => Math.max(-maximum, Math.min(maximum, value));

function ZoomImage({ src, alt, onError, focus, focusVisible, onToggleFocus, onExpand, onClose }: ImageProps & {
  onExpand?: () => void; onClose?: () => void;
}) {
  const maskId = useId();
  const viewport = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [natural, setNatural] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const fit = natural.width && natural.height
    ? Math.min(size.width / natural.width, size.height / natural.height) : 0;
  const width = natural.width * fit;
  const height = natural.height * fit;
  const maxX = Math.max(0, (width * zoom - size.width) / 2);
  const maxY = Math.max(0, (height * zoom - size.height) / 2);
  const offset = { x: limit(position.x, maxX), y: limit(position.y, maxY) };

  useEffect(() => {
    const element = viewport.current!;
    const observer = new ResizeObserver(() => setSize({ width: element.clientWidth, height: element.clientHeight }));
    observer.observe(element);
    // A native non-passive listener prevents browser zoom only inside this viewer.
    const wheel = (event: WheelEvent) => {
      if (!event.ctrlKey || !event.deltaY) return;
      event.preventDefault();
      setZoom(value => Math.max(1, Math.min(4, value + (event.deltaY < 0 ? 0.25 : -0.25))));
    };
    element.addEventListener('wheel', wheel, { passive: false });
    return () => { observer.disconnect(); element.removeEventListener('wheel', wheel); };
  }, []);

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || zoom === 1) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, y: event.clientY, left: offset.x, top: offset.y };
    setDragging(true);
  }

  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    setPosition({
      x: limit(drag.current.left + event.clientX - drag.current.x, maxX),
      y: limit(drag.current.top + event.clientY - drag.current.y, maxY),
    });
  }

  function endDrag() { drag.current = null; setDragging(false); }
  function reset() { setZoom(1); setPosition({ x: 0, y: 0 }); endDrag(); }

  return <div className="image-viewer">
    <div className="image-controls" aria-label="Масштаб изображения">
      <button type="button" title="Уменьшить" aria-label="Уменьшить" disabled={zoom === 1}
        onClick={() => setZoom(value => Math.max(1, value - 0.25))}>−</button>
      <button type="button" title="Увеличить" aria-label="Увеличить" disabled={zoom === 4}
        onClick={() => setZoom(value => Math.min(4, value + 0.25))}>+</button>
      <button type="button" title="Показать всю картинку" aria-label="Вписать" onClick={reset}>Вписать</button>
      {onExpand && <button type="button" title="Открыть на весь экран" aria-label="На весь экран" onClick={onExpand}>На весь экран</button>}
      {onClose && <button type="button" title="Закрыть (Esc)" aria-label="Закрыть" onClick={onClose}>Закрыть</button>}
      <span className="image-scale" aria-live="polite">{Math.round(zoom * 100)}%</span>
    </div>
    <div ref={viewport} className={`image-viewport ${zoom > 1 ? 'can-pan' : ''} ${dragging ? 'is-dragging' : ''}`}
      title="Увеличение: Ctrl + колесо мыши. Увеличенную картинку можно перетаскивать."
      onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag}
      onPointerCancel={endDrag} onLostPointerCapture={endDrag}>
      <div className="image-plane" style={{ width, height, visibility: fit ? 'visible' : 'hidden',
        transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${zoom})` }}>
        <img src={src} alt={alt} draggable={false} onDragStart={event => event.preventDefault()} onError={onError}
          onLoad={event => setNatural({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })} />
        {focus?.length && focusVisible ? <ImageFocusMask focus={focus} id={maskId} /> : null}
      </div>
    </div>
    {focus?.length ? <div className="focus-controls"><button type="button" className="button secondary focus-toggle" aria-pressed={Boolean(focusVisible)} onClick={onToggleFocus}>{focusVisible ? 'Показать всё' : 'Показать выделение'}</button></div> : null}
  </div>;
}

function FullscreenImage({ onClose, ...props }: ImageProps & { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current!;
    const previousFocus = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      element.close();
      document.body.style.overflow = overflow;
      previousFocus?.focus({ preventScroll: true });
    };
  }, []);
  return <dialog ref={dialog} className="image-dialog" aria-label={props.alt}
    onCancel={event => { event.preventDefault(); onClose(); }}>
    <ZoomImage {...props} onClose={onClose} />
  </dialog>;
}

export default function BlocksImage(props: ImageProps) {
  const [expanded, setExpanded] = useState(false);
  const [focusVisible, setFocusVisible] = useState(true);
  const focusProps = { focusVisible, onToggleFocus: () => setFocusVisible(value => !value) };
  return <>
    <ZoomImage {...props} {...focusProps} onExpand={() => setExpanded(true)} />
    {expanded && <FullscreenImage {...props} {...focusProps} onClose={() => setExpanded(false)} />}
  </>;
}
