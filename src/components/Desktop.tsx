"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
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
} from "lucide-react";
import { folders, profile, type FolderId } from "@/lib/content";
import PortfolioContent from "./PortfolioContent";

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

function DockIcon({ id }: { id: FolderId }) {
  if (id === "projects")
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
  const [time, setTime] = useState("");
  useEffect(() => {
    const tick = () =>
      setTime(
        new Intl.DateTimeFormat("en-US", {
          timeZone: "America/Tegucigalpa",
          ...(date
            ? ({ weekday: "short", month: "short", day: "numeric" } as const)
            : {}),
          hour: "numeric",
          minute: "2-digit",
        }).format(new Date()),
      );
    tick();
    const interval = setInterval(tick, 30000);
    return () => clearInterval(interval);
  }, [date]);
  return <span>{time || "Honduras"}</span>;
}

type OpenWindow = {
  id: FolderId;
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
    id: FolderId;
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

  const openFolder = useCallback((id: FolderId) => {
    const nextOrder = ++order.current;
    setWindows((previous) => {
      if (previous.some((w) => w.id === id))
        return previous.map((w) =>
          w.id === id ? { ...w, minimized: false, order: nextOrder } : w,
        );
      // Phones cascade mostly downward: the window is ~91% of the width, so
      // 5px steps keep the whole stack on screen while 18px shows each title.
      const step = previous.length % 5;
      const phone = isPhone();
      return [
        ...previous,
        {
          id,
          minimized: false,
          maximized: false,
          x: step * (phone ? 5 : 24),
          y: step * (phone ? 18 : 24),
          order: nextOrder,
        },
      ];
    });
    setSearchOpen(false);
    setQuery("");
  }, []);

  function closeWindow(id: FolderId) {
    setWindows((previous) => previous.filter((w) => w.id !== id));
  }
  function focusWindow(id: FolderId) {
    const nextOrder = ++order.current;
    setWindows((previous) =>
      previous.map((w) => (w.id === id ? { ...w, order: nextOrder } : w)),
    );
  }
  function toggleMaximize(id: FolderId) {
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
  // On phones the window may overhang a quarter of its width to the right (to
  // the left only until the traffic lights would leave the screen); the title
  // bar stays under the menubar and the bottom edge above the Dock and "Back to
  // studio". Measured once per drag, in the same (viewport) space.
  function phoneDragBounds(toolbar: HTMLElement, item: OpenWindow) {
    const win = toolbar.closest<HTMLElement>(".finder-window")!;
    const layer = win.parentElement!.getBoundingClientRect();
    const rect = win.getBoundingClientRect();
    const baseLeft = rect.left - item.x;
    const baseTop = rect.top - item.y;
    const floor = Math.min(
      ...Array.from(
        desktopRef.current?.querySelectorAll<HTMLElement>(
          ".desktop-bottom .dock, .return-studio",
        ) ?? [],
        (el) => el.getBoundingClientRect().top,
      ),
      layer.bottom,
    );
    const overhang = rect.width * 0.25;
    const lights = toolbar.querySelector(".traffic-lights");
    const leftOverhang = lights
      ? Math.min(overhang, lights.getBoundingClientRect().left - rect.left - 4)
      : overhang;
    const minY = layer.top + 4 - baseTop;
    return {
      minX: layer.left - leftOverhang - baseLeft,
      maxX: layer.right - rect.width + overhang - baseLeft,
      minY,
      maxY: Math.max(minY, floor - 8 - rect.height - baseTop),
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
      aria-label="Interactive portfolio desktop"
      inert={leaving}
    >
      <div className="desktop-wallpaper" aria-hidden="true" />
      <nav className="menubar" aria-label="Desktop menu">
        <div className="menu-left">
          <button
            className="desktop-brand"
            onClick={() => openFolder("about")}
            aria-label="About Fredy"
          >
            <AppleMark />
          </button>
          <button
            className="finder-menu"
            onClick={() => openFolder("projects")}
          >
            Finder
          </button>
          <button onClick={() => openFolder("projects")}>File</button>
          <button onClick={() => openFolder("writing")}>Go</button>
          <button onClick={() => openFolder("contact")}>Contact</button>
        </div>
        <div className="menu-right">
          <button
            aria-label="Search portfolio files"
            onClick={() => setSearchOpen((v) => !v)}
          >
            <Search size={14} />
          </button>
          <span className="system-indicators" aria-hidden="true">
            <BatteryFull size={19} />
            <Wifi size={15} />
          </span>
          <button
            aria-label="Display settings"
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
          aria-label="Display settings"
        >
          <strong>Display</strong>
          <button onClick={() => setDark((v) => !v)} aria-pressed={dark}>
            {dark ? <Moon size={18} /> : <Sun size={18} />}
            <span>
              Dark appearance<small>{dark ? "On" : "Off"}</small>
            </span>
          </button>
          <button onClick={() => setControlCenter(false)}>Done</button>
        </div>
      )}
      <div className="desktop-files" aria-label="Portfolio files">
        {folders.map((folder) => (
          <button
            className="desktop-file"
            key={folder.id}
            onClick={() => openFolder(folder.id)}
            aria-label={`Open ${folder.name}`}
          >
            <FileIcon kind={folder.kind} />
            <span>{folder.file}</span>
          </button>
        ))}
        <a
          className="desktop-file"
          href={profile.cv}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open résumé PDF in a new tab"
        >
          <FileIcon kind="resume" />
          <span>
            Résumé.pdf <ArrowUpRight size={10} />
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
              aria-label={`${folders.find((f) => f.id === item.id)!.name} window`}
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
                    aria-label={`Close ${folders.find((f) => f.id === item.id)!.name} window`}
                    onClick={() => closeWindow(item.id)}
                  >
                    <X size={9} />
                  </button>
                  <button
                    className="minimize-light"
                    aria-label={`Minimize ${folders.find((f) => f.id === item.id)!.name} window`}
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
                    aria-label={`Maximize ${folders.find((f) => f.id === item.id)!.name} window`}
                    onClick={() => toggleMaximize(item.id)}
                  >
                    <Maximize2 size={8} />
                  </button>
                </div>
                <span className="window-title">
                  {folders.find((f) => f.id === item.id)!.name}
                </span>
                <div className="toolbar-tools">
                  <span aria-hidden="true">
                    <PanelLeft size={16} />
                    <ChevronLeft size={18} />
                    <ChevronRight size={18} />
                    <LayoutGrid size={16} />
                  </span>
                  <button
                    onClick={() => setSearchOpen(true)}
                    aria-label="Search in Finder"
                  >
                    <Search size={16} />
                  </button>
                </div>
              </header>
              <div className="window-body">
                <aside className="finder-sidebar">
                  <p>Favorites</p>
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
                        {folder.name}
                      </button>
                    );
                  })}
                  <p className="sidebar-location-label">Location</p>
                  <button onClick={onExit}>
                    <House size={15} /> The studio
                  </button>
                  <a
                    href={profile.cv}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download size={15} /> Résumé
                  </a>
                  <div className="sidebar-footer">
                    <i /> Fredy's workspace
                  </div>
                </aside>
                <div className="window-content" tabIndex={0}>
                  <PortfolioContent folder={item.id} />
                </div>
              </div>
              <footer className="window-status">
                <Folder size={11} />
                <span>Fredy Maldonado</span>
                <ChevronRight size={10} />
                <span>{folders.find((f) => f.id === item.id)!.name}</span>
                <span className="window-status-end">Made with care</span>
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
            aria-label="Find a portfolio file"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <div>
              <Search size={22} />
              <input
                autoFocus
                placeholder="Find something in my workspace…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-label="Search folders"
              />
              <button
                onClick={() => setSearchOpen(false)}
                aria-label="Close search"
              >
                <X size={18} />
              </button>
            </div>
            <ul>
              {folders
                .filter((folder) =>
                  `${folder.name} ${folder.file}`
                    .toLowerCase()
                    .includes(query.toLowerCase()),
                )
                .map((folder) => (
                  <li key={folder.id}>
                    <button onClick={() => openFolder(folder.id)}>
                      <FileIcon kind={folder.kind} small />
                      <span>{folder.name}</span>
                      <ChevronRight size={16} />
                    </button>
                  </li>
                ))}
            </ul>
            {!folders.some((folder) =>
              `${folder.name} ${folder.file}`
                .toLowerCase()
                .includes(query.toLowerCase()),
            ) && (
              <p className="search-empty">
                No files found. Try “projects” or “about”.
              </p>
            )}
          </div>
        </div>
      )}

      <div className="desktop-bottom">
        <button className="return-studio" onClick={onExit}>
          <ArrowLeft size={14} /> Back to studio
        </button>
        <nav className="dock" aria-label="Application dock">
          {folders.map((folder) => (
            <button
              key={folder.id}
              className={`dock-item ${windows.some((w) => w.id === folder.id) ? "dock-open" : ""}`}
              onClick={() => openFolder(folder.id)}
              aria-label={`Open ${folder.name}`}
            >
              <DockIcon id={folder.id} />
              <span className="dock-tooltip">{folder.name}</span>
              <i />
            </button>
          ))}
          <span className="dock-divider" />
          <a
            className="dock-item dock-resume"
            href={profile.cv}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open résumé PDF"
          >
            <FileIcon kind="resume" small />
            <span className="dock-tooltip">Résumé</span>
          </a>
        </nav>
      </div>
    </section>
  );
}
