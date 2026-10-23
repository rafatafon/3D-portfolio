"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowUpRight, ChevronRight, FileText } from "lucide-react";
import { writing } from "@/lib/writing";
import ArticleBody from "./ArticleBody";
import { useLocale, type Locale, type Localized } from "@/lib/i18n";

// Interface copy only: the essays themselves are Fredy's published English
// text and are never translated.
const copy = {
  heading: { en: "Thoughts & notes", es: "Ideas y notas" },
  subtitle: {
    en: "Software, learning, and making things happen.",
    es: "Software, aprendizaje y hacer que las cosas sucedan.",
  },
  allNotes: { en: "All notes", es: "Todas las notas" },
  backToAll: { en: "Back to all notes", es: "Volver a todas las notas" },
  minRead: { en: "min read", es: "min de lectura" },
  byline: { en: "By Fredy Maldonado", es: "Por Fredy Maldonado" },
  openPage: { en: "Open as a page", es: "Abrir como página" },
} satisfies Record<string, Localized>;

// Shown above an opened essay in Spanish mode only.
const englishOnlyNote = "Este artículo está disponible solo en inglés.";

const dateLocales: Localized = { en: "en-US", es: "es-HN" };

// Built from the ISO date at noon UTC so the day never shifts with the
// visitor's time zone.
function formatDate(isoDate: string, locale: Locale) {
  return new Date(`${isoDate}T12:00:00Z`).toLocaleDateString(
    dateLocales[locale],
    { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" },
  );
}

export default function Notes() {
  const [selected, setSelected] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const lastOpened = useRef<string | null>(null);
  const article = writing.find((item) => item.slug === selected);
  const { locale, t } = useLocale();

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
            <ArrowLeft size={16} /> {t(copy.allNotes)}
          </button>
          <header className="note-header">
            {locale === "es" && (
              <p className="document-eyebrow">{englishOnlyNote}</p>
            )}
            <p className="document-eyebrow">
              <time dateTime={article.isoDate}>
                {formatDate(article.isoDate, locale)}
              </time>{" "}
              · {article.minutes} {t(copy.minRead)}
            </p>
            <h2 tabIndex={-1} lang="en">
              {article.name}
            </h2>
            <p className="note-byline">{t(copy.byline)}</p>
            <a className="note-permalink" href={`/writing/${article.slug}`}>
              {t(copy.openPage)} <ArrowUpRight size={14} aria-hidden="true" />
            </a>
          </header>
          <div lang="en">
            <ArticleBody body={article.body} />
          </div>
          <button
            className="notes-back notes-end"
            onClick={() => setSelected(null)}
          >
            <ArrowLeft size={16} /> {t(copy.backToAll)}
          </button>
        </article>
      ) : (
        <>
          <h2>{t(copy.heading)}</h2>
          <p className="content-subtitle">{t(copy.subtitle)}</p>
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
                    <time dateTime={item.isoDate}>
                      {formatDate(item.isoDate, locale)}
                    </time>{" "}
                    · {item.minutes} {t(copy.minRead)}
                  </small>
                  <h3 lang="en">{item.name}</h3>
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
