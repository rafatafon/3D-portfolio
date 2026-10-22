// Timings for entering and leaving the desktop, in milliseconds. The CSS in
// globals.css (room overlay fade, transition shade, desktop-in/out) is tuned
// to these; change them together.

// "entering" lasts this long before the desktop mounts.
export const ENTER_MS = 1200;
// The camera's flight to the screen; the shade covers its last stretch.
export const ENTER_FLIGHT_MS = 1100;
// "leaving" lasts this long before the room overlay returns.
export const LEAVE_MS = 1000;
// The pull-back starts once the shade has hidden the desktop and ends with
// the mode change.
export const LEAVE_FLIGHT_DELAY_MS = 150;
export const LEAVE_FLIGHT_MS = 850;

// Cubic ease-in-out: starts and ends at rest.
export const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
