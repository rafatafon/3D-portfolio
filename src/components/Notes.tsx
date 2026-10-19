"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { ArrowLeft, ChevronRight, FileText } from "lucide-react";
import { writing } from "@/lib/writing";
import ArticleBody from "./ArticleBody";

export default function Notes() {
  const [selected, setSelected] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const lastOpened = useRef<string | null>(null);
  const article = writing.find((item) => item.slug === selected);

  useLayoutEffect(() => {
    const scroller = root.current?.closest(".window-content");
    if (scroller) scroller.scrollTop = 0;
    if (selected) {
      root.current
        ?.querySelector<HTMLElement>("h2")
        ?.focus({ preventScroll: true });
    } else if (lastOpened.current) {
      root.current
        ?.querySelector<HTMLButtonElement>(
          `[data-note="${lastOpened.current}"]`,
        )
        ?.focus({ preventScroll: true });
    }
  }, [selected]);

  return (
    <div className="writing-content" ref={root}>
      {article ? (
        <article className="note-reader">
          <button className="notes-back" onClick={() => setSelected(null)}>
            <ArrowLeft size={16} /> All notes
          </button>
          <header className="note-header">
            <p className="document-eyebrow">
              <time dateTime={article.isoDate}>{article.date}</time> ·{" "}
              {article.minutes} min read
            </p>
            <h2 tabIndex={-1}>{article.name}</h2>
            <p className="note-byline">By Fredy Maldonado</p>
          </header>
          <ArticleBody body={article.body} />
          <button
            className="notes-back notes-end"
            onClick={() => setSelected(null)}
          >
            <ArrowLeft size={16} /> Back to all notes
          </button>
        </article>
      ) : (
        <>
          <div className="notes-illustration" aria-hidden="true">
            Notes to self<span>and anyone curious.</span>
          </div>
          <h2>Thoughts & notes</h2>
          <p className="content-subtitle">
            Software, learning, and making things happen.
          </p>
          <div className="writing-list">
            {writing.map((item) => (
              <button
                key={item.slug}
                data-note={item.slug}
                onClick={() => {
                  lastOpened.current = item.slug;
                  setSelected(item.slug);
                }}
              >
                <FileText
                  className="note-file-icon"
                  size={23}
                  aria-hidden="true"
                />
                <span>
                  <small>
                    {item.date} · {item.minutes} min read
                  </small>
                  <h3>{item.name}</h3>
                </span>
                <ChevronRight size={18} aria-hidden="true" />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
