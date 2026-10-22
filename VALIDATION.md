# Local validation — 2026-10-18

## Build

- `npm run typecheck`: passed.
- `npm run build`: passed after the scene, camera, desktop, and ambient contrast changes. `/`, `/portfolio`, `/_not-found`, `/icon.svg`, and all four `/writing/[slug]` pages prerender successfully.
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
- Desk height keypad (toolbar arrows button): hold an arrow to run the motor, tap for 1 cm, presets travel, S then a number saves a preset; the desk moves at motor speed and the on-desk display counts along.
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

## Annotation fixes

- Chair enlarged uniformly by 12%, anchored at the floor and positioned clear of the desk.
- AirPods rebuilt with beveled aluminum shells, recessed fabric cushions, a fine mesh canopy, telescoping stems, crown/button details, an elliptical base, and a curved cradle below the headband. Inspected from close front/side and overhead angles; corrected the post-to-cradle connection during review.
- Supplied portrait loads successfully in About; inspected at desktop and phone sizes.
- The 1200 × 2596 wallpaper is displayed horizontally using its original resolution; inspected in the desktop and on the laptop/monitor.
- All five employment entries checked against the authenticated LinkedIn profile on 2026-10-18. Próspera is Aug–Oct 2026 exactly as displayed in the source; no assumption of a current role.
- Each imported article's full text matches the published HTML after whitespace normalization and removal of empty embedded widgets.
- All four articles open inside Notes; headings receive focus on opening, and Back restores focus to the originating note.
- All four Notes render and scroll on a 390 × 844 emulated phone with no horizontal overflow or runtime errors.
- Notes also opens with Enter from the list and renders correctly in the inherited dark desktop appearance.
- All four static article routes return 200 with JavaScript disabled; an unknown slug returns 404.

## Remaining limitations

- The hardware models are original procedural interpretations, not exact manufacturer models.
- Spotify is intentionally not integrated; the listening note is a placeholder until the playlist and playback behavior are specified.
- The résumé PDF still depends on the existing Framer-hosted asset. Articles are now local.
- React Three Fiber 9 still constructs the deprecated `THREE.Clock`. `StudioScene.tsx` routes three's console output through `THREE.setConsoleFunction` and drops only that one warning; everything else three logs still reaches the console. There are no application runtime errors in the normal tested flows.
- No deployment, Git repository initialization, commit, push, or domain modification was performed.

## Camera freedom — 2026-10-18, second pass

- The scene canvas now fills the viewport. An invisible `.scene-frame` box keeps the default framing (desk right of center on desktop, mid-band on phones) through a camera view offset, so zooming to the minimum distance and orbiting no longer crop the model at the old canvas edge.
- Horizontal orbit is unrestricted (360°). Tilt runs from near top-down (0.15 rad) to just above the floor (1.5 rad). Reset view returns by the short path after free orbiting.
- On phones the intro text block accepts touch, so short viewports can still scroll past the full-screen canvas.
- Checked headless in Chromium at 1440 × 900 and 390 × 844: default framing unchanged; zoomed, rotated, top-down, and floor-level views uncropped; reset view; desktop entry; mobile orbit and zoom. No page errors.
- The monitor only enters the desktop while its screen faces the camera (click ray within about 65° of the screen axis). From behind or edge-on, the cursor stays plain and clicks on the back panel or stand do nothing. Checked headless: behind → stays in the room; front and default views → pointer cursor and desktop entry; edge-on side → stays in the room.
- The monitor is opaque to pointer events: it stops propagation before the facing check, so a click (or hover) on its back never reaches the headphones behind it. Camera presets (reset, enter, leave) aim for the equivalent azimuth nearest the current one; simulated with camera-controls from an azimuth of -3 rad, reset now travels 149° instead of 211°.

## Owala and coffee mug — 2026-10-19

- `npm run typecheck`, the Prettier check, and `npm run build` pass; `/`, `/portfolio`, `/_not-found`, `/icon.svg`, and the four `/writing/[slug]` pages prerender.
- The Owala is rebuilt from the supplied FreeSip references: straight matte-teal body, pale collar ring embossed with the wordmark, gray bullet lid, periwinkle flip cap with its push button and hinge pin, flat teal carry loop leaning back behind the cap, and the wordmark printed low on the body reading upward. The palette entry in `DESIGN.md` is now Owala teal `#3a7c8e`.
- The bottle stands at the front-right corner of the desk (`[1.64, 1.683, 0.38]`), to the right of a new off-white ceramic mug with a C handle and a visible coffee surface (`[1.3, 1.683, -0.05]`), which sits between the mouse and the headphone stand. Both are inside the desk-top group, so they rise with the standing desk.
- Clearances in scene units, from the geometry: mug to bottle 0.14; mug body to mouse 0.22 and handle tip to mouse 0.2; mug off the desk mat by 0.19; mug to the headphone-stand base 0.15; bottle to the flat desk top's right and front edges 0.045 and 0.05. Nothing touches.
- Checked headless in Chrome (Playwright core driving the installed browser) at 1440 × 900 from the home view, maximum zoom, orbited right, desk level, and overhead, and at 390 × 844: both objects render with no page errors.
- Known trade-off: from the home camera the bottle's lid overlaps part of the headphones' left ear cup in projection, because the front-right corner lies on the camera's line to the stand. The headphones stay clickable on the right cup, headband, and stand; moving the bottle to x ≈ 1.3 would clear the overlap.

## Package manager switch to pnpm — 2026-10-22

- The project now installs with pnpm; the version is pinned under `packageManager` in `package.json` and `pnpm-lock.yaml` replaces `package-lock.json`. The lockfile was produced with `pnpm import`, so every resolved version is unchanged.
- `pnpm install --frozen-lockfile` completes with no blocked build scripts, `pnpm typecheck` and `pnpm dlx prettier@3.6.2 --check src` pass, and `pnpm build` prerenders `/`, `/portfolio`, `/_not-found`, `/icon.svg`, and the four `/writing/[slug]` pages.
- `pnpm dev` serves `/`, `/portfolio`, and an article page with HTTP 200 and no console warnings.
- CI (`.github/workflows/ci.yml`) installs pnpm through `pnpm/action-setup`, caches the pnpm store, and runs the same three checks with `--frozen-lockfile`.

## Simplified room interface — 2026-10-22

- Removed from the room overlay: the top-right "Selected work" and "Say hello" buttons, the small "Welcome to my workspace" label, the "Things I build. The space I build them in." paragraph, and the "Just here for the portfolio?" link under the Explore button. `/portfolio` stays reachable from the preloader's "Open simple portfolio" link and the noscript fallback. Their CSS rules were removed from every layer and breakpoint.
- The title now reads "Welcome to my / workspace." and is one size step smaller: `clamp(40px, 3.6vw, 56px)` with -3px tracking on desktop, 43px at ≤ 1100px wide and on short (≤ 740px tall) screens, and 34px with -2px tracking on phones (≤ 720px). The page title and Open Graph title are "Fredy Maldonado — Welcome to my workspace".
- `pnpm dlx prettier@3.6.2 --write src`, `pnpm typecheck`, and `pnpm build` pass; `/`, `/portfolio`, `/_not-found`, `/icon.svg`, and the four `/writing/[slug]` pages prerender.
- Checked headless in Chrome at 1440 × 900 (52px), 1100 × 800 (43px), 900 × 700 (43px), and 390 × 844 (34px): the title sits on exactly two lines without overflowing its column, the Explore button sits 30px under it (24px on short screens), the header shows only the identity, and the phone's fixed Explore button keeps clear space above the mood slider. No page or console errors.

## Collapsible side panel — 2026-10-22

- A round toggle sits just right of the title's first line ("Welcome to my"); Workspace measures the line with layout offsets (which ignore transforms) and seats it through `--toggle-x/y`. It is one persistent button with `aria-expanded`, `aria-controls` (identity, title, dock), and an `aria-label`/`title` that flips between "Hide the side panel" and "Show the side panel".
- Collapse: `.panel-hidden` on `.workspace` slides the identity, the introduction (title and Explore button), and the mood slider left past the viewport edge with a fade, in 0.62s on `cubic-bezier(0.22, 1, 0.36, 1)` with a 35/70ms stagger (done by 0.69s). `.scene-frame` goes from `left: 19%; width: 81%` to full width on the same curve, so the desk glides to the center; the scene hint stays centered in the footer, and the toggle travels to the shared left gutter on the title's row. Hidden groups become `visibility: hidden` at the end and are `inert`. Expanding reverses it on the same ease-out curve.
- Camera tracking: `CameraRig` listens for `transitionrun` on `.scene-frame`, re-applies the view offset inside R3F's frame (before render, so the desk moves in the same frame as the CSS) and keeps invalidating only while a frame transition runs. It stops on `transitionend`/`transitioncancel` (or after 1.5s) with one final apply, so the demand loop goes idle again.
- Phones (≤ 720px): the identity and title slide up and out, the mood slider slides down and fades, the Explore button and footer stay put (only the title wrapper is transformed, never the section that contains the fixed button), and the toggle docks at the top-left where the fm. mark was, its icon turned to point up/down. `.scene-frame` grows from `top: 27%; height: 48%` to `top: 14%; height: 53%`; larger frames push the desk past the 390px width.
- Desktop entry while collapsed: the frame stays full width in every mode, so the zoom into the monitor ends centered and leaving returns to the collapsed room without a jump. Returning from the desktop now focuses the room after it renders (the overlay is inert until then): the Explore button, or the toggle when the panel is collapsed on desktop/tablet.
- Reduced motion: transitions, stagger, and the visibility delay all drop to zero, so the panel swaps in a single frame and the camera offset ends correct.
- Not persisted: every load starts expanded.
- `pnpm dlx prettier@3.6.2 --write src`, `pnpm typecheck`, and `pnpm build` pass.
- Checked headless in Chrome at 1440 × 900, 900 × 700, 390 × 844 (touch), and 1440 × 900 with reduced motion: frames at 120ms and 300ms show the groups partly out and the desk partway; collapsed, the frame is the full viewport and the desk sits centered with the toggle docked; the re-expanded 1440 frame is pixel-identical to the first capture. Entering through the monitor and leaving with "Back to studio" keeps `panel-hidden`. Keyboard: Enter on the focused toggle keeps focus on it and flips `aria-expanded`. No page or console errors.
- Resizing the window re-measures the title and re-seats the toggle instantly (the transition is suspended for that update), so only a toggle click animates the button.

## Overlay layout pass — 2026-10-22

- One left gutter: `--edge` (4.4%, 24px on phones, 20px under 390px) and `--edge-y` (36px, 24px on phones and short screens) on `.workspace` position the identity header, the introduction, the new `.room-dock`, and the footer, so their left edges line up and the top and bottom margins match.
- The introduction is a full-height flex column centered vertically, so the title and Explore button sit at mid-height on desktop and tablet; phones keep the block at the top. The collapse animation is unchanged because the centering uses layout, not a transform.
- The workspace toolbar (reset view, raise desk, listening corner) moved out of the footer into `.room-dock`, above the mood slider, one gutter above the footer. The dock slides out with the panel. On phones (`compact`, ≤ 720px) the toolbar renders in the footer as before, because the slider is centered at the bottom under the fixed Explore button.
- The drag hint ("Drag to look around…") now lives in the footer's middle column (`grid-template-columns: 1fr auto 1fr`), centered between the location/time and "Make yourself at home." (which is hidden ≤ 1100px); it stays centered when the panel collapses. Phones keep the hint hidden and a flex footer.
- The docked toggle lands on the gutter through `--dock-x`, measured with the title. On phones it docks at the top-left corner on the same gutter.
- `pnpm typecheck`, the Prettier check, and `pnpm build` pass. Headless Chrome at 1440 × 900, 1100 × 800, 900 × 700, and 390 × 844 (touch): collapse, expand, desktop entry, and return all work with no page or console errors; the docked toggle sits at x = 63 on 1440 (the 4.4% gutter), and the phone footer keeps the toolbar at the right.

## Desk height controller — 2026-10-22

- The toolbar's desk button (`aria-haspopup="dialog"`) opens a dark keypad at the bottom centre of the page, above the footer's drag hint (phones keep it centered over the desk area): a CSS seven-segment LED readout in cm, up and down keys, presets 1–3, and S. It scales in over 0.28s, drags by its body (keys excluded) and stays inside the page, and closes only on the X, Escape, or the toolbar button; focus moves into the dialog on open and back to the toolbar button on close, Tab cycles inside it, and ArrowUp/ArrowDown nudge 1 cm.
- Motion: holding an arrow sets the target to the range limit (70–120 cm) and the desk travels at 12.7 cm/s (about 3 s from sitting at 74 cm to standing at 112 cm); releasing stops at the current height, and a press under 220 ms nudges 1 cm instead. Presets travel on their own. The tween runs inside `Desk`'s `useFrame`, moving the desk-top group and scaling the upper leg segments imperatively, and requests the next frame with `invalidate()` only while moving. Under reduced motion the desk snaps on the next frame.
- The keypad readout updates every 0.5 cm during travel and shows the exact height at rest; the small display on the desk's front edge mirrors whole centimeters. The desktop camera eye uses the target height; contact shadows re-bake when the desk settles.
- Presets default to 74 / 95 / 112 cm. Press S (it lights up), then a number, to store the current whole-cm height there; the readout shows `S-n` for 0.9s and the three values are kept in `localStorage` (`fm-desk-presets-v1`, validated on load). Tapping a preset while not arming travels to it.
- Checked headless in Chrome at 1440 × 900 and 390 × 844 (touch): a 1.2s hold raises from 74 to about 93 cm, a tap lowers 1 cm, preset 3 reaches 112.0, S then 2 stores `[74,112,112]`, preset 1 returns to 74.0, Escape closes with focus on "Desk height". No page or console errors. `pnpm typecheck`, the Prettier check, and `pnpm build` pass.
- Phones stack the display above the keys so the keypad fits inside the 24px gutters.

## Draggable keypad and steady camera — 2026-10-22

- The keypad drags from anywhere on its dark body or LED display (keys and the X excluded): pointer capture on the dialog, the offset applied through `--remote-dx/dy` on top of the centred base position, clamped to keep the whole panel at least 8px inside the workspace, re-clamped on window resize, and kept for the rest of the visit so it reopens where it was left. A dotted grip marks the drag area; the cursor shows grab/grabbing. Clicks and drags on the scene no longer close it, so orbiting with the keypad open works; the X, Escape (listened for on the document, so it works after focus has moved to the scene), and the toolbar button close it.
- Changing the desk height no longer moves the camera. `CameraRig` reads the height through a ref for the desktop eye level instead of listing it as an effect dependency, so arrows and presets only move the desk and the view stays at whatever angle and zoom the visitor has, including from behind the desk.
- Checked headless in Chrome at 1440 × 900: after orbiting the camera, preset 3 raises the desk with the view unchanged; dragging the keypad by its display moves it by the drag distance; a drag far past the edge stops at the margin; clicking the scene leaves it open; Escape closes it with focus on "Desk height"; reopening from the toolbar restores the dragged position. 390 × 844 (touch): open, drag, and close work inside the gutters. No page or console errors.

## Keypad placement and the desk's own controller — 2026-10-22

- The keypad now opens bottom-centre on desktop and tablet, 44px above the footer line that holds the drag hint (`bottom: calc(var(--edge-y) + 44px)`), horizontally centered on the viewport so it no longer shifts when the side panel collapses. Phones keep the previous spot over the desk area. Dragging still works from there and the position is kept for the visit.
- The small controller under the desk's front-right edge (the dark box with the light-blue readout) is clickable in the 3D scene: it shows a pointer cursor and opens the keypad, through an invisible hit box slightly larger than the part. Only the room mode reacts; clicks during the intro or inside the desktop do nothing.
- Checked headless in Chrome at 1440 × 900: hovering the controller turns the cursor into a pointer, clicking it opens the keypad bottom-centre (centered on x = 720, 80px above the bottom edge), the toolbar button still opens it, and at 390 × 844 it still opens centered over the desk. No page or console errors.
