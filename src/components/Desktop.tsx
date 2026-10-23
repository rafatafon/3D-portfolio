"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useLayoutEffect,
} from "react";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  ChevronRight,
  Download,
  FileText,
  Folder,
  House,
  Mail,
  Maximize2,
  Minus,
  PanelLeft,
  Search,
  X,
  ChevronLeft,
  LayoutGrid,
  SlidersHorizontal,
  Wifi,
  BatteryFull,
  Moon,
  Sun,
  Languages,
} from "lucide-react";
import { folders, profile, type FolderId } from "@/lib/content";
import { useLocale, type Locale, type Localized } from "@/lib/i18n";
import LanguageToggle from "./LanguageToggle";
import PortfolioContent from "./PortfolioContent";

// Desktop chrome copy. Folder names come from `folders` in content.ts. The
// monitor's painted screen (desk/screenTexture.ts) reads the same strings.
export const strings = {
  desktop: {
    en: "Interactive portfolio desktop",
    es: "Escritorio interactivo del portafolio",
  },
  menu: { en: "Desktop menu", es: "Menú del escritorio" },
  aboutWorkspace: {
    en: "About this workspace",
    es: "Acerca de este espacio",
  },
  finder: { en: "Finder", es: "Finder" },
  contact: { en: "Contact", es: "Contacto" },
  searchFiles: {
    en: "Search portfolio files",
    es: "Buscar archivos del portafolio",
  },
  displaySettings: { en: "Display settings", es: "Ajustes de pantalla" },
  display: { en: "Display", es: "Pantalla" },
  darkAppearance: { en: "Dark appearance", es: "Apariencia oscura" },
  on: { en: "On", es: "Activada" },
  off: { en: "Off", es: "Desactivada" },
  language: { en: "Language", es: "Idioma" },
  done: { en: "Done", es: "Listo" },
  portfolioFiles: { en: "Portfolio files", es: "Archivos del portafolio" },
  open: {
    en: (name: string) => `Open ${name}`,
    es: (name: string) => `Abrir ${name}`,
  },
  openResume: {
    en: "Open résumé PDF (in a new tab)",
    es: "Abrir el currículum en PDF (en una pestaña nueva)",
  },
  resumeFile: { en: "Résumé.pdf", es: "Currículum.pdf" },
  resume: { en: "Résumé", es: "Currículum" },
  window: {
    en: (name: string) => `${name} window`,
    es: (name: string) => `Ventana ${name}`,
  },
  closeWindow: {
    en: (name: string) => `Close ${name} window`,
    es: (name: string) => `Cerrar la ventana ${name}`,
  },
  minimizeWindow: {
    en: (name: string) => `Minimize ${name} window`,
    es: (name: string) => `Minimizar la ventana ${name}`,
  },
  maximizeWindow: {
    en: (name: string) => `Maximize ${name} window`,
    es: (name: string) => `Maximizar la ventana ${name}`,
  },
  searchInFinder: { en: "Search in Finder", es: "Buscar en Finder" },
  favorites: { en: "Favorites", es: "Favoritos" },
  allFiles: { en: "All files", es: "Todos los archivos" },
  location: { en: "Location", es: "Ubicación" },
  studio: { en: "The studio", es: "El estudio" },
  workspace: { en: "Fredy's workspace", es: "Espacio de Fredy" },
  madeWithCare: { en: "Made with care", es: "Hecho con cariño" },
  findFile: {
    en: "Find a portfolio file",
    es: "Busca un archivo del portafolio",
  },
  searchPlaceholder: {
    en: "Find something in my workspace…",
    es: "Busca algo en mi espacio de trabajo…",
  },
  searchFolders: { en: "Search folders", es: "Buscar carpetas" },
  closeSearch: { en: "Close search", es: "Cerrar búsqueda" },
  noResults: {
    en: "No files found. Try “projects” or “about”.",
    es: "No se encontraron archivos. Prueba con “proyectos” o “sobre mí”.",
  },
  dock: { en: "Application dock", es: "Dock de aplicaciones" },
  // The Apple menu's "About this workspace" panel. The title reuses
  // `workspace`; versions are the majors in package.json.
  aboutSubtitle: { en: "Portfolio · 2026", es: "Portafolio · 2026" },
  aboutSpecs: {
    en: [
      ["Framework", "Next.js 16 · React 19"],
      ["Language", "TypeScript 5"],
      ["3D", "three.js · React Three Fiber · drei"],
      ["Styling", "Plain CSS"],
      ["Tooling", "pnpm · Vercel"],
      ["Models", "Fable 5.1 · GPT-6 Astra"],
    ],
    es: [
      ["Framework", "Next.js 16 · React 19"],
      ["Lenguaje", "TypeScript 5"],
      ["3D", "three.js · React Three Fiber · drei"],
      ["Estilos", "CSS puro"],
      ["Herramientas", "pnpm · Vercel"],
      ["Modelos", "Fable 5.1 · GPT-6 Astra"],
    ],
  },
  moreInfo: { en: "More Info…", es: "Más información…" },
  moreInfoLabel: {
    en: "More info: the project's source on GitHub (opens in a new tab)",
    es: "Más información: el código del proyecto en GitHub (abre en una pestaña nueva)",
  },
  madeInHonduras: {
    en: "Made with care in Honduras.",
    es: "Hecho con cariño en Honduras.",
  },
  copyright: { en: "© 2026 Fredy Maldonado.", es: "© 2026 Fredy Maldonado." },
  closeAbout: { en: "Close", es: "Cerrar" },
} satisfies Record<string, Localized<unknown>>;

// The Finder window lists every desktop item; it is a window but not a
// portfolio folder, so it stays out of `FolderId`.
type WindowId = FolderId | "finder";

export function FileIcon({
  kind = "folder",
  small = false,
}: {
  kind?: "folder" | "document" | "contact" | "resume";
  small?: boolean;
}) {
  if (kind === "folder")
    return (
      <span
        className={`file-icon folder-icon ${small ? "small" : ""}`}
        aria-hidden="true"
      >
        <span />
        <i />
      </span>
    );
  if (kind === "contact")
    return (
      <span
        className={`file-icon mail-icon ${small ? "small" : ""}`}
        aria-hidden="true"
      >
        <Mail strokeWidth={1.1} />
      </span>
    );
  return (
    <span
      className={`file-icon paper-icon ${small ? "small" : ""}`}
      aria-hidden="true"
    >
      <i />
      <i />
      <i />
      <i />
      {kind === "resume" && <b>PDF</b>}
    </span>
  );
}

// Shared with the painted monitor screen (desk/screenTexture.ts).
export const appleMarkPath =
  "M14.5.6c.2 2-1.5 4.1-3.6 4.2-.4-1.9 1.6-4 3.6-4.2ZM18.9 17.4c-.5 1.3-.8 1.9-1.5 3-1 1.5-2.4 3.3-4.1 3.3-1.5 0-1.9-1-4-1s-2.5 1-4 1c-1.7 0-3-1.6-4-3.2C-1.4 16 .1 9.2 3.3 7.3c2.2-1.3 4.4-.8 5.8-.2 1.1.5 1.5.5 2.5 0 1.6-.7 4.2-1.3 6.3.8-4.4 2.4-3.7 8.2 1 9.5Z";
export const finderIcon = {
  face: "M10 1h28a9 9 0 0 1 9 9v28a9 9 0 0 1-9 9H10a9 9 0 0 1-9-9V10a9 9 0 0 1 9-9Z",
  light: "M27 1h11a9 9 0 0 1 9 9v28a9 9 0 0 1-9 9H25c-2-8-1-14 0-19h-7l9-27Z",
  smile: "M12 32c8 6 17 6 25-1M14 15v5M34 15v5",
};

function AppleMark() {
  return (
    <svg viewBox="0 0 20 24" width="14" height="17" aria-hidden="true">
      <path fill="currentColor" d={appleMarkPath} />
    </svg>
  );
}

const repoUrl = "https://github.com/rafatafon/3D-portfolio";

// A small laptop for the About panel: dark lid, blue screen, light base.
function LaptopIllustration() {
  return (
    <svg
      className="about-laptop"
      viewBox="0 0 120 76"
      width="120"
      height="76"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="about-screen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6cb2f3" />
          <stop offset="1" stopColor="#3f88dc" />
        </linearGradient>
        <linearGradient id="about-base" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e4e5e9" />
          <stop offset="1" stopColor="#9c9ea5" />
        </linearGradient>
      </defs>
      <rect x="15" y="3" width="90" height="62" rx="4" fill="#161618" />
      <rect
        x="18"
        y="6"
        width="84"
        height="56"
        rx="1.5"
        fill="url(#about-screen)"
      />
      <rect x="55" y="6" width="10" height="2.4" rx="1" fill="#161618" />
      <path
        d="M3 65h114v2.6c0 1.9-1.6 3.4-3.5 3.4H6.5C4.6 71 3 69.5 3 67.6Z"
        fill="url(#about-base)"
      />
      <path
        d="M52 65h16c0 1.3-1 2-2.2 2h-11.6c-1.2 0-2.2-.7-2.2-2Z"
        fill="#8d8f96"
      />
      <rect x="3" y="65" width="114" height="0.8" fill="#f7f7f9" />
    </svg>
  );
}

// Icon colours live in CSS (`--ic-*` custom properties) so the Dark
// appearance can ease them; see "Dark icon style" in globals.css.
function DockIcon({ id }: { id: WindowId }) {
  if (id === "finder")
    return (
      <span className="app-icon finder-app" aria-hidden="true">
        <svg viewBox="0 0 48 48">
          <path className="finder-face" d={finderIcon.face} />
          <path className="finder-light" d={finderIcon.light} />
          <path
            className="finder-smile"
            d={finderIcon.smile}
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </span>
    );
  if (id === "projects")
    return (
      <span className="app-icon projects-app" aria-hidden="true">
        <LayoutGrid size={28} strokeWidth={1.6} />
      </span>
    );
  if (id === "contact")
    return (
      <span className="app-icon mail-app" aria-hidden="true">
        <Mail size={32} strokeWidth={1.4} />
      </span>
    );
  if (id === "writing")
    return (
      <span className="app-icon notes-app" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
    );
  if (id === "experience")
    return (
      <span className="app-icon files-app" aria-hidden="true">
        <Folder size={33} strokeWidth={0.8} />
      </span>
    );
  return (
    <span className="app-icon textedit-app" aria-hidden="true">
      <i />
      <i />
      <i />
      <b>✎</b>
    </span>
  );
}

// toLocaleTimeString keeps the date fields it is given, so the menubar
// reads "Thu, Oct 22, 3:45 PM" / "jue, 22 oct, 3:45 p. m.".
export function formatLocalTime(locale: Locale, date = false) {
  return new Date().toLocaleTimeString(locale === "es" ? "es-HN" : "en-US", {
    timeZone: "America/Tegucigalpa",
    ...(date
      ? ({ weekday: "short", month: "short", day: "numeric" } as const)
      : {}),
    hour: "numeric",
    minute: "2-digit",
  });
}

export function LocalTime({ date = false }: { date?: boolean }) {
  const { locale } = useLocale();
  const [time, setTime] = useState("");
  useEffect(() => {
    const tick = () => setTime(formatLocalTime(locale, date));
    tick();
    const interval = setInterval(tick, 30000);
    return () => clearInterval(interval);
  }, [date, locale]);
  return <span>{time || "Honduras"}</span>;
}

type OpenWindow = {
  id: WindowId;
  minimized: boolean;
  maximized: boolean;
  x: number;
  y: number;
  order: number;
};
// Desktop files: the five folders plus the résumé link.
type FileId = FolderId | "resume";
type Offset = { x: number; y: number };
// Offset ranges for one drag, in the same (viewport) space as the pointer.
type Bounds = { minX: number; maxX: number; minY: number; maxY: number };
type DragTarget =
  | { kind: "window"; id: WindowId }
  | { kind: "about" }
  | { kind: "file"; id: FileId };
// A press on a desktop file becomes a drag only past this distance, so a tap
// or click still opens it.
const FILE_DRAG_SLOP = 6;

// Offset ranges that keep an element (currently at `offset`) inside `area`.
// The current offset always stays inside the range, so a drag never jumps.
function boundsWithin(
  element: HTMLElement,
  offset: Offset,
  area: { left: number; top: number; right: number; bottom: number },
): Bounds {
  const rect = element.getBoundingClientRect();
  const baseLeft = rect.left - offset.x;
  const baseTop = rect.top - offset.y;
  const minX = Math.min(offset.x, area.left - baseLeft);
  const minY = Math.min(offset.y, area.top - baseTop);
  return {
    minX,
    maxX: Math.max(minX, offset.x, area.right - rect.width - baseLeft),
    minY,
    maxY: Math.max(minY, offset.y, area.bottom - rect.height - baseTop),
  };
}

// Pull an element (currently at `offset`) back inside `area` after the
// layout changed under it, for example when the viewport narrows or a tablet
// rotates. Unlike boundsWithin, the current offset gets no say here.
function clampedOffset(
  element: HTMLElement,
  offset: Offset,
  area: { left: number; top: number; right: number; bottom: number },
): Offset {
  const rect = element.getBoundingClientRect();
  const baseLeft = rect.left - offset.x;
  const baseTop = rect.top - offset.y;
  const minX = area.left - baseLeft;
  const minY = area.top - baseTop;
  const maxX = Math.max(minX, area.right - rect.width - baseLeft);
  const maxY = Math.max(minY, area.bottom - rect.height - baseTop);
  return {
    x: Math.min(Math.max(offset.x, minX), maxX),
    y: Math.min(Math.max(offset.y, minY), maxY),
  };
}

// Matches the phone media query in globals.css.
const PHONE_QUERY = "(max-width: 720px)";
const isPhone = () => window.matchMedia(PHONE_QUERY).matches;
const navIcons = {
  about: FileText,
  projects: Folder,
  experience: BriefcaseBusiness,
  writing: FileText,
  contact: Mail,
};

export default function Desktop({
  initialFolder,
  onExit,
  daylight,
  leaving = false,
}: {
  initialFolder: FolderId;
  onExit: () => void;
  daylight: boolean;
  // Still mounted while the workspace fades it out; keep it out of reach.
  leaving?: boolean;
}) {
  const { t } = useLocale();
  const windowName = (id: WindowId) =>
    id === "finder"
      ? t(strings.finder)
      : t(folders.find((f) => f.id === id)!.name);
  const [windows, setWindows] = useState<OpenWindow[]>([
    {
      id: initialFolder,
      minimized: false,
      maximized: false,
      x: 0,
      y: 0,
      order: 1,
    },
  ]);
  const [query, setQuery] = useState("");
  const [dark, setDark] = useState(!daylight);
  const [controlCenter, setControlCenter] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const order = useRef(1);
  const appleRef = useRef<HTMLButtonElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
  const desktopRef = useRef<HTMLElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  // One drag mechanism for windows, the About panel, and desktop files.
  const drag = useRef<{
    target: DragTarget;
    startX: number;
    startY: number;
    x: number;
    y: number;
    // Every drag clamps against the measured layout (offset ranges).
    bounds: Bounds;
    // Files only count as dragged once past FILE_DRAG_SLOP.
    moved: boolean;
  } | null>(null);
  // "about" or "file-<id>" while that element is being dragged.
  const [dragging, setDragging] = useState<string | null>(null);
  const [aboutOffset, setAboutOffset] = useState<Offset>({ x: 0, y: 0 });
  // Files the visitor moved, as offsets from their default slot.
  const [fileOffsets, setFileOffsets] = useState<
    Partial<Record<FileId, Offset>>
  >({});
  // Set when a file drag ends, so the click that follows does not open it.
  const suppressClick = useRef(false);
  const active = [...windows]
    .filter((w) => !w.minimized)
    .sort((a, b) => b.order - a.order)[0]?.id;

  useEffect(() => {
    if (searchOpen) return;
    const target = active
      ? desktopRef.current?.querySelector<HTMLElement>(
          `[data-window="${active}"]`,
        )
      : desktopRef.current?.querySelector<HTMLElement>(".desktop-file");
    target?.focus({ preventScroll: true });
  }, [active, searchOpen]);

  const openFolder = useCallback((id: WindowId) => {
    const nextOrder = ++order.current;
    setWindows((previous) => {
      if (previous.some((w) => w.id === id))
        return previous.map((w) =>
          w.id === id ? { ...w, minimized: false, order: nextOrder } : w,
        );
      // Phones cascade mostly downward: the window is ~91% of the width, so
      // 4px steps keep the whole stack inside the 8px margins while 18px
      // shows each title.
      const step = previous.length % 5;
      const phone = isPhone();
      return [
        ...previous,
        {
          id,
          minimized: false,
          maximized: false,
          x: step * (phone ? 4 : 24),
          y: step * (phone ? 18 : 24),
          order: nextOrder,
        },
      ];
    });
    setSearchOpen(false);
    setQuery("");
  }, []);

  // Closing from the keyboard or the panel's own controls hands focus back to
  // the Apple mark; an outside click leaves focus where the pointer put it.
  const closeAbout = useCallback((restoreFocus = true) => {
    setAboutOpen(false);
    if (restoreFocus) appleRef.current?.focus({ preventScroll: true });
  }, []);
  function toggleAbout() {
    if (aboutOpen) {
      closeAbout();
      return;
    }
    setControlCenter(false);
    setSearchOpen(false);
    // Reopening always starts centred.
    setAboutOffset({ x: 0, y: 0 });
    setAboutOpen(true);
  }
  useEffect(() => {
    if (!aboutOpen) return;
    aboutRef.current?.focus({ preventScroll: true });
    const handlePointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        aboutRef.current?.contains(target) ||
        appleRef.current?.contains(target)
      )
        return;
      closeAbout(false);
    };
    document.addEventListener("pointerdown", handlePointer);
    return () => document.removeEventListener("pointerdown", handlePointer);
  }, [aboutOpen, closeAbout]);

  function closeWindow(id: WindowId) {
    setWindows((previous) => previous.filter((w) => w.id !== id));
  }
  function focusWindow(id: WindowId) {
    const nextOrder = ++order.current;
    setWindows((previous) =>
      previous.map((w) => (w.id === id ? { ...w, order: nextOrder } : w)),
    );
  }
  function toggleMaximize(id: WindowId) {
    setWindows((previous) =>
      previous.map((w) =>
        w.id === id ? { ...w, maximized: !w.maximized } : w,
      ),
    );
  }

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setAboutOpen(false);
        setSearchOpen((value) => !value);
      }
      if (event.key === "Escape") {
        if (aboutOpen) closeAbout();
        else if (controlCenter) setControlCenter(false);
        else if (searchOpen) setSearchOpen(false);
        else if (active)
          setWindows((previous) => previous.filter((w) => w.id !== active));
      }
      if (event.key === "Tab" && searchOpen && searchRef.current) {
        const targets = Array.from(
          searchRef.current.querySelectorAll<HTMLElement>(
            "input, button, a[href]",
          ),
        );
        const first = targets[0],
          last = targets[targets.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        }
        if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [active, searchOpen, controlCenter, aboutOpen, closeAbout]);

  function startDrag(event: React.PointerEvent<HTMLElement>, item: OpenWindow) {
    if (item.maximized || (event.target as HTMLElement).closest("button"))
      return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      target: { kind: "window", id: item.id },
      startX: event.clientX,
      startY: event.clientY,
      x: item.x,
      y: item.y,
      bounds: windowDragBounds(event.currentTarget, item),
      moved: true,
    };
    focusWindow(item.id);
  }
  // The free desktop in viewport space: under the menubar, above the Dock,
  // inside the side edges, inset by `margin`.
  function desktopArea(margin: number) {
    const desktop = desktopRef.current!;
    const box = desktop.getBoundingClientRect();
    const menubar = desktop.querySelector<HTMLElement>(".menubar");
    const dock = desktop
      .querySelector<HTMLElement>(".desktop-bottom .dock")
      ?.getBoundingClientRect();
    return {
      left: box.left + margin,
      top: (menubar?.getBoundingClientRect().bottom ?? box.top) + margin,
      right: box.right - margin,
      bottom:
        (dock && dock.height > 0
          ? Math.min(dock.top, box.bottom)
          : box.bottom) - margin,
    };
  }
  // Moved files, a dragged About panel, and dragged windows keep pixel
  // offsets from spots that move with the viewport: when the desktop resizes
  // (or the phone layout kicks in) pull them back inside, or something could
  // be left off-screen with nothing to grab. Subscribed once, with a
  // synchronous cleanup so the observer is gone before the desktop leaves
  // the DOM; the latest state is read through a ref.
  const latest = useRef({ fileOffsets, aboutOffset, windows });
  latest.current = { fileOffsets, aboutOffset, windows };
  const reclampRef = useRef<() => void>(() => {});
  useLayoutEffect(() => {
    const desktop = desktopRef.current;
    if (!desktop) return;
    const reclamp = () => {
      if (drag.current || !desktopRef.current) return;
      const { fileOffsets, aboutOffset, windows } = latest.current;
      const moved = Object.entries(fileOffsets) as [FileId, Offset][];
      if (moved.length) {
        const area = desktopArea(4);
        const next = { ...fileOffsets };
        let changed = false;
        for (const [id, offset] of moved) {
          const element = desktop.querySelector<HTMLElement>(
            `[data-file="${id}"]`,
          );
          if (!element) continue;
          const clamped = clampedOffset(element, offset, area);
          if (clamped.x !== offset.x || clamped.y !== offset.y) {
            next[id] = clamped;
            changed = true;
          }
        }
        if (changed) setFileOffsets(next);
      }
      if (aboutRef.current) {
        const clamped = clampedOffset(
          aboutRef.current,
          aboutOffset,
          desktopArea(8),
        );
        if (clamped.x !== aboutOffset.x || clamped.y !== aboutOffset.y)
          setAboutOffset(clamped);
      }
      let changed = false;
      const next = windows.map((item) => {
        if (item.minimized || item.maximized) return item;
        const toolbar = desktop.querySelector<HTMLElement>(
          `[data-window="${item.id}"] .window-toolbar`,
        );
        if (!toolbar) return item;
        const limits = windowDragBounds(toolbar, item);
        const x = Math.max(limits.minX, Math.min(limits.maxX, item.x));
        const y = Math.max(limits.minY, Math.min(limits.maxY, item.y));
        if (x === item.x && y === item.y) return item;
        changed = true;
        return { ...item, x, y };
      });
      if (changed) setWindows(next);
    };
    reclampRef.current = reclamp;
    const observer = new ResizeObserver(reclamp);
    observer.observe(desktop);
    window.addEventListener("resize", reclamp);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", reclamp);
    };
  }, []);
  // A window restored from the Dock may carry an offset from a wider layout:
  // clamp it as soon as it is back on screen.
  const visibleWindows = windows
    .filter((item) => !item.minimized && !item.maximized)
    .map((item) => item.id)
    .join(",");
  useEffect(() => {
    reclampRef.current();
  }, [visibleWindows]);
  // The About panel drags by its top (traffic lights, illustration, title),
  // never from the close button.
  function startAboutDrag(event: React.PointerEvent<HTMLElement>) {
    if (event.button !== 0 || (event.target as HTMLElement).closest("button"))
      return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      target: { kind: "about" },
      startX: event.clientX,
      startY: event.clientY,
      x: aboutOffset.x,
      y: aboutOffset.y,
      bounds: boundsWithin(aboutRef.current!, aboutOffset, desktopArea(8)),
      moved: true,
    };
    setDragging("about");
  }
  function startFileDrag(event: React.PointerEvent<HTMLElement>, id: FileId) {
    if (event.button !== 0) return;
    suppressClick.current = false;
    const offset = fileOffsets[id] ?? { x: 0, y: 0 };
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      target: { kind: "file", id },
      startX: event.clientX,
      startY: event.clientY,
      x: offset.x,
      y: offset.y,
      bounds: boundsWithin(event.currentTarget, offset, desktopArea(4)),
      moved: false,
    };
  }
  function endDrag() {
    const current = drag.current;
    drag.current = null;
    setDragging(null);
    if (current?.target.kind !== "file" || !current.moved) return;
    // A mouse click follows pointerup in the same task; a touch drag never
    // produces one. Either way the flag must not outlive this gesture.
    suppressClick.current = true;
    setTimeout(() => {
      suppressClick.current = false;
    }, 0);
  }
  // Drag limits for a window, measured from the live layout. Phones keep the
  // whole window inside an 8px margin; larger screens let it hang off either
  // side alike as long as 160px of it stays inside. The title bar stays 4px
  // under the menubar, and the window (phones) or its title bar (larger
  // screens) stays 8px above the Dock.
  function windowDragBounds(toolbar: HTMLElement, item: OpenWindow): Bounds {
    const phone = isPhone();
    const win = toolbar.closest<HTMLElement>(".finder-window")!;
    const rect = win.getBoundingClientRect();
    const area = desktopArea(0);
    const baseLeft = rect.left - item.x;
    const baseTop = rect.top - item.y;
    const side = phone ? 8 : 0;
    const keep = phone ? rect.width : Math.min(160, rect.width);
    const tail = phone ? rect.height : toolbar.getBoundingClientRect().height;
    const minX = area.left + side + keep - rect.width - baseLeft;
    const minY = area.top + 4 - baseTop;
    return {
      minX,
      maxX: Math.max(minX, area.right - side - keep - baseLeft),
      minY,
      maxY: Math.max(minY, area.bottom - 8 - tail - baseTop),
    };
  }
  function moveDrag(event: React.PointerEvent<HTMLElement>) {
    const current = drag.current;
    if (!current) return;
    const { target, startX, startY, x, y, bounds } = current;
    if (!current.moved) {
      if (
        Math.hypot(event.clientX - startX, event.clientY - startY) <
        FILE_DRAG_SLOP
      )
        return;
      current.moved = true;
      if (target.kind === "file") setDragging(`file-${target.id}`);
    }
    const { minX, maxX, minY, maxY } = bounds;
    const nextX = Math.max(minX, Math.min(maxX, x + event.clientX - startX));
    const nextY = Math.max(minY, Math.min(maxY, y + event.clientY - startY));
    if (target.kind === "about") setAboutOffset({ x: nextX, y: nextY });
    else if (target.kind === "file")
      setFileOffsets((previous) => ({
        ...previous,
        [target.id]: { x: nextX, y: nextY },
      }));
    else
      setWindows((previous) =>
        previous.map((w) =>
          w.id === target.id ? { ...w, x: nextX, y: nextY } : w,
        ),
      );
  }
  // Pointer handlers and placement shared by every desktop file.
  function fileProps(id: FileId) {
    const offset = fileOffsets[id];
    return {
      className: `desktop-file${id === "resume" ? " desktop-file-resume" : ""}${offset ? " desktop-file-moved" : ""}${dragging === `file-${id}` ? " dragging" : ""}`,
      style: offset
        ? ({
            "--file-x": `${offset.x}px`,
            "--file-y": `${offset.y}px`,
          } as React.CSSProperties)
        : undefined,
      "data-file": id,
      draggable: false,
      onDragStart: (event: React.DragEvent) => event.preventDefault(),
      onPointerDown: (event: React.PointerEvent<HTMLElement>) =>
        startFileDrag(event, id),
      onPointerMove: moveDrag,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
    };
  }

  return (
    <section
      ref={desktopRef}
      className={`desktop ${dark ? "desktop-dark" : "desktop-light"}`}
      aria-label={t(strings.desktop)}
      inert={leaving}
    >
      <div className="desktop-wallpaper" aria-hidden="true" />
      <nav className="menubar" aria-label={t(strings.menu)}>
        <div className="menu-left">
          <button
            ref={appleRef}
            className="desktop-brand"
            onClick={toggleAbout}
            aria-label={t(strings.aboutWorkspace)}
            aria-haspopup="dialog"
            aria-expanded={aboutOpen}
          >
            <AppleMark />
          </button>
          <button className="finder-menu" onClick={() => openFolder("finder")}>
            {t(strings.finder)}
          </button>
          <button onClick={() => openFolder("contact")}>
            {t(strings.contact)}
          </button>
        </div>
        <div className="menu-right">
          <button
            aria-label={t(strings.searchFiles)}
            onClick={() => {
              setAboutOpen(false);
              setSearchOpen((v) => !v);
            }}
          >
            <Search size={14} />
          </button>
          <span className="system-indicators" aria-hidden="true">
            <BatteryFull size={19} />
            <Wifi size={15} />
          </span>
          <button
            aria-label={t(strings.displaySettings)}
            aria-expanded={controlCenter}
            onClick={() => {
              setAboutOpen(false);
              setControlCenter((v) => !v);
            }}
          >
            <SlidersHorizontal size={15} />
          </button>
          <LocalTime date />
        </div>
      </nav>

      {aboutOpen && (
        <div className="about-layer">
          <div
            ref={aboutRef}
            className={`about-workspace${dragging === "about" ? " dragging" : ""}`}
            role="dialog"
            aria-labelledby="about-workspace-title"
            tabIndex={-1}
            style={
              {
                "--about-x": `${aboutOffset.x}px`,
                "--about-y": `${aboutOffset.y}px`,
              } as React.CSSProperties
            }
          >
            <div
              className="about-handle"
              onPointerDown={startAboutDrag}
              onPointerMove={moveDrag}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
            >
              <div className="about-lights">
                <button
                  className="close-light"
                  aria-label={t(strings.closeAbout)}
                  onClick={() => closeAbout()}
                >
                  <X size={8} strokeWidth={3} />
                </button>
                <span aria-hidden="true" />
                <span aria-hidden="true" />
              </div>
              <LaptopIllustration />
              <h2 id="about-workspace-title">{t(strings.workspace)}</h2>
              <p className="about-subtitle">{t(strings.aboutSubtitle)}</p>
            </div>
            <dl className="about-specs">
              {t(strings.aboutSpecs).map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
            <a
              className="about-more"
              href={repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t(strings.moreInfoLabel)}
            >
              {t(strings.moreInfo)}
            </a>
            <p className="about-fineprint">
              {t(strings.madeInHonduras)}
              <br />
              {t(strings.copyright)}
            </p>
          </div>
        </div>
      )}
      {controlCenter && (
        <div
          className="control-center"
          role="region"
          aria-label={t(strings.displaySettings)}
        >
          <strong>{t(strings.display)}</strong>
          <button onClick={() => setDark((v) => !v)} aria-pressed={dark}>
            {dark ? <Moon size={18} /> : <Sun size={18} />}
            <span>
              {t(strings.darkAppearance)}
              <small>{dark ? t(strings.on) : t(strings.off)}</small>
            </span>
          </button>
          <div className="control-center-row">
            <Languages size={18} aria-hidden="true" />
            <span>{t(strings.language)}</span>
            <LanguageToggle className="language-toggle-panel" />
          </div>
          <button onClick={() => setControlCenter(false)}>
            {t(strings.done)}
          </button>
        </div>
      )}
      <div
        className="desktop-files"
        aria-label={t(strings.portfolioFiles)}
        onClickCapture={(event) => {
          // A completed drag neither opens the folder nor follows the link.
          if (!suppressClick.current) return;
          suppressClick.current = false;
          event.preventDefault();
          event.stopPropagation();
        }}
      >
        {folders.map((folder) => (
          <button
            key={folder.id}
            {...fileProps(folder.id)}
            onClick={() => openFolder(folder.id)}
            aria-label={t(strings.open)(t(folder.name))}
          >
            <FileIcon kind={folder.kind} />
            <span>{t(folder.file)}</span>
          </button>
        ))}
        <a
          {...fileProps("resume")}
          href={profile.cv}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t(strings.openResume)}
        >
          <FileIcon kind="resume" />
          <span>
            {t(strings.resumeFile)} <ArrowUpRight size={10} />
          </span>
        </a>
      </div>

      <div className="windows-layer">
        {windows
          .filter((item) => !item.minimized)
          .map((item) => (
            <section
              key={item.id}
              data-window={item.id}
              tabIndex={-1}
              role="dialog"
              aria-label={t(strings.window)(windowName(item.id))}
              className={`finder-window ${active === item.id ? "window-active" : ""} ${item.maximized ? "window-maximized" : ""}`}
              style={
                {
                  "--window-x": `${item.x}px`,
                  "--window-y": `${item.y}px`,
                  zIndex: item.order,
                } as React.CSSProperties
              }
              onPointerDown={() => {
                if (active !== item.id) focusWindow(item.id);
              }}
            >
              <header
                className="window-toolbar"
                onPointerDown={(event) => startDrag(event, item)}
                onPointerMove={moveDrag}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                onDoubleClick={(event) => {
                  if (!(event.target as HTMLElement).closest("button"))
                    toggleMaximize(item.id);
                }}
              >
                <div className="traffic-lights">
                  <button
                    className="close-light"
                    aria-label={t(strings.closeWindow)(windowName(item.id))}
                    onClick={() => closeWindow(item.id)}
                  >
                    <X size={9} />
                  </button>
                  <button
                    className="minimize-light"
                    aria-label={t(strings.minimizeWindow)(windowName(item.id))}
                    onClick={() =>
                      setWindows((previous) =>
                        previous.map((w) =>
                          w.id === item.id ? { ...w, minimized: true } : w,
                        ),
                      )
                    }
                  >
                    <Minus size={9} />
                  </button>
                  <button
                    className="maximize-light"
                    aria-label={t(strings.maximizeWindow)(windowName(item.id))}
                    onClick={() => toggleMaximize(item.id)}
                  >
                    <Maximize2 size={8} />
                  </button>
                </div>
                <span className="window-title">{windowName(item.id)}</span>
                <div className="toolbar-tools">
                  <span aria-hidden="true">
                    <PanelLeft size={16} />
                    <ChevronLeft size={18} />
                    <ChevronRight size={18} />
                    <LayoutGrid size={16} />
                  </span>
                  <button
                    onClick={() => setSearchOpen(true)}
                    aria-label={t(strings.searchInFinder)}
                  >
                    <Search size={16} />
                  </button>
                </div>
              </header>
              <div className="window-body">
                <aside className="finder-sidebar">
                  <p>{t(strings.favorites)}</p>
                  <button
                    className={item.id === "finder" ? "sidebar-selected" : ""}
                    onClick={() => openFolder("finder")}
                  >
                    <LayoutGrid size={15} />
                    {t(strings.allFiles)}
                  </button>
                  {folders.map((folder) => {
                    const Icon = navIcons[folder.id];
                    return (
                      <button
                        key={folder.id}
                        className={
                          folder.id === item.id ? "sidebar-selected" : ""
                        }
                        onClick={() => openFolder(folder.id)}
                      >
                        <Icon size={15} />
                        {t(folder.name)}
                      </button>
                    );
                  })}
                  <p className="sidebar-location-label">
                    {t(strings.location)}
                  </p>
                  <button onClick={onExit}>
                    <House size={15} /> {t(strings.studio)}
                  </button>
                  <a
                    href={profile.cv}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download size={15} /> {t(strings.resume)}
                  </a>
                  <div className="sidebar-footer">
                    <i /> {t(strings.workspace)}
                  </div>
                </aside>
                <div className="window-content" tabIndex={0}>
                  {item.id === "finder" ? (
                    <div
                      className="finder-grid"
                      role="list"
                      aria-label={t(strings.portfolioFiles)}
                    >
                      {folders.map((folder) => (
                        <button
                          key={folder.id}
                          role="listitem"
                          className="finder-item"
                          onClick={() => openFolder(folder.id)}
                          aria-label={t(strings.open)(t(folder.name))}
                        >
                          <FileIcon kind={folder.kind} />
                          <span>{t(folder.file)}</span>
                        </button>
                      ))}
                      <a
                        role="listitem"
                        className="finder-item"
                        href={profile.cv}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={t(strings.openResume)}
                      >
                        <FileIcon kind="resume" />
                        <span>
                          {t(strings.resumeFile)} <ArrowUpRight size={10} />
                        </span>
                      </a>
                    </div>
                  ) : (
                    <PortfolioContent folder={item.id} />
                  )}
                </div>
              </div>
              <footer className="window-status">
                <Folder size={11} />
                <span>{profile.name}</span>
                <ChevronRight size={10} />
                <span>{windowName(item.id)}</span>
                <span className="window-status-end">
                  {t(strings.madeWithCare)}
                </span>
              </footer>
            </section>
          ))}
      </div>

      {searchOpen && (
        <div
          className="spotlight-backdrop"
          onClick={() => setSearchOpen(false)}
        >
          <div
            ref={searchRef}
            className="spotlight"
            role="dialog"
            aria-label={t(strings.findFile)}
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <div>
              <Search size={22} />
              <input
                autoFocus
                placeholder={t(strings.searchPlaceholder)}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-label={t(strings.searchFolders)}
              />
              <button
                onClick={() => setSearchOpen(false)}
                aria-label={t(strings.closeSearch)}
              >
                <X size={18} />
              </button>
            </div>
            <ul>
              {folders
                .filter((folder) =>
                  `${t(folder.name)} ${t(folder.file)}`
                    .toLowerCase()
                    .includes(query.toLowerCase()),
                )
                .map((folder) => (
                  <li key={folder.id}>
                    <button onClick={() => openFolder(folder.id)}>
                      <FileIcon kind={folder.kind} small />
                      <span>{t(folder.name)}</span>
                      <ChevronRight size={16} />
                    </button>
                  </li>
                ))}
            </ul>
            {!folders.some((folder) =>
              `${t(folder.name)} ${t(folder.file)}`
                .toLowerCase()
                .includes(query.toLowerCase()),
            ) && <p className="search-empty">{t(strings.noResults)}</p>}
          </div>
        </div>
      )}

      <div className="desktop-bottom">
        <nav className="dock" aria-label={t(strings.dock)}>
          <button
            className="dock-item dock-studio"
            onClick={onExit}
            aria-label={t(strings.studio)}
          >
            <span className="app-icon studio-app" aria-hidden="true">
              <House size={26} strokeWidth={1.7} />
            </span>
            <span className="dock-tooltip">{t(strings.studio)}</span>
          </button>
          <span className="dock-divider" />
          <button
            className={`dock-item ${windows.some((w) => w.id === "finder") ? "dock-open" : ""}`}
            onClick={() => openFolder("finder")}
            aria-label={t(strings.open)(t(strings.finder))}
          >
            <DockIcon id="finder" />
            <span className="dock-tooltip">{t(strings.finder)}</span>
            <i />
          </button>
          {folders.map((folder) => (
            <button
              key={folder.id}
              className={`dock-item ${windows.some((w) => w.id === folder.id) ? "dock-open" : ""}`}
              onClick={() => openFolder(folder.id)}
              aria-label={t(strings.open)(t(folder.name))}
            >
              <DockIcon id={folder.id} />
              <span className="dock-tooltip">{t(folder.name)}</span>
              <i />
            </button>
          ))}
          <span className="dock-divider" />
          <a
            className="dock-item dock-resume"
            href={profile.cv}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t(strings.openResume)}
          >
            <FileIcon kind="resume" small />
            <span className="dock-tooltip">{t(strings.resume)}</span>
          </a>
        </nav>
      </div>
    </section>
  );
}
