"use client";

// A seven-segment readout drawn with CSS bars, so the desk keypad shows its
// height like a real controller without shipping a display font.
const SEGMENTS: Record<string, number> = {
  "0": 0b0111111,
  "1": 0b0000110,
  "2": 0b1011011,
  "3": 0b1001111,
  "4": 0b1100110,
  "5": 0b1101101,
  "6": 0b1111101,
  "7": 0b0000111,
  "8": 0b1111111,
  "9": 0b1101111,
  "-": 0b1000000,
  S: 0b1101101,
  " ": 0,
};
const NAMES = ["a", "b", "c", "d", "e", "f", "g"];

export default function SevenSegment({ text }: { text: string }) {
  const digits: { bits: number; dot: boolean }[] = [];
  for (const char of text) {
    if (char === "." && digits.length) digits[digits.length - 1].dot = true;
    else digits.push({ bits: SEGMENTS[char] ?? 0, dot: false });
  }
  return (
    <span className="seg" aria-hidden="true">
      {digits.map((digit, index) => (
        <span key={index} className="seg-digit">
          {NAMES.map((name, bit) => (
            <i
              key={name}
              className={`seg-${name}${digit.bits & (1 << bit) ? " on" : ""}`}
            />
          ))}
          <b className={`seg-dot${digit.dot ? " on" : ""}`} />
        </span>
      ))}
    </span>
  );
}
