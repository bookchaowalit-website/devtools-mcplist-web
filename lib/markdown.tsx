import type { ReactNode } from "react";

// A small Markdown renderer for the registry's long descriptions: paragraphs, #-headings, "-" or "*" bullet
// lists, `code`, *em* and **strong**. It builds React elements, so any HTML in the source is shown as text,
// never injected. Headings move down one level (## → h3) because the page already has its h1 and an h2 above.

function inline(text: string, key: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /\*\*([^*]+)\*\*|`([^`]+)`|\*([^*]+)\*/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text))) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const k = `${key}-${match.index}`;
    if (match[1] !== undefined) nodes.push(<strong key={k}>{match[1]}</strong>);
    else if (match[2] !== undefined) nodes.push(<code key={k}>{match[2]}</code>);
    else nodes.push(<em key={k}>{match[3]}</em>);
    last = match.index + match[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

type Block = { kind: "h"; level: number; text: string } | { kind: "ul"; items: string[] } | { kind: "p"; lines: string[] };

export function parseBlocks(source: string): Block[] {
  const blocks: Block[] = [];
  for (const raw of source.split("\n")) {
    const line = raw.trim();
    const last = blocks[blocks.length - 1];
    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    const bullet = /^[-*]\s+(.*)$/.exec(line);
    if (!line) blocks.push({ kind: "p", lines: [] });
    else if (heading) blocks.push({ kind: "h", level: heading[1].length, text: heading[2] });
    else if (bullet) {
      if (last?.kind === "ul") last.items.push(bullet[1]);
      else blocks.push({ kind: "ul", items: [bullet[1]] });
    } else if (last?.kind === "p") last.lines.push(line);
    else blocks.push({ kind: "p", lines: [line] });
  }
  return blocks.filter((block) => block.kind !== "p" || block.lines.length > 0);
}

export function Markdown({ source }: { source: string }) {
  return (
    <>
      {parseBlocks(source).map((block, i) => {
        const key = `b${i}`;
        if (block.kind === "h") {
          const Tag = `h${Math.min(block.level + 1, 6)}` as "h3";
          return <Tag key={key}>{inline(block.text, key)}</Tag>;
        }
        if (block.kind === "ul") return <ul key={key}>{block.items.map((item, j) => <li key={j}>{inline(item, `${key}-${j}`)}</li>)}</ul>;
        return <p key={key}>{inline(block.lines.join(" "), key)}</p>;
      })}
    </>
  );
}
