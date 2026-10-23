"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

// The site speaks English and Spanish. Every piece of copy is a `Localized`
// object and components pick the current language through `useLocale().t`.
export type Locale = "en" | "es";
export type Localized<T = string> = Record<Locale, T>;
export const locales: readonly Locale[] = ["en", "es"];
export const LOCALE_KEY = "fm-locale";

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "es";
}

// A stored choice wins, then the browser's language, then English.
export function detectLocale(): Locale {
  if (typeof window === "undefined") return "en";
  try {
    const stored = window.localStorage.getItem(LOCALE_KEY);
    if (isLocale(stored)) return stored;
  } catch {
    // Storage can be unavailable (private mode); fall through.
  }
  return navigator.language?.toLowerCase().startsWith("es") ? "es" : "en";
}

export const pick = <T,>(value: Localized<T>, locale: Locale): T =>
  value[locale];

// Switching languages crossfades the text: `switching` is true while copy
// fades out, the locale swaps, then it fades back in. Workspace applies it
// as the `lang-switching` class; the CSS lives in globals.css.
export const LOCALE_FADE_OUT_MS = 140;
export const LOCALE_FADE_IN_MS = 220;

type LocaleState = {
  locale: Locale;
  // The language being switched to: equal to `locale` except during the
  // fade-out, so a toggle can move at once while the copy is still fading.
  target: Locale;
  switching: boolean;
  setLocale: (next: Locale) => void;
};

const LocaleContext = createContext<LocaleState>({
  locale: "en",
  target: "en",
  switching: false,
  setLocale: () => {},
});

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [target, setTarget] = useState<Locale>("en");
  const [switching, setSwitching] = useState(false);
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // The HTML is rendered in English; a Spanish visitor is switched during
    // the preloader, before any copy is visible.
    const detected = detectLocale();
    if (detected !== "en") {
      setLocaleState(detected);
      setTarget(detected);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(
    () => () => {
      if (pending.current) clearTimeout(pending.current);
    },
    [],
  );

  const setLocale = useCallback((next: Locale) => {
    try {
      window.localStorage.setItem(LOCALE_KEY, next);
    } catch {
      // Not persisted; the choice still applies for this visit.
    }
    if (pending.current) clearTimeout(pending.current);
    setTarget(next);
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduced) {
      setLocaleState(next);
      setSwitching(false);
      return;
    }
    setSwitching(true);
    pending.current = setTimeout(() => {
      setLocaleState(next);
      // Let the new copy render under the fade before it comes back.
      pending.current = setTimeout(() => setSwitching(false), 20);
    }, LOCALE_FADE_OUT_MS);
  }, []);

  return (
    <LocaleContext.Provider value={{ locale, target, switching, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const { locale, target, switching, setLocale } = useContext(LocaleContext);
  const t = useCallback(
    <T,>(value: Localized<T>): T => value[locale],
    [locale],
  );
  return { locale, target, switching, setLocale, t };
}
