import type { Localized } from "./i18n";

// Room overlay, keypad, and preloader copy. The desktop keeps its own strings;
// portfolio content lives in content.ts.
type Text = Localized;
type Format<A extends unknown[]> = Localized<(...args: A) => string>;

// getAmbience() labels the mood in English; this maps each label for display.
const moods: Record<string, Text> = {
  Daylight: { en: "Daylight", es: "Luz del día" },
  "Warm & quiet": { en: "Warm & quiet", es: "Cálido y tranquilo" },
  "After hours": { en: "After hours", es: "Fuera de horario" },
};

export const moodLabel = (label: string): Text =>
  moods[label] ?? { en: label, es: label };

export const room = {
  documentTitle: {
    en: "Fredy Maldonado — Welcome to my workspace",
    es: "Fredy Maldonado — Bienvenido a mi espacio de trabajo",
  },
  home: { en: "Fredy Maldonado home", es: "Inicio de Fredy Maldonado" },
  role: { en: "Software engineer", es: "Ingeniero de software" },
  // The title keeps two lines; the panel toggle sits after the first.
  titleFirst: { en: "Welcome to my", es: "Bienvenido a mi" },
  titleSecond: { en: "workspace.", es: "espacio de trabajo." },
  explore: { en: "Explore my desktop", es: "Explora mi escritorio" },
  controls: { en: "Workspace controls", es: "Controles del espacio" },
  resetLabel: { en: "Reset camera view", es: "Restablecer la vista" },
  resetTitle: { en: "Reset view", es: "Restablecer vista" },
  deskHeight: { en: "Desk height", es: "Altura del escritorio" },
  showPanel: { en: "Show the side panel", es: "Mostrar el panel lateral" },
  hidePanel: { en: "Hide the side panel", es: "Ocultar el panel lateral" },
  mood: { en: "Set the mood", es: "Elige el ambiente" },
  lighting: { en: "Ambient lighting", es: "Iluminación ambiental" },
  moodValue: {
    en: (label: string, value: number) => `${label}, ${value} percent`,
    es: (label: string, value: number) => `${label}, ${value} por ciento`,
  } satisfies Format<[string, number]>,
  stops: [
    {
      label: { en: "Light", es: "Claro" },
      aria: { en: "Set daylight ambience", es: "Usar luz del día" },
    },
    {
      label: { en: "Warm", es: "Cálido" },
      aria: { en: "Set warm ambience", es: "Usar ambiente cálido" },
    },
    {
      label: { en: "Dark", es: "Oscuro" },
      aria: { en: "Set dark ambience", es: "Usar ambiente oscuro" },
    },
  ] satisfies { label: Text; aria: Text }[],
  location: { en: "Honduras", es: "Honduras" },
  hint: {
    en: "Drag to look around. Click the screen to step inside.",
    es: "Arrastra para mirar alrededor. Haz clic en la pantalla para entrar.",
  },
  welcome: { en: "Make yourself at home.", es: "Siéntete como en casa." },
  webglReady: { en: "The desktop is ready.", es: "El escritorio está listo." },
  webglFailed: {
    en: "This browser couldn't open the 3D workspace.",
    es: "Este navegador no pudo abrir el espacio 3D.",
  },
  loading: { en: "Getting the desk ready", es: "Preparando el espacio" },
  introCaption: { en: "A little of my world.", es: "Un poco de mi mundo." },
} as const;

export const keypad = {
  dialog: {
    en: "Desk height controller",
    es: "Control de altura del escritorio",
  },
  reading: {
    en: (cm: string) => `${cm} centimeters`,
    es: (cm: string) => `${cm} centímetros`,
  } satisfies Format<[string]>,
  saved: {
    en: (slot: number) => `Saved preset ${slot}`,
    es: (slot: number) => `Memoria ${slot} guardada`,
  } satisfies Format<[number]>,
  raise: { en: "Raise desk", es: "Subir el escritorio" },
  lower: { en: "Lower desk", es: "Bajar el escritorio" },
  raiseTitle: {
    en: "Hold to raise, tap for 1 cm",
    es: "Mantén presionado para subir, toca para 1 cm",
  },
  lowerTitle: {
    en: "Hold to lower, tap for 1 cm",
    es: "Mantén presionado para bajar, toca para 1 cm",
  },
  storeIn: {
    en: (slot: number) => `Save current height as preset ${slot}`,
    es: (slot: number) => `Guardar la altura actual en la memoria ${slot}`,
  } satisfies Format<[number]>,
  preset: {
    en: (slot: number, cm: number) => `Preset ${slot}, ${cm} centimeters`,
    es: (slot: number, cm: number) => `Memoria ${slot}, ${cm} centímetros`,
  } satisfies Format<[number, number]>,
  storeTitle: { en: "Save here", es: "Guardar aquí" },
  save: {
    en: "Save a preset: press S, then 1, 2, or 3",
    es: "Guardar una memoria: presiona S y luego 1, 2 o 3",
  },
  saveTitle: { en: "Save preset", es: "Guardar memoria" },
  close: {
    en: "Close desk controller",
    es: "Cerrar el control del escritorio",
  },
} as const;
