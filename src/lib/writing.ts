import articles from "./writing.json";

export type WritingNode =
  | string
  | {
      tag: string;
      children: WritingNode[];
      start?: number;
    };

// Full published articles imported from Fredy's blog on October 18, 2026.
// Semantic text only: no remote HTML, scripts, or Framer dependencies.
export const writing = articles;
export type WritingArticle = (typeof writing)[number];
