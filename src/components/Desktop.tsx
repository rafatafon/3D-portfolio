"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import { useLocale, type Localized } from "@/lib/i18n";
import LanguageToggle from "./LanguageToggle";
import PortfolioContent from "./PortfolioContent";

// Desktop chrome copy. Folder names come from `folders` in content.ts.
const strings = {
  desktop: {
    en: "Interactive portfolio desktop",
    es: "Escritorio interactivo del portafolio",
  },
  menu: { en: "Desktop menu", es: "Menú del escritorio" },
  aboutFredy: { en: "About Fredy", es: "Sobre Fredy" },
  finder: { en: "Finder", es: "Finder" },
  file: { en: "File", es: "Archivo" },
  go: { en: "Go", es: "Ir" },
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

function AppleMark() {
  return (
    <svg viewBox="0 0 20 24" width="14" height="17" aria-hidden="true">
      <path
        fill="currentColor"
        d="M14.5.6c.2 2-1.5 4.1-3.6 4.2-.4-1.9 1.6-4 3.6-4.2ZM18.9 17.4c-.5 1.3-.8 1.9-1.5 3-1 1.5-2.4 3.3-4.1 3.3-1.5 0-1.9-1-4-1s-2.5 1-4 1c-1.7 0-3-1.6-4-3.2C-1.4 16 .1 9.2 3.3 7.3c2.2-1.3 4.4-.8 5.8-.2 1.1.5 1.5.5 2.5 0 1.6-.7 4.2-1.3 6.3.8-4.4 2.4-3.7 8.2 1 9.5Z"
      />
    </svg>
  );
}

function DockIcon({ id }: { id: WindowId }) {
  if (id === "finder")
    return (
      <span className="app-icon finder-app" aria-hidden="true">
        <svg viewBox="0 0 48 48">
          <path
            fill="#6dcaff"
            d="M10 1h28a9 9 0 0 1 9 9v28a9 9 0 0 1-9 9H10a9 9 0 0 1-9-9V10a9 9 0 0 1 9-9Z"
          />
          <path
            fill="#d5efff"
            d="M27 1h11a9 9 0 0 1 9 9v28a9 9 0 0 1-9 9H25c-2-8-1-14 0-19h-7l9-27Z"
          />
          <path
            d="M12 32c8 6 17 6 25-1M14 15v5M34 15v5"
            fill="none"
            stroke="#17395c"
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
        <Folder size={33} fill="#95d2ff" strokeWidth={0.8} />
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

export function LocalTime({ date = false }: { date?: boolean }) {
  const { locale } = useLocale();
  const [time, setTime] = useState("");
  useEffect(() => {
    const tag = locale === "es" ? "es-HN" : "en-US";
    // toLocaleTimeString keeps the date fields it is given, so the menubar
    // reads "Thu, Oct 22, 3:45 PM" / "jue, 22 oct, 3:45 p. m.".
    const tick = () =>
      setTime(
        new Date().toLocaleTimeString(tag, {
          timeZone: "America/Tegucigalpa",
          ...(date
            ? ({ weekday: "short", month: "short", day: "numeric" } as const)
            : {}),
          hour: "numeric",
          minute: "2-digit",
        }),
      );
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
  const order = useRef(1);
  const desktopRef = useRef<HTMLElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    id: WindowId;
    startX: number;
    startY: number;
    x: number;
    y: number;
    // Phones clamp against the measured layout (offset ranges for x and y).
    bounds?: { minX: number; maxX: number; minY: number; maxY: number };
  } | null>(null);
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
        setSearchOpen((value) => !value);
      }
      if (event.key === "Escape") {
        if (controlCenter) setControlCenter(false);
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
  }, [active, searchOpen, controlCenter]);

  function startDrag(event: React.PointerEvent<HTMLElement>, item: OpenWindow) {
    if (item.maximized || (event.target as HTMLElement).closest("button"))
      return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      id: item.id,
      startX: event.clientX,
      startY: event.clientY,
      x: item.x,
      y: item.y,
      bounds: isPhone()
        ? phoneDragBounds(event.currentTarget, item)
        : undefined,
    };
    focusWindow(item.id);
  }
  // Phones keep the whole window in view: an 8px margin on both sides, the
  // title bar under the menubar, and the bottom edge 8px above the Dock.
  // Measured once per drag, in the same (viewport) space.
  function phoneDragBounds(toolbar: HTMLElement, item: OpenWindow) {
    const win = toolbar.closest<HTMLElement>(".finder-window")!;
    const layer = win.parentElement!.getBoundingClientRect();
    const rect = win.getBoundingClientRect();
    const baseLeft = rect.left - item.x;
    const baseTop = rect.top - item.y;
    const dock = desktopRef.current?.querySelector<HTMLElement>(
      ".desktop-bottom .dock",
    );
    const floor = Math.min(
      dock?.getBoundingClientRect().top ?? layer.bottom,
      layer.bottom,
    );
    const margin = 8;
    const minX = layer.left + margin - baseLeft;
    const minY = layer.top + 4 - baseTop;
    return {
      minX,
      maxX: Math.max(minX, layer.right - margin - rect.width - baseLeft),
      minY,
      maxY: Math.max(minY, floor - margin - rect.height - baseTop),
    };
  }
  function moveDrag(event: React.PointerEvent<HTMLElement>) {
    if (!drag.current) return;
    const { id, startX, startY, x, y, bounds } = drag.current;
    const {
      minX = -window.innerWidth * 0.13,
      maxX = window.innerWidth * 0.4,
      minY = -window.innerHeight * 0.09,
      maxY = window.innerHeight * 0.56,
    } = bounds ?? {};
    const nextX = Math.max(minX, Math.min(maxX, x + event.clientX - startX));
    const nextY = Math.max(minY, Math.min(maxY, y + event.clientY - startY));
    setWindows((previous) =>
      previous.map((w) => (w.id === id ? { ...w, x: nextX, y: nextY } : w)),
    );
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
            className="desktop-brand"
            onClick={() => openFolder("about")}
            aria-label={t(strings.aboutFredy)}
          >
            <AppleMark />
          </button>
          <button className="finder-menu" onClick={() => openFolder("finder")}>
            {t(strings.finder)}
          </button>
          <button onClick={() => openFolder("projects")}>
            {t(strings.file)}
          </button>
          <button onClick={() => openFolder("writing")}>{t(strings.go)}</button>
          <button onClick={() => openFolder("contact")}>
            {t(strings.contact)}
          </button>
        </div>
        <div className="menu-right">
          <button
            aria-label={t(strings.searchFiles)}
            onClick={() => setSearchOpen((v) => !v)}
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
            onClick={() => setControlCenter((v) => !v)}
          >
            <SlidersHorizontal size={15} />
          </button>
          <LocalTime date />
        </div>
      </nav>

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
      <div className="desktop-files" aria-label={t(strings.portfolioFiles)}>
        {folders.map((folder) => (
          <button
            className="desktop-file"
            key={folder.id}
            onClick={() => openFolder(folder.id)}
            aria-label={t(strings.open)(t(folder.name))}
          >
            <FileIcon kind={folder.kind} />
            <span>{t(folder.file)}</span>
          </button>
        ))}
        <a
          className="desktop-file desktop-file-resume"
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
                onPointerUp={() => {
                  drag.current = null;
                }}
                onPointerCancel={() => {
                  drag.current = null;
                }}
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
                <span>Fredy Maldonado</span>
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
