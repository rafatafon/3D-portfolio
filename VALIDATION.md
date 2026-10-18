# Local validation — 2026-10-18

## Build

- `npm run typecheck`: passed.
- `npm run build`: passed after the scene, camera, desktop, and ambient contrast changes. `/`, `/portfolio`, `/_not-found`, and `/icon.svg` prerender successfully.
- Application source formatted with Prettier 3.6.2.

## Browser checks

Checked in Chromium through Playwright, using isolated browser contexts so session state and user browsing do not affect the checks.

### Arrival

- Animated fm. preloader is visible while the scene loads.
- Camera intro begins after rendering readiness and finishes in the room state.
- Monitor begins dark and wakes during the camera glide (visually inspected).
- Completed intro is remembered within the session; repeat visits bypass the glide.
- Skip immediately reveals the workspace.
- Reduced motion bypasses the intro and entry transitions.
- Fixed an issue where an immediate camera move needed explicit demand-frame invalidation; verified the final camera and 3D click targets after the fix.

### Workspace and desktop

- Default ambient value is 0 (white); slider dragging and arrow keys work.
- Warm and dark preset buttons work and the selected value survives desktop entry/exit.
- Primary and secondary text contrast checked against the backdrop at all 101 integer slider values: minimum ratio 4.50036:1.
- Standing desk raises and lowers.
- Both the 3D AirPods and the keyboard-accessible music button open the listening note.
- The 3D monitor and HTML entry button open the desktop.
- Desktop inherits dark appearance from dark ambience; its display setting toggles light/dark.
- About opens initially; Projects opens through the Dock with five projects.
- Window maximize, restore, drag, minimize, and Dock restore work.
- Keyboard search filters to Contact and preserves the correct mailto link.
- Standard desktop checks produced no page runtime errors.

### Mobile and fallbacks

- Inspected at 390 × 844 with touch emulation and reduced motion; no horizontal overflow.
- Refined camera framing makes the desk readable on mobile.
- Finder fits the viewport; folder navigation, minimization, and Dock restore work.
- Empty search feedback and Escape dismissal work.
- Standard mobile checks produced no page runtime errors.
- With WebGL context creation disabled, the scene failure notice appears and the HTML desktop is usable.
- With JavaScript disabled, the noscript link opens `/portfolio`, where all five projects are server rendered.

Screenshots from the checks are in `.playwright-mcp/` (ignored local artifacts). This is browser emulation, not verification on a physical phone or Safari.

## Remaining limitations

- The supplied wallpaper is only 235 × 152 pixels. It is used unchanged and needs a full-resolution replacement.
- The hardware models are original procedural interpretations, not exact manufacturer models.
- The public LinkedIn project dates were corrected. Full About and employment-history updates await a profile export or pasted sections.
- Spotify is intentionally not integrated; the listening note is a placeholder until the playlist and playback behavior are specified.
- Existing article and résumé links still depend on the old website/Framer-hosted files.
- A nonfatal `THREE.Clock` deprecation warning originates from the installed React Three Fiber version. There are no application runtime errors in the normal tested flows.
- No deployment, Git repository initialization, commit, push, or domain modification was performed.
