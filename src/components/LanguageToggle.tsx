"use client";

import type { CSSProperties } from "react";
import { locales, useLocale } from "@/lib/i18n";

const names = { en: "English", es: "Español" } as const;

// EN / ES switch: a pill whose thumb slides under the chosen language. It
// follows `target`, so the thumb moves on click while the copy crossfades.
// Shared by the room overlay and the desktop's Control Center (which passes
// `language-toggle-panel`); the styles live under "Language toggle and
// crossfade" in globals.css.
export default function LanguageToggle({
  className = "",
  inert = false,
}: {
  className?: string;
  // The room's toggle hides with the side panel; keep it out of reach then.
  inert?: boolean;
}) {
  const { target, setLocale } = useLocale();
  return (
    <div
      className={`language-toggle ${className}`.trim()}
      role="group"
      aria-label={target === "es" ? "Idioma" : "Language"}
      inert={inert}
      style={{ "--lang-index": locales.indexOf(target) } as CSSProperties}
    >
      <span className="language-toggle-thumb" aria-hidden="true" />
      {locales.map((item) => (
        <button
          key={item}
          type="button"
          lang={item}
          aria-pressed={target === item}
          aria-label={names[item]}
          title={names[item]}
          onClick={() => {
            if (item !== target) setLocale(item);
          }}
        >
          {item.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
