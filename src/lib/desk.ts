// Standing-desk height model shared by the keypad (HTML) and the 3D desk.
// Heights are in centimetres, as shown on the controller's display.

export const DESK_MIN = 70;
export const DESK_MAX = 120;
export const DESK_SIT = 74;
export const DESK_STAND = 112;
/** Motor speed in cm per second: roughly three seconds from sitting to standing. */
export const DESK_SPEED = 12.7;
export const DEFAULT_PRESETS: [number, number, number] = [74, 95, 112];

export function clampHeight(cm: number) {
  return Math.min(DESK_MAX, Math.max(DESK_MIN, cm));
}

/** Rise of the desk top in scene units for a height in cm (0 when sitting). */
export function deskOffset(cm: number) {
  return ((cm - DESK_SIT) / (DESK_STAND - DESK_SIT)) * 0.48;
}
