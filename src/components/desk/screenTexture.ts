import * as THREE from "three";
import { folders, profile, skills } from "@/lib/content";
import type { Locale } from "@/lib/i18n";
import {
  appleMarkPath,
  finderIcon,
  formatLocalTime,
  strings,
} from "../Desktop";
import { copy } from "../PortfolioContent";
import { textureFromCanvas } from "./primitives";

// The ultrawide's screen shows the desktop exactly as it opens: the About me
// window centred, the file column, the Dock, and the menubar. It is painted
// in CSS pixels of a 2130 × 900 viewport (the panel's 2.37:1 aspect), measured
// from the real desktop in Desktop.tsx and the desktop layers of globals.css,
// then scaled onto a 3072 × 1296 canvas so the close-up stays sharp. Labels
// come from the desktop's own bilingual strings; only geometry lives here.
export const SCREEN_WIDTH = 3072;
export const SCREEN_HEIGHT = 1296;
const VIEW_W = 2130;
const VIEW_H = 900;
const SCALE = SCREEN_WIDTH / VIEW_W;
const FONT =
  '-apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif';

// `.desktop` / `.desktop-dark` finder palette.
const palettes = {
  light: {
    surface: "#ffffff",
    ink: "#242529",
    muted: "#6b6d74",
    glass: "rgba(236, 236, 240, 0.85)",
    line: "rgba(0, 0, 0, 0.07)",
    selected: "#007aff",
  },
  dark: {
    surface: "#202125",
    ink: "#ededf0",
    muted: "#a1a2ac",
    glass: "rgba(51, 52, 57, 0.86)",
    line: "rgba(255, 255, 255, 0.09)",
    selected: "#0a84ff",
  },
};
type Palette = (typeof palettes)["light"];

// Icon colours: the `--ic-*` custom properties on `.folder-icon`,
// `.paper-icon`, `.mail-icon`, and the Dock tiles, light and under
// `.desktop-dark` (the "Dark icon style" section of globals.css).
const iconColors = {
  light: {
    foldTab: "#5aade4",
    foldTabHi: "#bbebff",
    foldBack: "#3c9ddf",
    foldSheet: "#e3e9e6",
    foldFrontA: "#78ccff",
    foldFrontB: "#50b3f2",
    foldEdge: "#8ad2ff",
    foldFrontHi: "rgba(199, 237, 255, 0.85)",
    paperA: "#ffffff",
    paperB: "#edf0f4",
    paperRim: "rgba(255, 255, 239, 0.4)",
    paperCorner: "#c9c8bd",
    paperLine: "#a1aaa0",
    paperPdf: "#a45043",
    contactA: "#8bb7c8",
    contactB: "#557f96",
    contactRim: "rgba(180, 207, 218, 0.3)",
    contactSheen: "rgba(227, 243, 255, 0.24)",
    contactGlyph: "#f3f0df",
    tileRim: "rgba(255, 255, 255, 0.32)",
    tileSheen: "rgba(255, 255, 255, 0)",
    tileLine: "#c9cbd0",
    studio: ["#f4dcb6", "#c48a55", "#ffffff"],
    projects: ["#a5a3ff", "#5856d6", "#ffffff"],
    mail: ["#46adff", "#0865e5", "#ffffff"],
    files: ["#d1efff", "#93cafd", "#2581bf", "#95d2ff"],
    notes: ["#ffd54a", "#fafaf9", "#fafaf9"],
    textedit: ["#ffffff", "#eceef2", "#3379dc"],
    finder: ["#6dcaff", "#d5efff", "#17395c"],
  },
  dark: {
    foldTab: "#464a52",
    foldTabHi: "#60646d",
    foldBack: "#2c2f35",
    foldSheet: "#7c7f87",
    foldFrontA: "#3a3d44",
    foldFrontB: "#2c2f35",
    foldEdge: "#4b4f57",
    foldFrontHi: "#555963",
    paperA: "#393b41",
    paperB: "#2d2f34",
    paperRim: "rgba(255, 255, 255, 0.1)",
    paperCorner: "#5d6068",
    paperLine: "#9a9da5",
    paperPdf: "#c0675a",
    contactA: "#2a2c31",
    contactB: "#1b1c20",
    contactRim: "rgba(255, 255, 255, 0.12)",
    contactSheen: "rgba(255, 255, 255, 0.16)",
    contactGlyph: "#8db5c7",
    tileRim: "rgba(255, 255, 255, 0.12)",
    tileSheen: "rgba(255, 255, 255, 0.16)",
    tileLine: "#50535b",
    studio: ["#2a2c31", "#1b1c20", "#dcae7c"],
    projects: ["#2a2c31", "#1b1c20", "#9997ee"],
    mail: ["#2a2c31", "#1b1c20", "#4c9ce6"],
    files: ["#2a2c31", "#1b1c20", "#7cbcea", "#3c719c"],
    notes: ["#d4a72c", "#2a2c31", "#1b1c20"],
    textedit: ["#2a2c31", "#1b1c20", "#5b8fd8"],
    finder: ["#2f7bb4", "#8dbbdc", "#0d2236"],
  },
};
type IconColors = (typeof iconColors)["light"];

// Lucide 0.468 icon geometry (24-unit view box), flattened to path data.
const icons = {
  search: "M3 11a8 8 0 1 0 16 0a8 8 0 1 0 -16 0 M21 21l-4.3-4.3",
  batteryFull:
    "M4 7h12a2 2 0 0 1 2 2v6a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-6a2 2 0 0 1 2 -2z M22 11L22 13 M6 11L6 13 M10 11L10 13 M14 11L14 13",
  wifi: "M12 20h.01 M2 8.82a15 15 0 0 1 20 0 M5 12.859a10 10 0 0 1 14 0 M8.5 16.429a5 5 0 0 1 7 0",
  slidersHorizontal:
    "M21 4L14 4 M10 4L3 4 M21 12L12 12 M8 12L3 12 M21 20L16 20 M12 20L3 20 M14 2L14 6 M8 10L8 14 M16 18L16 22",
  panelLeft:
    "M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2z M9 3v18",
  chevronLeft: "M15 18l-6-6 6-6",
  chevronRight: "M9 18l6-6-6-6",
  layoutGrid:
    "M4 3h5a1 1 0 0 1 1 1v5a1 1 0 0 1 -1 1h-5a1 1 0 0 1 -1 -1v-5a1 1 0 0 1 1 -1z M15 3h5a1 1 0 0 1 1 1v5a1 1 0 0 1 -1 1h-5a1 1 0 0 1 -1 -1v-5a1 1 0 0 1 1 -1z M15 14h5a1 1 0 0 1 1 1v5a1 1 0 0 1 -1 1h-5a1 1 0 0 1 -1 -1v-5a1 1 0 0 1 1 -1z M4 14h5a1 1 0 0 1 1 1v5a1 1 0 0 1 -1 1h-5a1 1 0 0 1 -1 -1v-5a1 1 0 0 1 1 -1z",
  fileText:
    "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z M14 2v4a2 2 0 0 0 2 2h4 M10 9H8 M16 13H8 M16 17H8",
  folder:
    "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z",
  briefcaseBusiness:
    "M12 12h.01 M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2 M22 13a18.15 18.15 0 0 1-20 0 M4 6h16a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-16a2 2 0 0 1 -2 -2v-10a2 2 0 0 1 2 -2z",
  mail: "M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-16a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2z M22 7l-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7",
  house:
    "M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8 M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  download:
    "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10L12 15L17 10 M12 15L12 3",
  mapPin:
    "M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0 M9 10a3 3 0 1 0 6 0a3 3 0 1 0 -6 0",
  arrowUpRight: "M7 7h10v10 M7 17L17 7",
};
const navIcons = {
  about: icons.fileText,
  projects: icons.folder,
  experience: icons.briefcaseBusiness,
  writing: icons.fileText,
  contact: icons.mail,
};

const paths = new Map<string, Path2D>();
function path(d: string) {
  let p = paths.get(d);
  if (!p) paths.set(d, (p = new Path2D(d)));
  return p;
}

type Ctx = CanvasRenderingContext2D;

function icon(
  ctx: Ctx,
  d: string,
  x: number,
  y: number,
  size: number,
  color: string,
  width = 2,
  fill?: string,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 24, size / 24);
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = color;
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill(path(d));
  }
  ctx.stroke(path(d));
  ctx.restore();
}

type TextStyle = {
  size: number;
  weight?: number;
  color: string;
  align?: CanvasTextAlign;
  spacing?: number;
};

function setFont(ctx: Ctx, { size, weight = 400, spacing = 0 }: TextStyle) {
  ctx.font = `${weight} ${size}px ${FONT}`;
  if ("letterSpacing" in ctx) ctx.letterSpacing = `${spacing}px`;
}

// Draws one line vertically centred on `y` the way a CSS line box centres
// its text, using the font's own ascent and descent.
function text(ctx: Ctx, value: string, x: number, y: number, style: TextStyle) {
  setFont(ctx, style);
  ctx.fillStyle = style.color;
  ctx.textAlign = style.align ?? "left";
  ctx.textBaseline = "alphabetic";
  const m = ctx.measureText(value);
  const ascent = m.fontBoundingBoxAscent ?? style.size * 0.95;
  const descent = m.fontBoundingBoxDescent ?? style.size * 0.24;
  ctx.fillText(value, x, y + (ascent - descent) / 2);
  return m.width;
}

function measure(ctx: Ctx, value: string, style: TextStyle) {
  setFont(ctx, style);
  return ctx.measureText(value).width;
}

function wrap(ctx: Ctx, value: string, max: number, style: TextStyle) {
  setFont(ctx, style);
  const lines: string[] = [];
  let line = "";
  for (const word of value.split(" ")) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > max) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

function roundRect(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number | number[],
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

// Canvas shadows ignore the transform, so they are given in CSS px here.
function shadow(ctx: Ctx, color: string, blur: number, offsetY = 0) {
  ctx.shadowColor = color;
  ctx.shadowBlur = blur * SCALE;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = offsetY * SCALE;
}
function noShadow(ctx: Ctx) {
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
}

// Backdrop blur: a heavily downsampled copy of the painted wallpaper, drawn
// back up inside each glass shape (menubar, window, Dock).
function blurredCopy(source: HTMLCanvasElement) {
  let current: HTMLCanvasElement = source;
  for (const factor of [4, 4, 2]) {
    const next = document.createElement("canvas");
    next.width = Math.max(1, Math.round(current.width / factor));
    next.height = Math.max(1, Math.round(current.height / factor));
    const c = next.getContext("2d")!;
    c.imageSmoothingQuality = "high";
    c.drawImage(current, 0, 0, next.width, next.height);
    current = next;
  }
  return current;
}

function glass(ctx: Ctx, blur: HTMLCanvasElement, tint: string) {
  ctx.save();
  ctx.clip();
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(blur, 0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = tint;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.restore();
}

function drawWallpaper(ctx: Ctx, wallpaper: CanvasImageSource) {
  ctx.fillStyle = "#09090b";
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // background-size: cover, centred (the wallpaper is wider than tall but
  // narrower than the ultrawide, so it fills the width and crops the height).
  const { width, height } = wallpaper as HTMLCanvasElement;
  const scale = Math.max(VIEW_W / width, VIEW_H / height);
  const w = width * scale;
  const h = height * scale;
  ctx.drawImage(wallpaper, (VIEW_W - w) / 2, (VIEW_H - h) / 2, w, h);
}

// FileIcon kinds, drawn from the `.folder-icon`, `.paper-icon`, and
// `.mail-icon` rules.
function paperIcon(
  ctx: Ctx,
  c: IconColors,
  x: number,
  y: number,
  w: number,
  pdf: boolean,
) {
  const h = 54;
  ctx.save();
  shadow(ctx, "rgba(30, 51, 51, 0.13)", 3, 4);
  const fill = ctx.createLinearGradient(x, y, x + w, y + h);
  fill.addColorStop(0, c.paperA);
  fill.addColorStop(1, c.paperB);
  ctx.fillStyle = fill;
  roundRect(ctx, x, y, w, h, [3, 9, 3, 3]);
  ctx.fill();
  noShadow(ctx);
  ctx.strokeStyle = c.paperRim;
  ctx.lineWidth = 1;
  roundRect(ctx, x + 0.5, y + 0.5, w - 1, h - 1, [2.5, 8.5, 2.5, 2.5]);
  ctx.stroke();
  ctx.fillStyle = c.paperCorner;
  ctx.beginPath();
  ctx.moveTo(x + w - 10, y + 10);
  ctx.lineTo(x + w, y + 10);
  ctx.lineTo(x + w, y);
  ctx.fill();
  ctx.fillStyle = c.paperLine;
  for (let i = 0; i < 4; i++) {
    roundRect(
      ctx,
      x + 8,
      y + 14 + i * 6,
      (w - 16) * (i === 2 ? 0.75 : 1),
      2,
      1,
    );
    ctx.fill();
  }
  if (pdf)
    text(ctx, "PDF", x + 8, y + h - 11.5, {
      size: 9,
      weight: 700,
      color: c.paperPdf,
      spacing: 0.5,
    });
  ctx.restore();
}

function folderIcon(ctx: Ctx, c: IconColors, x: number, y: number) {
  const w = 62;
  const h = 47;
  ctx.save();
  shadow(ctx, "rgba(30, 51, 51, 0.13)", 3, 4);
  ctx.fillStyle = c.foldBack;
  roundRect(ctx, x, y, w, h, [3, 5, 5, 5]);
  ctx.fill();
  noShadow(ctx);
  roundRect(ctx, x, y - 5, 29, 13, [5, 8, 0, 0]);
  ctx.fillStyle = c.foldTab;
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = c.foldTabHi;
  ctx.fillRect(x, y - 5, 29, 1);
  ctx.restore();
  ctx.fillStyle = c.foldSheet;
  ctx.fillRect(x + 5, y + 2, w - 10, 8);
  const front = ctx.createLinearGradient(0, y + 6, 0, y + h);
  front.addColorStop(0, c.foldFrontA);
  front.addColorStop(1, c.foldFrontB);
  roundRect(ctx, x, y + 6, w, h - 6, [4, 4, 6, 6]);
  ctx.fillStyle = front;
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = c.foldFrontHi;
  ctx.fillRect(x, y + 7, w, 1);
  ctx.restore();
  ctx.strokeStyle = c.foldEdge;
  ctx.lineWidth = 1;
  roundRect(ctx, x + 0.5, y + 6.5, w - 1, h - 7, [3.5, 3.5, 5.5, 5.5]);
  ctx.stroke();
  ctx.restore();
}

function mailIcon(ctx: Ctx, c: IconColors, x: number, y: number) {
  const w = 56;
  const h = 49;
  ctx.save();
  shadow(ctx, "rgba(30, 51, 51, 0.13)", 3, 4);
  const fill = ctx.createLinearGradient(0, y, 0, y + h);
  fill.addColorStop(0, c.contactA);
  fill.addColorStop(1, c.contactB);
  roundRect(ctx, x, y, w, h, 10);
  ctx.fillStyle = fill;
  ctx.fill();
  noShadow(ctx);
  ctx.save();
  ctx.clip();
  ctx.fillStyle = c.contactSheen;
  ctx.fillRect(x, y + 1, w, 1);
  ctx.restore();
  ctx.strokeStyle = c.contactRim;
  roundRect(ctx, x + 0.5, y + 0.5, w - 1, h - 1, 9.5);
  ctx.stroke();
  icon(
    ctx,
    icons.mail,
    x + (w - 36) / 2,
    y + (h - 36) / 2,
    36,
    c.contactGlyph,
    1.1,
  );
  ctx.restore();
}

function drawMenubar(ctx: Ctx, blur: HTMLCanvasElement, locale: Locale) {
  ctx.beginPath();
  ctx.rect(0, 0, VIEW_W, 30);
  glass(ctx, blur, "rgba(27, 27, 38, 0.25)");
  ctx.save();
  ctx.translate(24, 6.5);
  ctx.scale(14 / 20, 17 / 24);
  ctx.fillStyle = "#fff";
  ctx.fill(path(appleMarkPath));
  ctx.restore();
  let x = 61;
  const menu = [strings.finder, strings.contact];
  menu.forEach((label, i) => {
    x +=
      text(ctx, label[locale], x, 15, {
        size: 12,
        weight: i === 0 ? 650 : 400,
        color: "#fff",
      }) + 21;
  });
  const right = VIEW_W - 22;
  const time = formatLocalTime(locale, true);
  const timeWidth = text(ctx, time, right, 15, {
    size: 11,
    color: "#fff",
    align: "right",
  });
  const sliders = right - timeWidth - 17 - 15;
  icon(ctx, icons.slidersHorizontal, sliders, 7.5, 15, "#fff");
  const indicators = sliders - 17 - 52;
  ctx.globalAlpha = 0.95;
  icon(ctx, icons.batteryFull, indicators, 5.5, 19, "#fff");
  icon(ctx, icons.wifi, indicators + 37, 7.5, 15, "#fff");
  ctx.globalAlpha = 1;
  icon(ctx, icons.search, indicators - 17 - 14, 8, 14, "#fff");
}

function drawDesktopFiles(ctx: Ctx, c: IconColors, locale: Locale) {
  const center = 1992 + 105 / 2;
  const label: TextStyle = { size: 11, color: "#fffdf4", align: "center" };
  const items = [
    ...folders.map((f) => ({ kind: f.kind, name: f.file[locale] })),
    { kind: "resume" as const, name: strings.resumeFile[locale] },
  ];
  let y = 65;
  for (const item of items) {
    const top = y + 2;
    let iconHeight = 54;
    if (item.kind === "folder") folderIcon(ctx, c, center - 31, top + 7);
    else if (item.kind === "contact") {
      mailIcon(ctx, c, center - 28, top);
      iconHeight = 49;
    } else paperIcon(ctx, c, center - 21, top, 42, item.kind === "resume");
    const lines = wrap(ctx, item.name, 93, label);
    const labelTop = top + iconHeight + 7;
    ctx.save();
    shadow(ctx, "rgba(31, 41, 45, 0.53)", 4, 1);
    lines.forEach((line, i) => {
      const lineY = labelTop + 3 + 6.5 + i * 13;
      if (item.kind === "resume") {
        // The résumé label carries a small ↗ after the name (3px gap).
        const w = measure(ctx, line, label);
        const start = center - (w + 13) / 2;
        text(ctx, line, start, lineY, { ...label, align: "left" });
        icon(ctx, icons.arrowUpRight, start + w + 3, lineY - 5, 10, "#fffdf4");
      } else text(ctx, line, center, lineY, label);
    });
    ctx.restore();
    y = labelTop + 6 + lines.length * 13 + 2 + 20;
  }
}

function appIcon(
  ctx: Ctx,
  c: IconColors,
  x: number,
  draw: (x: number, y: number) => void,
  fill?: string | CanvasGradient,
) {
  const y = 829;
  const w = 46;
  const h = 48;
  ctx.save();
  roundRect(ctx, x, y, w, h, 12);
  shadow(ctx, "rgba(0, 0, 0, 0.27)", 5, 3);
  ctx.fillStyle = fill ?? "#000";
  ctx.fill();
  noShadow(ctx);
  ctx.save();
  ctx.clip();
  draw(x, y);
  // The top highlight (`inset 0 1px 0`), transparent on light tiles.
  ctx.fillStyle = c.tileSheen;
  ctx.fillRect(x, y + 1, w, 1);
  ctx.restore();
  ctx.strokeStyle = c.tileRim;
  ctx.lineWidth = 1;
  roundRect(ctx, x + 0.5, y + 0.5, w - 1, h - 1, 11.5);
  ctx.stroke();
  ctx.restore();
}

function vertical(ctx: Ctx, top: string, bottom: string) {
  const g = ctx.createLinearGradient(0, 829, 0, 877);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  return g;
}

function ruled(ctx: Ctx, c: IconColors, x: number, y: number) {
  ctx.fillStyle = c.tileLine;
  for (const top of [23, 30, 37]) ctx.fillRect(x + 7, y + top, 32, 1);
}

function drawDock(ctx: Ctx, c: IconColors, blur: HTMLCanvasElement) {
  const x = (VIEW_W - 544) / 2;
  const y = 816.5;
  ctx.save();
  roundRect(ctx, x, y, 544, 73, 23);
  shadow(ctx, "rgba(0, 0, 0, 0.33)", 30, 8);
  ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
  ctx.fill();
  noShadow(ctx);
  glass(ctx, blur, "rgba(0, 0, 0, 0)");
  const sheen = ctx.createLinearGradient(x, y, x + 544, y + 73);
  sheen.addColorStop(0, "rgba(255, 255, 255, 0.23)");
  sheen.addColorStop(1, "rgba(255, 255, 255, 0.1)");
  ctx.fillStyle = sheen;
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.36)";
  roundRect(ctx, x + 0.5, y + 0.5, 543, 72, 22.5);
  ctx.stroke();
  ctx.restore();

  // Items are 58px wide with 4px gaps; dividers sit 5px either side.
  const at = (i: number) => x + 11 + i * 62 + (i > 0 ? 15 : 0) + 6;
  appIcon(
    ctx,
    c,
    at(0),
    (ix) => icon(ctx, icons.house, ix + 10, 840, 26, c.studio[2], 1.7),
    vertical(ctx, c.studio[0], c.studio[1]),
  );
  appIcon(ctx, c, at(1), (ix, iy) => {
    ctx.save();
    ctx.translate(ix - 1, iy);
    ctx.fillStyle = c.finder[0];
    ctx.fill(path(finderIcon.face));
    ctx.fillStyle = c.finder[1];
    ctx.fill(path(finderIcon.light));
    ctx.strokeStyle = c.finder[2];
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.stroke(path(finderIcon.smile));
    ctx.restore();
  });
  const paper = ctx.createLinearGradient(at(2), 829, at(2) + 46, 877);
  paper.addColorStop(0, c.textedit[0]);
  paper.addColorStop(1, c.textedit[1]);
  appIcon(
    ctx,
    c,
    at(2),
    (ix, iy) => {
      ruled(ctx, c, ix, iy);
      ctx.save();
      ctx.translate(ix + 26, iy + 29);
      ctx.rotate((-15 * Math.PI) / 180);
      setFont(ctx, { size: 44, color: c.textedit[2] });
      ctx.fillStyle = c.textedit[2];
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("✎", 0, 0);
      ctx.restore();
    },
    paper,
  );
  appIcon(
    ctx,
    c,
    at(3),
    (ix) => icon(ctx, icons.layoutGrid, ix + 9, 839, 28, c.projects[2], 1.6),
    vertical(ctx, c.projects[0], c.projects[1]),
  );
  appIcon(
    ctx,
    c,
    at(4),
    (ix) =>
      icon(ctx, icons.folder, ix + 6.5, 836.5, 33, c.files[2], 0.8, c.files[3]),
    vertical(ctx, c.files[0], c.files[1]),
  );
  // Notes: a hard-edged strip over the top 28%, then the body gradient.
  const notes = ctx.createLinearGradient(0, 829, 0, 877);
  notes.addColorStop(0, c.notes[0]);
  notes.addColorStop(0.28, c.notes[0]);
  notes.addColorStop(0.28, c.notes[1]);
  notes.addColorStop(1, c.notes[2]);
  appIcon(ctx, c, at(5), (ix, iy) => ruled(ctx, c, ix, iy), notes);
  appIcon(
    ctx,
    c,
    at(6),
    (ix) => icon(ctx, icons.mail, ix + 7, 837, 32, c.mail[2], 1.4),
    vertical(ctx, c.mail[0], c.mail[1]),
  );
  ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
  ctx.fillRect(x + 78, 833, 1, 40);
  ctx.fillRect(x + 465, 833, 1, 40);
  // The résumé tile: the paper icon at 72%.
  ctx.save();
  ctx.translate(x + 489.9, 833.5);
  ctx.scale(0.72, 0.72);
  paperIcon(ctx, c, 0, 0, 39, true);
  ctx.restore();
  // The open About me window's dot.
  ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
  ctx.beginPath();
  ctx.arc(at(2) + 23, 883, 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawWindow(
  ctx: Ctx,
  blur: HTMLCanvasElement,
  portrait: CanvasImageSource,
  p: Palette,
  locale: Locale,
) {
  // `.finder-window` above phone width: 860 × 640, centred horizontally and
  // between the menubar and the Dock.
  const W = 860;
  const H = 640;
  const X = VIEW_W / 2 - W / 2;
  const Y = 30 + (870 - 84) / 2 - H / 2;
  const name = folders.find((f) => f.id === "about")!.name[locale];
  ctx.save();
  roundRect(ctx, X, Y, W, H, 16);
  shadow(ctx, "rgba(0, 0, 0, 0.47)", 100, 32);
  ctx.fillStyle = p.glass;
  ctx.fill();
  noShadow(ctx);
  glass(ctx, blur, p.glass);
  ctx.save();
  ctx.clip();

  // Toolbar and status bar stack a second glass layer on the window's.
  ctx.fillStyle = p.glass;
  ctx.fillRect(X + 1, Y + 1, W - 2, 53);
  ctx.fillRect(X + 1, Y + H - 26, W - 2, 25);
  ctx.fillStyle = p.line;
  ctx.fillRect(X + 1, Y + 53, W - 2, 1);
  ctx.fillRect(X + 1, Y + H - 26, W - 2, 1);

  const lights = ["#ff5f57", "#febc2e", "#28c840"];
  lights.forEach((color, i) => {
    ctx.beginPath();
    ctx.arc(X + 23 + i * 20, Y + 27, 6, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(X + 23 + i * 20, Y + 27, 5.5, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(0, 0, 0, 0.07)";
    ctx.lineWidth = 1;
    ctx.stroke();
  });
  text(ctx, name, X + 171, Y + 27, { size: 13, weight: 650, color: p.ink });
  icon(ctx, icons.panelLeft, X + 672, Y + 19, 16, p.muted);
  icon(ctx, icons.chevronLeft, X + 707, Y + 18, 18, p.muted);
  icon(ctx, icons.chevronRight, X + 744, Y + 18, 18, p.muted);
  icon(ctx, icons.layoutGrid, X + 781, Y + 19, 16, p.muted);
  icon(ctx, icons.search, X + 823, Y + 19, 16, p.muted);

  // Sidebar.
  const sx = X + 11;
  const sectionLabel: TextStyle = { size: 10, weight: 600, color: p.muted };
  text(ctx, strings.favorites[locale], sx + 12, Y + 80, sectionLabel);
  const rows: { label: string; d: string; selected?: boolean; y: number }[] = [
    { label: strings.allFiles[locale], d: icons.layoutGrid, y: 94 },
    ...folders.map((f, i) => ({
      label: f.name[locale],
      d: navIcons[f.id],
      selected: f.id === "about",
      y: 127 + i * 33,
    })),
    { label: strings.studio[locale], d: icons.house, y: 340 },
    { label: strings.resume[locale], d: icons.download, y: 373 },
  ];
  text(ctx, strings.location[locale], sx + 12, Y + 326, sectionLabel);
  for (const row of rows) {
    const top = Y + row.y;
    if (row.selected) {
      roundRect(ctx, sx, top, 150, 31, 7);
      ctx.fillStyle = p.selected;
      ctx.fill();
    }
    icon(ctx, row.d, sx + 10, top + 8, 15, row.selected ? "#fff" : "#1684ed");
    text(ctx, row.label, sx + 35, top + 15.5, {
      size: 12,
      weight: row.selected ? 600 : 400,
      color: row.selected ? "#fff" : p.ink,
    });
  }
  ctx.fillStyle = "#7b926b";
  ctx.beginPath();
  ctx.arc(sx + 10.5, Y + 588.5, 2.5, 0, Math.PI * 2);
  ctx.fill();
  text(ctx, strings.workspace[locale], sx + 19, Y + 588.5, {
    size: 9,
    color: p.muted,
  });

  // Status bar.
  const status: TextStyle = { size: 9, color: p.muted };
  const sy = Y + H - 13.5;
  icon(ctx, icons.folder, X + 15, sy - 5.5, 11, p.muted);
  let cx = X + 33;
  cx += text(ctx, profile.name, cx, sy, status) + 7;
  icon(ctx, icons.chevronRight, cx, sy - 5, 10, p.muted);
  text(ctx, name, cx + 17, sy, status);
  text(ctx, strings.madeWithCare[locale], X + W - 15, sy, {
    ...status,
    align: "right",
  });

  // The About me document.
  const content = { x: X + 171, y: Y + 54, w: 688, h: 560 };
  ctx.beginPath();
  ctx.rect(content.x, content.y, content.w, content.h);
  ctx.fillStyle = p.surface;
  ctx.fill();
  ctx.clip();
  drawAbout(ctx, portrait, p, locale, content.x + 34, content.y + 30);
  ctx.restore();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.27)";
  ctx.lineWidth = 1;
  roundRect(ctx, X + 0.5, Y + 0.5, W - 1, H - 1, 15.5);
  ctx.stroke();
  ctx.restore();
}

function drawAbout(
  ctx: Ctx,
  portrait: CanvasImageSource,
  p: Palette,
  locale: Locale,
  x: number,
  top: number,
) {
  const width = 620;
  let y = top;
  ctx.save();
  roundRect(ctx, x, y, 104, 104, 25);
  shadow(ctx, "rgba(0, 0, 0, 0.05)", 8, 2);
  ctx.fillStyle = p.surface;
  ctx.fill();
  noShadow(ctx);
  ctx.clip();
  const { width: iw, height: ih } = portrait as HTMLImageElement;
  const side = Math.min(iw, ih);
  ctx.drawImage(
    portrait,
    (iw - side) / 2,
    (ih - side) / 2,
    side,
    side,
    x,
    y,
    104,
    104,
  );
  ctx.restore();
  y += 104 + 24;

  text(ctx, copy.aboutEyebrow[locale], x, y + 7.5, {
    size: 10,
    color: p.muted,
    spacing: 0.15,
  });
  y += 15 + 9;
  const heading: TextStyle = {
    size: 32,
    weight: 500,
    color: p.ink,
    spacing: -1.3,
  };
  for (const line of wrap(ctx, profile.introduction[locale], width, heading)) {
    text(ctx, line, x, y + 18.08, heading);
    y += 36.16;
  }
  y += 15;
  const lead: TextStyle = { size: 13, color: p.muted };
  for (const line of wrap(ctx, profile.bio[locale], width, lead)) {
    text(ctx, line, x, y + 12.02, lead);
    y += 24.05;
  }
  y += 20;
  icon(ctx, icons.mapPin, x, y, 14, p.muted);
  text(ctx, copy.locationNote[locale], x + 19, y + 7, {
    size: 9,
    color: p.muted,
  });
  y += 14 + 25;
  ctx.fillStyle = p.line;
  ctx.fillRect(x, y, width, 1);
  y += 1 + 25;
  const h3: TextStyle = { size: 14, weight: 600, color: p.ink };
  text(ctx, copy.craftHeading[locale], x, y + 8.5, h3);
  y += 17 + 12;
  const body: TextStyle = { size: 12, color: p.muted };
  for (const line of wrap(ctx, copy.craftBody[locale], width, body)) {
    text(ctx, line, x, y + 10.8, body);
    y += 21.6;
  }
  y += 23;
  text(ctx, copy.skillsHeading[locale], x, y + 8.5, h3);
  y += 17 + 12;
  const chip: TextStyle = { size: 10, color: p.muted, align: "center" };
  let cx = x;
  for (const skill of skills) {
    const w = measure(ctx, skill[locale], chip) + 18;
    if (cx > x && cx + w > x + width) {
      cx = x;
      y += 32;
    }
    roundRect(ctx, cx, y, w, 26, 4);
    ctx.fillStyle = p.glass;
    ctx.fill();
    roundRect(ctx, cx + 0.5, y + 0.5, w - 1, 25, 3.5);
    ctx.strokeStyle = p.line;
    ctx.lineWidth = 1;
    ctx.stroke();
    text(ctx, skill[locale], cx + w / 2, y + 13, chip);
    cx += w + 6;
  }
}

export function paintScreenTexture({
  wallpaper,
  portrait,
  dark,
  locale,
}: {
  wallpaper: CanvasImageSource;
  portrait: CanvasImageSource;
  dark: boolean;
  locale: Locale;
}): THREE.CanvasTexture {
  return textureFromCanvas(
    (ctx) => {
      ctx.scale(SCALE, SCREEN_HEIGHT / VIEW_H);
      drawWallpaper(ctx, wallpaper);
      const blur = blurredCopy(ctx.canvas);
      drawMenubar(ctx, blur, locale);
      const iconSet = dark ? iconColors.dark : iconColors.light;
      drawDesktopFiles(ctx, iconSet, locale);
      drawWindow(
        ctx,
        blur,
        portrait,
        dark ? palettes.dark : palettes.light,
        locale,
      );
      drawDock(ctx, iconSet, blur);
    },
    SCREEN_WIDTH,
    SCREEN_HEIGHT,
  );
}
