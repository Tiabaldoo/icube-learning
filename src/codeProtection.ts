import type { HTMLAttributes } from 'react';

// Scoped to lesson code areas, never to the page or document.
export const codeProtection: HTMLAttributes<HTMLElement> = {
  onCopy: event => event.preventDefault(),
  onContextMenu: event => event.preventDefault(),
  onKeyDown: event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'c') event.preventDefault();
  },
};
