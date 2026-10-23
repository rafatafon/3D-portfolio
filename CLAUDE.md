# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Fredy Maldonado's personal portfolio. Next.js 16 App Router, React 19, strict TypeScript. The home page is an interactive 3D desk (React Three Fiber + drei + three) that leads into a macOS-style HTML "desktop" holding the portfolio content. Local only: no deployment, database, email service, or env vars are configured.

Next.js 16 differs from older versions (see `AGENTS.md`). Read the relevant guide in `node_modules/next/dist/docs/` before writing Next-specific code.

## Commands

```sh
pnpm install
pnpm dev          # http://127.0.0.1:3000 (binds 127.0.0.1, not localhost)
pnpm typecheck    # tsc --noEmit
pnpm build        # must pass; prerenders / and /writing/[slug]
pnpm dlx prettier@3.6.2 --write src   # source follows Prettier 3.6.2 defaults; not a dependency, no config
```

The package manager is pnpm, pinned under `packageManager` in `package.json`; `pnpm-lock.yaml` is the only lockfile, so do not add a `package-lock.json`. There is no test runner or lint script. Verification is `typecheck` + `build`, then a browser pass over the flows in `VALIDATION.md`.
CI (`.github/workflows/ci.yml`) runs typecheck, the Prettier check, and the build on pull requests and pushes to `main`.

## Architecture

**Two routes, one content source.**
- `/` → `src/components/Workspace.tsx` (client): 3D scene + HTML desktop. The `noscript` fallback is plain text; there is no readable fallback route (the former `/portfolio` page was removed deliberately and must not come back).
- `/writing/[slug]` → static article pages (`dynamicParams = false`), opened from the desktop's Notes and linking back to `/`.

All copy lives in `src/lib/content.ts` (profile, projects, experience, skills, `folders`) and `src/lib/writing.json` (articles as a `{tag, children}` node tree rendered by `ArticleBody.tsx` through a tag allowlist). Every surface reads from these two files; edit content there, not in components.

**Home-page state machine** (owned by `Workspace.tsx`): `SceneMode` = `loading → intro → room → entering → desktop → leaving`. The mode is passed to `StudioScene` (camera choreography in `CameraRig`) and applied as class `mode-<name>` on `.workspace` for CSS transitions. `Desktop` mounts in `desktop` and `leaving` modes (inert and fading out while leaving). Reduced motion, a failed renderer, or the `sessionStorage` intro flag collapse the animated states to immediate ones.

**Ambience** is a single 0–100 number. `getAmbience()` in `src/lib/ambience.ts` interpolates three palette stops and feeds both the Three.js lights in `StudioScene` and the CSS vars `--room / --scene-ink / --scene-muted` on `.workspace`. It guarantees ≥ 4.5:1 text contrast at every value; keep that invariant when touching palettes. Desktop dark appearance defaults on when ambience ≥ 75. The slider and stop buttons set `mood`; `ambience` eases toward it in `Workspace` (exponential approach, 110 ms time constant, snapping within 0.3) and that eased value feeds both the CSS vars and the lights, so they stay in step. The three vars are registered with `@property` and transition for 0.12 s on `.workspace` only to soften the per-frame steps and the ink flip; keep that transition short, or the HTML surfaces trail the 3D lighting.

**3D scene rules**
- `Canvas` runs `frameloop="demand"`. After any imperative camera or scene change outside `useFrame`, call `invalidate()` or nothing redraws.
- `StudioScene` is loaded with `dynamic(..., { ssr: false })`. Shader compile → `onReady`; a thrown error, WebGL context loss, or a 12 s stall → `failed`, after which the HTML desktop still works with no scene. Preserve this fallback path.
- `DeskObjects.tsx` is original procedural geometry with canvas-painted textures (`textureFromCanvas`). No GLB, HDRI, or external 3D assets: this is a deliberate design and licensing constraint (`DESIGN.md`).
- The standing desk's height is a number in cm (`src/lib/desk.ts`). `Desk` tweens toward it inside `useFrame`, moving the top group and scaling the upper legs imperatively, and calls `invalidate()` on every moving frame; it reports the live height through `onHeight`, which drives the keypad readout in `Workspace`, the desktop camera eye, and the contact-shadow re-bake (`settledHeight` key). `CameraRig` reads the height through a ref: it must never be an effect dependency there, or every height change would snap the camera to the home view.
- Entering and leaving the desktop are fixed-length camera flights stepped in `CameraRig`'s `useFrame` (timings in `src/lib/transitions.ts`; the shade, overlay, and desktop animations in `globals.css` are tuned to them). `CameraControls` takes a subclass that clamps the frame delta to 1/30 s: with `frameloop="demand"` the first frame after idling hands camera-controls the whole idle time and its smooth damp would otherwise snap to the target. Keep both.
- The canvas fills the viewport so orbiting and zooming never crop the model. An invisible `.scene-frame` box (positioned per breakpoint in `globals.css`) marks where the desk is framed; `CameraRig` measures it and offsets the projection with `setViewOffset`. To reframe the desk, move `.scene-frame` in CSS, not the camera. The `panel-hidden` class on `.workspace` (the side-panel toggle) transitions `.scene-frame` to full width, and `CameraRig` re-applies the offset every frame from `transitionrun` until `transitionend` (1.5 s safety stop).

**Desktop** (`Desktop.tsx`): windows, Dock, sidebar, and search are all keyed by `FolderId`. Adding a section means updating `FolderId` + `folders` in `content.ts`, the branch in `PortfolioContent.tsx`, and `DockIcon` / `navIcons` in `Desktop.tsx`.

**Styling** is one plain-CSS file, `src/app/globals.css` (no Tailwind, no CSS modules). It grew in layers: later sections ("Seamless workspace…", "Tahoe-inspired desktop…") redefine selectors from earlier sections, so grep for every occurrence of a selector before editing it.

## Content constraints

- Profile and experience were verified against LinkedIn, and articles imported from fredymaldonado.com, on 2026-10-18. Do not invent or "improve" biographical facts, dates, or article text.
- Music is deliberately out of scope for now: the headphones are decorative (the listening note and toolbar button were removed on 2026-10-22) until a player is scoped. The résumé is `public/Fredy-Maldonado-CV.pdf`, linked through `profile.cv`; replace the file to update it.
- `public/images/pro-wallpaper-portrait.jpg` is stored portrait and rotated to landscape at display time, in both CSS and the screen textures.

## Reference docs

- `README.md`: feature walkthrough and file map.
- `DESIGN.md`: visual direction, palette, and scope (what the scene must not contain).
- `VALIDATION.md`: manual browser checklist and known limitations. Update it when behavior changes.
