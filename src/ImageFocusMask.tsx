import type { ImageFocus } from './games';
// Black holes form a union: overlapping rectangles never darken each other.
export default function ImageFocusMask({ focus, id }: { focus: ImageFocus[]; id: string }) {
  return <svg className="image-focus-mask" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
    <defs><mask id={id} maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100" style={{ maskType: 'luminance' }}>
      <rect width="100" height="100" fill="white" />
      {focus.map((r, i) => <rect key={i} x={r.x} y={r.y} width={r.width} height={r.height} fill="black" />)}
    </mask></defs>
    <rect width="100" height="100" fill="rgba(0, 0, 0, 0.45)" mask={`url(#${id})`} />
  </svg>;
}
