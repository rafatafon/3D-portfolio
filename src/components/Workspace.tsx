"use client";

import dynamic from "next/dynamic";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  ArrowRight,
  ArrowUpRight,
  MoveUp,
  RotateCcw,
  Sun,
  Moon,
  Sunset,
  MousePointer2,
  Monitor,
  X,
} from "lucide-react";
import Desktop, { LocalTime } from "./Desktop";
import type { SceneMode } from "./StudioScene";
import type { FolderId } from "@/lib/content";
import { getAmbience } from "@/lib/ambience";

const StudioScene = dynamic(() => import("./StudioScene"), { ssr: false });
const INTRO_KEY = "fm-workspace-intro-v2";

function rememberIntro() {
  try {
    sessionStorage.setItem(INTRO_KEY, "seen");
  } catch {
    /* The experience also works with storage disabled. */
  }
}

export default function Workspace() {
  const [mode, setMode] = useState<SceneMode>("loading");
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [standing, setStanding] = useState(false);
  const [ambience, setAmbience] = useState(0);
  const [reset, setReset] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [initialFolder, setInitialFolder] = useState<FolderId>("about");
  const [musicNote, setMusicNote] = useState(false);
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const entryButton = useRef<HTMLButtonElement>(null);
  const started = useRef(0);
  const skipIntro = useRef(false);
  const theme = getAmbience(ambience);

  useEffect(() => {
    started.current = performance.now();
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
    };
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
      setMusicNote(false);
      document.body.style.cursor = "auto";
      if (reducedMotion || failed || !ready) {
        setMode("desktop");
        return;
      }
      setMode("entering");
      transitionTimer.current = setTimeout(() => setMode("desktop"), 1250);
    },
    [mode, reducedMotion, failed, ready],
  );
  const enterMonitor = useCallback(() => enter(), [enter]);
  const showMusic = useCallback(() => setMusicNote(true), []);

  const exit = useCallback(() => {
    if (transitionTimer.current) clearTimeout(transitionTimer.current);
    setMode(reducedMotion || failed ? "room" : "leaving");
    transitionTimer.current = setTimeout(
      () => {
        setMode("room");
        entryButton.current?.focus();
      },
      reducedMotion || failed ? 0 : 800,
    );
  }, [reducedMotion, failed]);

  const opening = mode === "loading" || mode === "intro";
  return (
    <main
      className={`workspace mode-${mode}`}
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
            standing={standing}
            ambience={ambience}
            reset={reset}
            reducedMotion={reducedMotion}
            onEnter={enterMonitor}
            onMusic={showMusic}
            onReady={onReady}
            onError={onError}
            onIntroComplete={finishIntro}
          />
        )}
      </div>
      <div className="room-interface" inert={mode !== "room"}>
        <header className="room-header">
          <a className="identity" href="/" aria-label="Fredy Maldonado home">
            <span className="wordmark">fm.</span>
            <span>
              Fredy Maldonado<small>Software engineer</small>
            </span>
          </a>
          <nav aria-label="Quick navigation">
            <button onClick={() => enter("projects")}>
              Selected work <ArrowUpRight size={13} />
            </button>
            <button onClick={() => enter("contact")}>
              Say hello <ArrowUpRight size={13} />
            </button>
          </nav>
        </header>
        <section className="room-introduction">
          <div className="welcome-label">
            <span /> Welcome to my workspace
          </div>
          <h2>
            A space for
            <br />
            good work.
          </h2>
          <p>
            Things I build.
            <br /> The space I build them in.
          </p>
          <button
            ref={entryButton}
            className="enter-desktop"
            onClick={() => enter()}
          >
            <Monitor size={17} />
            <span>Explore my desktop</span>
            <ArrowRight size={17} />
          </button>
          <a className="simple-view" href="/portfolio">
            Just here for the portfolio? <ArrowUpRight size={12} />
          </a>
        </section>
        {failed && (
          <div className="webgl-notice" role="status">
            The desktop is ready.
            <br />
            This browser couldn't open the 3D workspace.
          </div>
        )}
        <div className="scene-hint">
          <MousePointer2 size={13} />
          <span>Drag to look around. Click the screen to step inside.</span>
        </div>
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
        <footer className="room-footer">
          <div className="place-and-time">
            <span className="location-dot" />
            Honduras<span className="footer-separator">/</span>
            <LocalTime />
          </div>
          <div className="scene-controls" aria-label="Workspace controls">
            <button
              onClick={() => setReset((value) => value + 1)}
              aria-label="Reset camera view"
              title="Reset view"
            >
              <RotateCcw size={15} />
            </button>
            <button
              onClick={() => setStanding((value) => !value)}
              aria-label={
                standing ? "Lower standing desk" : "Raise standing desk"
              }
              aria-pressed={standing}
              title={standing ? "Lower desk" : "Raise desk"}
            >
              <MoveUp size={16} />
            </button>
            <button
              onClick={showMusic}
              aria-label="About my listening corner"
              title="My listening corner"
            >
              <span className="music-glyph">♫</span>
            </button>
          </div>
          <span className="made-with-care">Make yourself at home.</span>
        </footer>
        {musicNote && (
          <div className="music-note" role="status">
            <button
              onClick={() => setMusicNote(false)}
              aria-label="Close listening note"
            >
              <X size={15} />
            </button>
            <span>On my desk, in my ears.</span>
            <p>
              My listening corner.
              <br />A playlist is on its way.
            </p>
          </div>
        )}
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
        <a href="/portfolio" tabIndex={mode === "loading" ? 0 : -1}>
          Open simple portfolio <ArrowUpRight size={12} />
        </a>
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
      {mode === "desktop" && (
        <Desktop
          initialFolder={initialFolder}
          onExit={exit}
          daylight={ambience < 75}
        />
      )}
    </main>
  );
}
