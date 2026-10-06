import { useEffect, useRef, useState } from 'react';
import { codeProtection } from './codeProtection';

const sources = import.meta.glob<string>('../lessons/*/steps/javascript-micro/*.ts', {
  eager: true, query: '?raw', import: 'default',
});
const extraSources = import.meta.glob<string>('../extras/*/javascript/steps/*.ts', {
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

export default function JavaScriptCode({ lessonId, codeFile, newLines, changedLines, sourceRoot = 'lessons' }: {
  lessonId: string; codeFile: string; newLines: number[][]; changedLines: number[][]; sourceRoot?: 'lessons' | 'extras';
}) {
  const [fontSize, setFontSize] = useState(16);
  const viewer = useRef<HTMLPreElement>(null);
  const key = `../${sourceRoot}/${lessonId}/${codeFile}`;
  const source = (sourceRoot === 'extras' ? extraSources : sources)[key];
  useEffect(() => {
    const panel = viewer.current;
    const target = panel?.querySelector('.changed-code, .new-code');
    if (panel && target) panel.scrollTop += target.getBoundingClientRect().top - panel.getBoundingClientRect().top - panel.clientHeight / 3;
  }, [codeFile, fontSize]);
  if (!source) return <p role="alert">Не удалось загрузить код шага.</p>;
  return <section className="code-panel" aria-label="Код JavaScript">
    <div className="code-toolbar">
      <span>{sourceRoot === 'extras' ? 'Фрагмент для твоей игры' : 'Код после шага'} · <span className="new-code-label">{changedLines.length ? 'изменённые строки' : newLines.length || sourceRoot === 'lessons' ? 'новые строки' : 'образец'}</span></span>
      <div><button title="Уменьшить текст" aria-label="Уменьшить текст" disabled={fontSize === 14} onClick={() => setFontSize(size => size - 1)}>A−</button>
        <button title="Увеличить текст" aria-label="Увеличить текст" disabled={fontSize === 20} onClick={() => setFontSize(size => size + 1)}>A+</button></div>
    </div>
    <pre ref={viewer} className="code-viewer protected-code" tabIndex={0} aria-label={sourceRoot === 'extras' ? 'Фрагмент кода. Размести его в своей игре по инструкции шага.' : 'Полный код шага. Добавляй или изменяй только указанные строки; рисунки вставляет MakeCode.'} style={{ fontSize }} {...codeProtection}>
      <code>{highlight(source).map((line, index) => <span className={`code-line ${newLines.some(([start, end]) => index + 1 >= start && index + 1 <= end) ? 'new-code' : ''} ${changedLines.some(([start, end]) => index + 1 >= start && index + 1 <= end) ? 'changed-code' : ''}`} key={index}>
        <span className="line-number" aria-hidden="true">{index + 1}</span><span className="line-source">{line.map((token, i) => <span className={`syntax-${token.kind}`} key={i}>{token.text}</span>)}</span>
      </span>)}</code>
    </pre>
  </section>;
}
