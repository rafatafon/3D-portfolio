const stops = [
  {
    background: "#f5f5f3",
    light: "#fff7ed",
    fill: "#e9f0ff",
    intensity: 3.2,
    ambient: 1.1,
  },
  {
    background: "#caa477",
    light: "#ffb959",
    fill: "#e6b679",
    intensity: 4.1,
    ambient: 0.65,
  },
  {
    background: "#17191e",
    light: "#dbe4ff",
    fill: "#7d91b7",
    intensity: 2.4,
    ambient: 0.32,
  },
];

function mixHex(a: string, b: string, t: number) {
  const channel = (hex: string, i: number) => parseInt(hex.slice(i, i + 2), 16);
  return (
    "#" +
    [1, 3, 5]
      .map((i) =>
        Math.round(channel(a, i) + (channel(b, i) - channel(a, i)) * t)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}

function luminance(hex: string) {
  const channels = [1, 3, 5].map((i) => {
    const value = parseInt(hex.slice(i, i + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrast(a: string, b: string) {
  const x = luminance(a),
    y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

export function getAmbience(value: number) {
  const v = Math.max(0, Math.min(100, value)) / 50;
  const a = stops[v <= 1 ? 0 : 1],
    b = stops[v <= 1 ? 1 : 2],
    t = v <= 1 ? v : v - 1;
  const background = mixHex(a.background, b.background, t);
  const preferred = ["#292622", "#f0eeea"].sort(
    (x, y) => contrast(background, y) - contrast(background, x),
  )[0];
  const ink =
    contrast(background, preferred) >= 4.5
      ? preferred
      : luminance(background) > 0.179
        ? "#000000"
        : "#ffffff";
  let opacity = 0.72;
  let muted = mixHex(background, ink, opacity);
  while (contrast(background, muted) < 4.5 && opacity < 1) {
    opacity = Math.min(1, opacity + 0.02);
    muted = mixHex(background, ink, opacity);
  }
  return {
    background,
    ink,
    muted,
    light: mixHex(a.light, b.light, t),
    fill: mixHex(a.fill, b.fill, t),
    intensity: a.intensity + (b.intensity - a.intensity) * t,
    ambient: a.ambient + (b.ambient - a.ambient) * t,
    label:
      value < 25 ? "Daylight" : value < 75 ? "Warm & quiet" : "After hours",
  };
}
