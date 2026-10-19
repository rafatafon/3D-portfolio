import { createElement, type ReactNode } from "react";
import type { WritingNode } from "@/lib/writing";

const tags = new Set([
  "p",
  "h3",
  "h4",
  "strong",
  "em",
  "ul",
  "ol",
  "li",
  "blockquote",
  "code",
  "br",
]);

function renderNode(node: WritingNode, index: number): ReactNode {
  if (typeof node === "string") return node;
  if (!tags.has(node.tag)) return null;
  return createElement(
    node.tag,
    {
      key: index,
      ...(node.tag === "ol" && node.start ? { start: node.start } : {}),
    },
    ...(node.tag === "br" ? [] : node.children.map(renderNode)),
  );
}

export default function ArticleBody({ body }: { body: WritingNode[] }) {
  return <div className="article-prose">{body.map(renderNode)}</div>;
}
