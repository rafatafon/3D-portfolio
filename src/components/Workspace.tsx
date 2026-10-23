"use client";

import dynamic from "next/dynamic";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import {
  ArrowRight,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sun,
  Moon,
  Sunset,
  MousePointer2,
  Monitor,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";
import Desktop, { LocalTime } from "./Desktop";
import type { SceneMode } from "./StudioScene";
import type { FolderId } from "@/lib/content";
import { getAmbience } from "@/lib/ambience";
import {
  DEFAULT_PRESETS,
  DESK_MAX,
  DESK_MIN,
  DESK_SIT,
  clampHeight,
} from "@/lib/desk";
import SevenSegment from "./SevenSegment";
import { ENTER_MS, LEAVE_MS } from "@/lib/transitions";

const StudioScene = dynamic(() => import("./StudioScene"), { ssr: false });
const INTRO_KEY = "fm-workspace-intro-v2";
const PRESET_KEY = "fm-desk-presets-v1";
type Presets = [number, number, number];

function rememberIntro() {
  try {
    sessionStorage.setItem(INTRO_KEY, "seen");
  } catch {
    /* The experience also works with storage disabled. */
  }
}

function loadPresets(): Presets {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(PRESET_KEY) ?? "");
    if (
      Array.isArray(parsed) &&
      parsed.length === 3 &&
      parsed.every(
        (cm) => typeof cm === "number" && cm >= DESK_MIN && cm <= DESK_MAX,
      )
    )
      return parsed as Presets;
  } catch {
    /* Defaults when storage is unavailable or holds something else. */
  }
  return DEFAULT_PRESETS;
}

function storePresets(presets: Presets) {
  try {
    localStorage.setItem(PRESET_KEY, JSON.stringify(presets));
  } catch {
    /* Presets still work for this visit. */
  }
}

export default function Workspace() {
  const [mode, setMode] = useState<SceneMode>("loading");
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  // Desk height in cm: the target the motor travels to, the live readout it
  // reports on the way, and the last height it settled at (for shadows).
  const [deskHeight, setDeskHeight] = useState(DESK_SIT);
  const [liveHeight, setLiveHeight] = useState(DESK_SIT);
  const [settledHeight, setSettledHeight] = useState(DESK_SIT);
  const [remoteOpen, setRemoteOpen] = useState(false);
  const [presets, setPresets] = useState<Presets>(DEFAULT_PRESETS);
  const [arming, setArming] = useState(false);
  const [savedSlot, setSavedSlot] = useState<number | null>(null);
  const [ambience, setAmbience] = useState(0);
  const [reset, setReset] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [initialFolder, setInitialFolder] = useState<FolderId>("about");
  const [panelHidden, setPanelHidden] = useState(false);
  const [compact, setCompact] = useState(false);
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const entryButton = useRef<HTMLButtonElement>(null);
  const panelToggle = useRef<HTMLButtonElement>(null);
  const introduction = useRef<HTMLElement>(null);
  const firstLine = useRef<HTMLSpanElement>(null);
  const returnFocus = useRef(false);
  const liveRef = useRef(DESK_SIT);
  const remote = useRef<HTMLDivElement>(null);
  const deskButton = useRef<HTMLButtonElement>(null);
  const hold = useRef<{ at: number; from: number } | null>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const offset = useRef({ x: 0, y: 0 });
  const drag = useRef<{
    id: number;
    x: number;
    y: number;
    fromX: number;
    fromY: number;
  } | null>(null);
  const [dragging, setDragging] = useState(false);
  const started = useRef(0);
  const skipIntro = useRef(false);
  const theme = getAmbience(ambience);

  useEffect(() => {
    started.current = performance.now();
    setPresets(loadPresets());
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(media.matches);
    sync();
    try {
      skipIntro.current = sessionStorage.getItem(INTRO_KEY) === "seen";
    } catch {
      /* Optional storage. */
    }
    media.addEventListener("change", sync);
    return () => {
      media.removeEventListener("change", sync);
      if (transitionTimer.current) clearTimeout(transitionTimer.current);
      if (savedTimer.current) clearTimeout(savedTimer.current);
    };
  }, []);

  useEffect(() => {
    // Phones stack the introduction above the desk and keep the Explore button
    // in place when the panel collapses, so it must stay interactive there.
    const media = window.matchMedia("(max-width: 720px)");
    const sync = () => setCompact(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    // Seat the panel toggle just after the first line of the title. Layout
    // offsets ignore transforms, so this stays correct while collapsed.
    const toggle = panelToggle.current;
    const section = introduction.current;
    const line = firstLine.current;
    if (!toggle || !section || !line) return;
    const place = () => {
      const x = section.offsetLeft + line.offsetLeft + line.offsetWidth + 14;
      const y =
        section.offsetTop +
        line.offsetTop +
        (line.offsetHeight - toggle.offsetHeight) / 2;
      // Re-seat instantly: only a toggle should animate the button.
      toggle.style.transition = "none";
      toggle.style.setProperty("--toggle-x", `${Math.round(x)}px`);
      toggle.style.setProperty("--toggle-y", `${Math.round(y)}px`);
      toggle.style.setProperty("--dock-x", `${section.offsetLeft}px`);
      void toggle.offsetWidth;
      toggle.style.transition = "";
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(section);
    observer.observe(document.documentElement);
    void document.fonts?.ready.then(place);
    return () => observer.disconnect();
  }, []);

  const onReady = useCallback(() => setReady(true), []);
  const onError = useCallback(() => {
    setFailed(true);
    setReady(true);
  }, []);
  const finishIntro = useCallback(() => {
    rememberIntro();
    setMode((current) =>
      current === "intro" || current === "loading" ? "room" : current,
    );
  }, []);

  useEffect(() => {
    // A stalled renderer must never leave the visitor trapped behind a loader.
    if (ready) return;
    const timeout = setTimeout(onError, 12000);
    return () => clearTimeout(timeout);
  }, [ready, onError]);

  useEffect(() => {
    if (!ready || mode !== "loading") return;
    const immediate = reducedMotion || failed || skipIntro.current;
    const delay = immediate
      ? 0
      : Math.max(0, 1200 - (performance.now() - started.current));
    const timer = setTimeout(() => {
      if (immediate) finishIntro();
      else setMode("intro");
    }, delay);
    return () => clearTimeout(timer);
  }, [ready, mode, reducedMotion, failed, finishIntro]);

  useEffect(() => {
    if (mode !== "intro") return;
    if (reducedMotion || failed) {
      finishIntro();
      return;
    }
    // Also finish in background tabs, where rendering may be suspended.
    const timeout = setTimeout(finishIntro, 4400);
    return () => clearTimeout(timeout);
  }, [mode, reducedMotion, failed, finishIntro]);

  const enter = useCallback(
    (folder: FolderId = "about") => {
      if (mode !== "room") return;
      setInitialFolder(folder);
      setRemoteOpen(false);
      document.body.style.cursor = "auto";
      if (reducedMotion || failed || !ready) {
        setMode("desktop");
        return;
      }
      setMode("entering");
      transitionTimer.current = setTimeout(() => setMode("desktop"), ENTER_MS);
    },
    [mode, reducedMotion, failed, ready],
  );
  const enterMonitor = useCallback(() => enter(), [enter]);
  // Clicking the controller on the 3D desk opens the keypad too.
  const openRemote = useCallback(() => {
    if (mode === "room") setRemoteOpen(true);
  }, [mode]);

  const exit = useCallback(() => {
    if (transitionTimer.current) clearTimeout(transitionTimer.current);
    returnFocus.current = true;
    setMode(reducedMotion || failed ? "room" : "leaving");
    transitionTimer.current = setTimeout(
      () => setMode("room"),
      reducedMotion || failed ? 0 : LEAVE_MS,
    );
  }, [reducedMotion, failed]);

  useEffect(() => {
    // Focus once the room is rendered: the overlay is inert until then. A
    // collapsed panel hides the Explore button, so use the toggle.
    if (mode !== "room" || !returnFocus.current) return;
    returnFocus.current = false;
    (panelHidden ? panelToggle : entryButton).current?.focus();
  }, [mode, panelHidden]);

  const onHeight = useCallback((cm: number, moving: boolean) => {
    liveRef.current = cm;
    setLiveHeight(cm);
    if (!moving) setSettledHeight(cm);
  }, []);

  // Desk keypad: hold an arrow to run the motor, tap it to nudge 1 cm, tap a
  // preset to travel there, or press S then a preset to store the height.
  const beginHold = (direction: 1 | -1) => {
    hold.current = { at: performance.now(), from: liveRef.current };
    setArming(false);
    setDeskHeight(direction > 0 ? DESK_MAX : DESK_MIN);
  };
  const endHold = (direction: 1 | -1) => {
    const start = hold.current;
    if (!start) return;
    hold.current = null;
    const tap = performance.now() - start.at < 220;
    setDeskHeight(
      clampHeight(Math.round(tap ? start.from + direction : liveRef.current)),
    );
  };
  const pressPreset = (slot: number) => {
    if (arming) {
      const next: Presets = [presets[0], presets[1], presets[2]];
      next[slot] = Math.round(liveRef.current);
      setPresets(next);
      storePresets(next);
      setArming(false);
      setSavedSlot(slot);
      if (savedTimer.current) clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setSavedSlot(null), 900);
      return;
    }
    setDeskHeight(presets[slot]);
  };
  // Cancel a hold at the live height, without the tap nudge. Used when the
  // keypad closes or focus leaves mid-hold: the key-up can never arrive
  // then, and the desk must not keep running to the limit.
  const stopHold = useCallback(() => {
    if (!hold.current) return;
    hold.current = null;
    setDeskHeight(clampHeight(Math.round(liveRef.current)));
  }, []);
  // The keypad drags by its body (keys excluded) and stays inside the
  // workspace. The offset sits on top of the centred base position and is
  // kept for the rest of the visit, so it reopens where it was left (and is
  // re-clamped on opening, in case the viewport shrank meanwhile).
  const placeRemote = useCallback((x: number, y: number) => {
    const el = remote.current;
    const bounds = el?.parentElement?.getBoundingClientRect();
    if (!el || !bounds) return;
    const rect = el.getBoundingClientRect();
    // The open/close transition scales the panel about its centre, so
    // measure the unscaled box to clamp exactly even while it is opening.
    const transform = getComputedStyle(el).transform;
    const scale =
      transform && transform !== "none" ? new DOMMatrix(transform).a || 1 : 1;
    const halfWidth = rect.width / scale / 2;
    const halfHeight = rect.height / scale / 2;
    const centerX = (rect.left + rect.right) / 2 + (x - offset.current.x);
    const centerY = (rect.top + rect.bottom) / 2 + (y - offset.current.y);
    const margin = 8;
    if (centerX - halfWidth < bounds.left + margin)
      x += bounds.left + margin - (centerX - halfWidth);
    else if (centerX + halfWidth > bounds.right - margin)
      x -= centerX + halfWidth - (bounds.right - margin);
    if (centerY - halfHeight < bounds.top + margin)
      y += bounds.top + margin - (centerY - halfHeight);
    else if (centerY + halfHeight > bounds.bottom - margin)
      y -= centerY + halfHeight - (bounds.bottom - margin);
    offset.current = { x, y };
    el.style.setProperty("--remote-dx", `${Math.round(x)}px`);
    el.style.setProperty("--remote-dy", `${Math.round(y)}px`);
  }, []);
  const closeRemote = useCallback(() => {
    stopHold();
    setRemoteOpen(false);
    deskButton.current?.focus();
  }, [stopHold]);
  const remoteKeys = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      if (event.repeat) return;
      setDeskHeight(
        clampHeight(
          Math.round(liveRef.current) + (event.key === "ArrowUp" ? 1 : -1),
        ),
      );
    } else if (event.key === "Tab" && remote.current) {
      const keys = remote.current.querySelectorAll<HTMLElement>("button");
      const first = keys[0];
      const last = keys[keys.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  };
  useEffect(() => {
    if (!remoteOpen) {
      setArming(false);
      stopHold();
      return;
    }
    // Re-clamp the remembered position: the viewport may have changed while
    // the keypad was closed.
    placeRemote(offset.current.x, offset.current.y);
    remote.current?.focus();
    // Clicks on the scene leave it open (orbiting must not dismiss it); only
    // the X, Escape, or the toolbar button close it. Escape is listened for
    // on the document so it works after focus has moved to the scene. Keep
    // the keypad on screen when the window changes size, and stop a running
    // hold if the window loses focus.
    const key = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") closeRemote();
    };
    const keep = () => placeRemote(offset.current.x, offset.current.y);
    document.addEventListener("keydown", key);
    window.addEventListener("resize", keep);
    window.addEventListener("blur", stopHold);
    return () => {
      document.removeEventListener("keydown", key);
      window.removeEventListener("resize", keep);
      window.removeEventListener("blur", stopHold);
    };
  }, [remoteOpen, placeRemote, closeRemote, stopHold]);
  const readout =
    savedSlot === null
      ? liveHeight.toFixed(1).padStart(5, " ")
      : ` S-${savedSlot + 1}`;

  // The toolbar sits above the mood slider on desktop and in the footer on
  // phones, where the slider is centred at the bottom.
  const controls = (
    <div className="scene-controls" aria-label="Workspace controls">
      <button
        onClick={() => setReset((value) => value + 1)}
        aria-label="Reset camera view"
        title="Reset view"
      >
        <RotateCcw size={15} />
      </button>
      <button
        ref={deskButton}
        onClick={() => setRemoteOpen((open) => !open)}
        aria-haspopup="dialog"
        aria-expanded={remoteOpen}
        aria-controls="desk-remote"
        aria-label="Desk height"
        title="Desk height"
      >
        <ArrowUpDown size={15} />
      </button>
    </div>
  );
  const opening = mode === "loading" || mode === "intro";
  return (
    <main
      className={`workspace mode-${mode}${panelHidden ? " panel-hidden" : ""}`}
      style={
        {
          "--room": theme.background,
          "--scene-ink": theme.ink,
          "--scene-muted": theme.muted,
        } as CSSProperties
      }
    >
      <div className="scene-container" aria-hidden="true">
        {!failed && (
          <StudioScene
            mode={mode}
            height={deskHeight}
            settledHeight={settledHeight}
            onHeight={onHeight}
            ambience={ambience}
            reset={reset}
            reducedMotion={reducedMotion}
            onEnter={enterMonitor}
            onDeskControl={openRemote}
            onReady={onReady}
            onError={onError}
            onIntroComplete={finishIntro}
          />
        )}
      </div>
      <div className="room-interface" inert={mode !== "room"}>
        <header id="room-identity" className="room-header" inert={panelHidden}>
          <a className="identity" href="/" aria-label="Fredy Maldonado home">
            <span className="wordmark">fm.</span>
            <span>
              Fredy Maldonado<small>Software engineer</small>
            </span>
          </a>
        </header>
        <section ref={introduction} className="room-introduction">
          <div id="room-title" className="intro-heading" inert={panelHidden}>
            <h2>
              <span ref={firstLine} className="intro-line">
                Welcome to my
              </span>
              <br />
              workspace.
            </h2>
          </div>
          <button
            ref={entryButton}
            className="enter-desktop"
            onClick={() => enter()}
            inert={panelHidden}
          >
            <Monitor size={17} />
            <span>Explore my desktop</span>
            <ArrowRight size={17} />
          </button>
        </section>
        <button
          ref={panelToggle}
          className="panel-toggle"
          onClick={() => setPanelHidden((value) => !value)}
          aria-expanded={!panelHidden}
          aria-controls="room-identity room-title room-dock"
          aria-label={
            panelHidden ? "Show the side panel" : "Hide the side panel"
          }
          title={panelHidden ? "Show the side panel" : "Hide the side panel"}
        >
          {panelHidden ? (
            <PanelLeftOpen size={16} strokeWidth={1.7} />
          ) : (
            <PanelLeftClose size={16} strokeWidth={1.7} />
          )}
        </button>
        <div
          id="desk-remote"
          ref={remote}
          className={`desk-remote${remoteOpen ? " open" : ""}${dragging ? " dragging" : ""}`}
          role="dialog"
          aria-label="Desk height controller"
          tabIndex={-1}
          inert={!remoteOpen}
          onKeyDown={remoteKeys}
          onPointerDown={(event) => {
            if ((event.target as HTMLElement).closest("button")) return;
            if (event.pointerType === "mouse" && event.button !== 0) return;
            event.currentTarget.setPointerCapture(event.pointerId);
            drag.current = {
              id: event.pointerId,
              x: event.clientX,
              y: event.clientY,
              fromX: offset.current.x,
              fromY: offset.current.y,
            };
            setDragging(true);
          }}
          onPointerMove={(event) => {
            const start = drag.current;
            if (!start || event.pointerId !== start.id) return;
            placeRemote(
              start.fromX + event.clientX - start.x,
              start.fromY + event.clientY - start.y,
            );
          }}
          onPointerUp={(event) => {
            if (drag.current?.id !== event.pointerId) return;
            drag.current = null;
            setDragging(false);
          }}
          onPointerCancel={(event) => {
            if (drag.current?.id !== event.pointerId) return;
            drag.current = null;
            setDragging(false);
          }}
        >
          <span className="remote-grip" aria-hidden="true" />
          <div
            className="remote-screen"
            role="status"
            aria-live="polite"
            aria-label={
              savedSlot === null
                ? `${liveHeight.toFixed(1)} centimeters`
                : `Saved preset ${savedSlot + 1}`
            }
          >
            <SevenSegment text={readout} />
            <span className="remote-unit">cm</span>
          </div>
          <div className="remote-keys">
            {([1, -1] as const).map((direction) => (
              <button
                key={direction}
                className="remote-key"
                aria-label={direction > 0 ? "Raise desk" : "Lower desk"}
                title={
                  direction > 0
                    ? "Hold to raise, tap for 1 cm"
                    : "Hold to lower, tap for 1 cm"
                }
                onPointerDown={(event) => {
                  event.currentTarget.setPointerCapture(event.pointerId);
                  beginHold(direction);
                }}
                onPointerUp={() => endHold(direction)}
                onPointerCancel={() => endHold(direction)}
                onKeyDown={(event) => {
                  if (
                    (event.key === "Enter" || event.key === " ") &&
                    !event.repeat
                  )
                    beginHold(direction);
                }}
                onKeyUp={(event) => {
                  if (event.key === "Enter" || event.key === " ")
                    endHold(direction);
                }}
                onBlur={stopHold}
                onContextMenu={(event) => event.preventDefault()}
              >
                {direction > 0 ? (
                  <ChevronUp size={18} strokeWidth={2.4} />
                ) : (
                  <ChevronDown size={18} strokeWidth={2.4} />
                )}
              </button>
            ))}
            {presets.map((cm, slot) => (
              <button
                key={slot}
                className={`remote-key${savedSlot === slot ? " saved" : ""}`}
                aria-label={
                  arming
                    ? `Save current height as preset ${slot + 1}`
                    : `Preset ${slot + 1}, ${cm} centimeters`
                }
                title={arming ? "Save here" : `${cm} cm`}
                onClick={() => pressPreset(slot)}
              >
                {slot + 1}
              </button>
            ))}
            <button
              className={`remote-key remote-save${arming ? " armed" : ""}`}
              aria-pressed={arming}
              aria-label="Save a preset: press S, then 1, 2, or 3"
              title="Save preset"
              onClick={() => setArming((value) => !value)}
            >
              S
            </button>
          </div>
          <button
            className="remote-close"
            aria-label="Close desk controller"
            onClick={closeRemote}
          >
            <X size={13} />
          </button>
        </div>
        {failed && (
          <div className="webgl-notice" role="status">
            The desktop is ready.
            <br />
            This browser couldn't open the 3D workspace.
          </div>
        )}
        <div id="room-dock" className="room-dock" inert={panelHidden}>
          {!compact && controls}
          <div className="ambient-control">
            <div className="ambient-heading">
              <label htmlFor="ambience">Set the mood</label>
              <span>{theme.label}</span>
            </div>
            <input
              id="ambience"
              aria-label="Ambient lighting"
              aria-valuetext={`${theme.label}, ${ambience} percent`}
              type="range"
              min="0"
              max="100"
              step="1"
              value={ambience}
              onChange={(event) => setAmbience(Number(event.target.value))}
            />
            <div className="ambient-stops">
              <button
                aria-label="Set daylight ambience"
                onClick={() => setAmbience(0)}
              >
                <Sun size={13} />
                <span>Light</span>
              </button>
              <button
                aria-label="Set warm ambience"
                onClick={() => setAmbience(50)}
              >
                <Sunset size={13} />
                <span>Warm</span>
              </button>
              <button
                aria-label="Set dark ambience"
                onClick={() => setAmbience(100)}
              >
                <Moon size={13} />
                <span>Dark</span>
              </button>
            </div>
          </div>
        </div>
        <footer className="room-footer">
          <div className="place-and-time">
            <span className="location-dot" />
            Honduras<span className="footer-separator">/</span>
            <LocalTime />
          </div>
          {compact ? (
            controls
          ) : (
            <div className="scene-hint">
              <MousePointer2 size={13} />
              <span>Drag to look around. Click the screen to step inside.</span>
            </div>
          )}
          <span className="made-with-care">Make yourself at home.</span>
        </footer>
      </div>
      <div className="transition-shade" aria-hidden="true" />
      <div
        className={`preloader ${mode !== "loading" ? "preloader-done" : ""}`}
        aria-hidden={mode !== "loading"}
      >
        <div className="preloader-logo" aria-hidden="true">
          <span>f</span>
          <span>m</span>
          <i>.</i>
          <div className="logo-orbit" />
        </div>
        <p role="status">
          Getting the desk ready<span className="loading-dots">…</span>
        </p>
      </div>
      {opening && (
        <button className="skip-intro" onClick={finishIntro}>
          Skip intro <ArrowRight size={14} />
        </button>
      )}
      {mode === "intro" && (
        <div className="intro-caption" aria-live="polite">
          A little of my world.
        </div>
      )}
      {(mode === "desktop" || mode === "leaving") && (
        <Desktop
          initialFolder={initialFolder}
          onExit={exit}
          daylight={ambience < 75}
          leaving={mode === "leaving"}
        />
      )}
    </main>
  );
}
