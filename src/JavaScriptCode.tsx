import { useState } from 'react';

const sources = import.meta.glob<string>('../lessons/*/steps/*.ts', {
  eager: true, query: '?raw', import: 'default',
});

// Small lexer for the lesson's keywords, numbers and multiline image strings.
// Rendering React text nodes (not HTML) keeps source content inert.
function highlight(source: string) {
  const tokens = source.match(/`[^`]*`|\/\/[^\n]*|\b(?:namespace|export|const|let|function|if|true|null)\b|\b\d+\b|[A-Za-z_$][\w$]*|[^A-Za-z_$\d`]+|`/g) || [];
  const lines: { text: string; kind: string }[][] = [[]];
  for (const token of tokens) {
    const kind = token.startsWith('`') ? 'string' : token.startsWith('//') ? 'comment'
      : /^(namespace|export|const|let|function|if|true|null)$/.test(token) ? 'keyword'
      : /^\d+$/.test(token) ? 'number' : /^[A-Za-z_$]/.test(token) ? 'identifier' : '';
    token.split('\n').forEach((text, index) => {
      if (index) lines.push([]);
      lines[lines.length - 1].push({ text, kind });
    });
  }
  if (source.endsWith('\n')) lines.pop();
  return lines;
}

export default function JavaScriptCode({ lessonId, codeFile, newLines }: {
  lessonId: string; codeFile: string; newLines: number[][];
}) {
  const [fontSize, setFontSize] = useState(16);
  const key = `../lessons/${lessonId}/steps/${codeFile.split('/').pop()}`;
  const source = sources[key];
  if (!source) return <p role="alert">Не удалось загрузить код шага.</p>;
  return <section className="code-panel" aria-label="Код JavaScript">
    <div className="code-toolbar">
      <span>Перепиши в MakeCode · <span className="new-code-label">новые строки</span></span>
      <div><button title="Уменьшить текст" aria-label="Уменьшить текст" disabled={fontSize === 14} onClick={() => setFontSize(size => size - 1)}>A−</button>
        <button title="Увеличить текст" aria-label="Увеличить текст" disabled={fontSize === 20} onClick={() => setFontSize(size => size + 1)}>A+</button></div>
    </div>
    <pre className="code-viewer" tabIndex={0} aria-label="Полный код шага. Перепиши его вручную." style={{ fontSize }}
      onCopy={event => event.preventDefault()} onContextMenu={event => event.preventDefault()}
      onKeyDown={event => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'c') event.preventDefault(); }}>
      <code>{highlight(source).map((line, index) => <span className={`code-line ${newLines.some(([start, end]) => index + 1 >= start && index + 1 <= end) ? 'new-code' : ''}`} key={index}>
        <span className="line-number" aria-hidden="true">{index + 1}</span><span className="line-source">{line.map((token, i) => <span className={`syntax-${token.kind}`} key={i}>{token.text}</span>)}</span>
      </span>)}</code>
    </pre>
  </section>;
}
