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
import { LOCALE_FADE_IN_MS, useLocale } from "@/lib/i18n";
import { keypad, moodLabel as moodName, room } from "@/lib/strings";
import LanguageToggle from "./LanguageToggle";

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
  const { locale, switching, t } = useLocale();
  // After the swap the new copy fades back in; `settling` keeps the fade-in
  // class on for that long (see "Language toggle and crossfade" in CSS).
  const [settling, setSettling] = useState(false);
  const wasSwitching = useRef(false);
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
  // The mood is the target the slider and stops set; ambience is the applied
  // value that eases toward it, so colour changes never snap.
  const [mood, setMood] = useState(0);
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
  const placedLocale = useRef<string | null>(null);
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
  const ambienceRef = useRef(0);
  const ambienceFrame = useRef(0);
  const theme = getAmbience(ambience);
  const moodLabel = t(moodName(getAmbience(mood).label));

  useEffect(() => {
    // Next applies the English metadata title after hydration, which can
    // land after a stored Spanish choice; keep the title in the visitor's
    // language whenever the head changes.
    const title = t(room.documentTitle);
    const apply = () => {
      if (document.title !== title) document.title = title;
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.head, {
      subtree: true,
      childList: true,
      characterData: true,
    });
    return () => observer.disconnect();
  }, [t]);

  useEffect(() => {
    if (switching) {
      wasSwitching.current = true;
      setSettling(false);
      return;
    }
    if (!wasSwitching.current) return;
    wasSwitching.current = false;
    setSettling(true);
    const timer = setTimeout(() => setSettling(false), LOCALE_FADE_IN_MS);
    return () => clearTimeout(timer);
  }, [switching]);

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
    const place = (glide = false) => {
      const x = section.offsetLeft + line.offsetLeft + line.offsetWidth + 14;
      const y =
        section.offsetTop +
        line.offsetTop +
        (line.offsetHeight - toggle.offsetHeight) / 2;
      // Re-seat instantly on resize: only a toggle should animate the
      // button. A new title language glides it to the new line end.
      if (!glide) toggle.style.transition = "none";
      toggle.style.setProperty("--toggle-x", `${Math.round(x)}px`);
      toggle.style.setProperty("--toggle-y", `${Math.round(y)}px`);
      toggle.style.setProperty("--dock-x", `${section.offsetLeft}px`);
      if (glide) return;
      void toggle.offsetWidth;
      toggle.style.transition = "";
    };
    const titleChanged =
      placedLocale.current !== null && placedLocale.current !== locale;
    placedLocale.current = locale;
    place(titleChanged);
    const resize = () => place();
    const observer = new ResizeObserver(resize);
    observer.observe(section);
    observer.observe(document.documentElement);
    void document.fonts?.ready.then(resize);
    return () => observer.disconnect();
  }, [locale]);

  useEffect(() => {
    // Ease the applied ambience toward the mood with a frame-rate-independent
    // exponential approach: buttons glide in about 0.4 s and a drag trails the
    // thumb slightly. The live value sits in a ref so a retarget mid-flight
    // continues from wherever the colours are, and state is set once a frame.
    if (reducedMotion) {
      ambienceRef.current = mood;
      setAmbience(mood);
      return;
    }
    // 0.3 of a point is under one RGB unit; stopping there ends the
    // invisible tail of frames about a quarter of a second sooner.
    if (Math.abs(mood - ambienceRef.current) < 0.3) return;
    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.max(0, now - last);
      last = now;
      const current = ambienceRef.current;
      let next = current + (mood - current) * (1 - Math.exp(-dt / 110));
      if (Math.abs(mood - next) < 0.3) next = mood;
      ambienceRef.current = next;
      setAmbience(next);
      ambienceFrame.current = next === mood ? 0 : requestAnimationFrame(step);
    };
    ambienceFrame.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(ambienceFrame.current);
  }, [mood, reducedMotion]);

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
    <div className="scene-controls" aria-label={t(room.controls)}>
      <button
        onClick={() => setReset((value) => value + 1)}
        aria-label={t(room.resetLabel)}
        title={t(room.resetTitle)}
      >
        <RotateCcw size={15} />
      </button>
      <button
        ref={deskButton}
        onClick={() => setRemoteOpen((open) => !open)}
        aria-haspopup="dialog"
        aria-expanded={remoteOpen}
        aria-controls="desk-remote"
        aria-label={t(room.deskHeight)}
        title={t(room.deskHeight)}
      >
        <ArrowUpDown size={15} />
      </button>
    </div>
  );
  return (
    <main
      className={`workspace mode-${mode}${panelHidden ? " panel-hidden" : ""}${switching ? " lang-switching" : ""}${settling ? " lang-settling" : ""}`}
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
          <a className="identity" href="/" aria-label={t(room.home)}>
            <span className="wordmark">fm.</span>
            <span className="identity-name">
              Fredy Maldonado<small>{t(room.role)}</small>
            </span>
          </a>
        </header>
        <section ref={introduction} className="room-introduction">
          <div id="room-title" className="intro-heading" inert={panelHidden}>
            <h2>
              <span ref={firstLine} className="intro-line">
                {t(room.titleFirst)}
              </span>
              <br />
              {t(room.titleSecond)}
            </h2>
          </div>
          <button
            ref={entryButton}
            className="enter-desktop"
            onClick={() => enter()}
            inert={panelHidden}
          >
            <Monitor size={17} />
            <span>{t(room.explore)}</span>
            <ArrowRight size={17} />
          </button>
        </section>
        <button
          ref={panelToggle}
          className="panel-toggle"
          onClick={() => setPanelHidden((value) => !value)}
          aria-expanded={!panelHidden}
          aria-controls="room-identity room-title room-dock"
          aria-label={t(panelHidden ? room.showPanel : room.hidePanel)}
          title={t(panelHidden ? room.showPanel : room.hidePanel)}
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
          aria-label={t(keypad.dialog)}
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
                ? t(keypad.reading)(liveHeight.toFixed(1))
                : t(keypad.saved)(savedSlot + 1)
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
                aria-label={t(direction > 0 ? keypad.raise : keypad.lower)}
                title={t(direction > 0 ? keypad.raiseTitle : keypad.lowerTitle)}
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
                    ? t(keypad.storeIn)(slot + 1)
                    : t(keypad.preset)(slot + 1, cm)
                }
                title={arming ? t(keypad.storeTitle) : `${cm} cm`}
                onClick={() => pressPreset(slot)}
              >
                {slot + 1}
              </button>
            ))}
            <button
              className={`remote-key remote-save${arming ? " armed" : ""}`}
              aria-pressed={arming}
              aria-label={t(keypad.save)}
              title={t(keypad.saveTitle)}
              onClick={() => setArming((value) => !value)}
            >
              S
            </button>
          </div>
          <button
            className="remote-close"
            aria-label={t(keypad.close)}
            onClick={closeRemote}
          >
            <X size={13} />
          </button>
        </div>
        {failed && (
          <div className="webgl-notice" role="status">
            {t(room.webglReady)}
            <br />
            {t(room.webglFailed)}
          </div>
        )}
        <div id="room-dock" className="room-dock" inert={panelHidden}>
          {!compact && controls}
          <div className="ambient-control">
            <div className="ambient-heading">
              <label htmlFor="ambience">{t(room.mood)}</label>
              <span>{moodLabel}</span>
            </div>
            <input
              id="ambience"
              aria-label={t(room.lighting)}
              aria-valuetext={t(room.moodValue)(moodLabel, mood)}
              type="range"
              min="0"
              max="100"
              step="1"
              value={mood}
              onChange={(event) => setMood(Number(event.target.value))}
            />
            <div className="ambient-stops">
              {room.stops.map((stop, index) => {
                const Icon = [Sun, Sunset, Moon][index];
                return (
                  <button
                    key={stop.label.en}
                    aria-label={t(stop.aria)}
                    onClick={() => setMood(index * 50)}
                  >
                    <Icon size={13} />
                    <span>{t(stop.label)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <footer className="room-footer">
          <div className="place-and-time">
            <span className="location-dot" />
            <span className="place-name">{t(room.location)}</span>
            <span className="footer-separator">/</span>
            <LocalTime />
          </div>
          {compact ? (
            controls
          ) : (
            <div className="scene-hint">
              <MousePointer2 size={13} />
              <span>{t(room.hint)}</span>
            </div>
          )}
          <span className="made-with-care">{t(room.welcome)}</span>
        </footer>
        <LanguageToggle className="language-toggle-room" />
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
          {t(room.loading)}
          <span className="loading-dots">…</span>
        </p>
      </div>
      {mode === "intro" && (
        <div className="intro-caption" aria-live="polite">
          {t(room.introCaption)}
        </div>
      )}
      {(mode === "desktop" || mode === "leaving") && (
        <Desktop
          initialFolder={initialFolder}
          onExit={exit}
          daylight={mood < 75}
          leaving={mode === "leaving"}
        />
      )}
    </main>
  );
}
