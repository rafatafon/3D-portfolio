# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Fredy Maldonado's personal portfolio. Next.js 16 App Router, React 19, strict TypeScript. The home page is an interactive 3D desk (React Three Fiber + drei + three) that leads into a macOS-style HTML "desktop" holding the portfolio content. Local only: no deployment, database, email service, or env vars are configured.

Next.js 16 differs from older versions (see `AGENTS.md`). Read the relevant guide in `node_modules/next/dist/docs/` before writing Next-specific code.

## Commands

```sh
npm install
npm run dev          # http://127.0.0.1:3000 (binds 127.0.0.1, not localhost)
npm run typecheck    # tsc --noEmit
npm run build        # must pass; prerenders /, /portfolio, /writing/[slug]
npx prettier@3.6.2 --write src   # source follows Prettier 3.6.2 defaults; not a dependency, no config
```

There is no test runner or lint script. Verification is `typecheck` + `build`, then a browser pass over the flows in `VALIDATION.md`.
CI (`.github/workflows/ci.yml`) runs typecheck, the Prettier check, and the build on pull requests and pushes to `main`.

## Architecture

**Three routes, one content source.**
- `/` → `src/components/Workspace.tsx` (client): 3D scene + HTML desktop.
- `/portfolio` → server-rendered, works without JS or WebGL. Linked from the `noscript` fallback and the workspace UI.
- `/writing/[slug]` → static article pages (`dynamicParams = false`).

All copy lives in `src/lib/content.ts` (profile, projects, experience, skills, `folders`) and `src/lib/writing.json` (articles as a `{tag, children}` node tree rendered by `ArticleBody.tsx` through a tag allowlist). Every surface reads from these two files; edit content there, not in components.

**Home-page state machine** (owned by `Workspace.tsx`): `SceneMode` = `loading → intro → room → entering → desktop → leaving`. The mode is passed to `StudioScene` (camera choreography in `CameraRig`) and applied as class `mode-<name>` on `.workspace` for CSS transitions. `Desktop` mounts only in `desktop` mode. Reduced motion, a failed renderer, or the `sessionStorage` intro flag collapse the animated states to immediate ones.

**Ambience** is a single 0–100 number. `getAmbience()` in `src/lib/ambience.ts` interpolates three palette stops and feeds both the Three.js lights in `StudioScene` and the CSS vars `--room / --scene-ink / --scene-muted` on `.workspace`. It guarantees ≥ 4.5:1 text contrast at every value; keep that invariant when touching palettes. Desktop dark appearance defaults on when ambience ≥ 75.

**3D scene rules**
- `Canvas` runs `frameloop="demand"`. After any imperative camera or scene change outside `useFrame`, call `invalidate()` or nothing redraws.
- `StudioScene` is loaded with `dynamic(..., { ssr: false })`. Shader compile → `onReady`; a thrown error, WebGL context loss, or a 12 s stall → `failed`, after which the HTML desktop still works with no scene. Preserve this fallback path.
- `DeskObjects.tsx` is original procedural geometry with canvas-painted textures (`textureFromCanvas`). No GLB, HDRI, or external 3D assets: this is a deliberate design and licensing constraint (`DESIGN.md`).
- The canvas fills the viewport so orbiting and zooming never crop the model. An invisible `.scene-frame` box (positioned per breakpoint in `globals.css`) marks where the desk is framed; `CameraRig` measures it and offsets the projection with `setViewOffset`. To reframe the desk, move `.scene-frame` in CSS, not the camera.

**Desktop** (`Desktop.tsx`): windows, Dock, sidebar, and search are all keyed by `FolderId`. Adding a section means updating `FolderId` + `folders` in `content.ts`, the branch in `PortfolioContent.tsx`, and `DockIcon` / `navIcons` in `Desktop.tsx`.

**Styling** is one plain-CSS file, `src/app/globals.css` (no Tailwind, no CSS modules). It grew in layers: later sections ("Seamless workspace…", "Tahoe-inspired desktop…") redefine selectors from earlier sections, so grep for every occurrence of a selector before editing it.

## Content constraints

- Profile and experience were verified against LinkedIn, and articles imported from fredymaldonado.com, on 2026-10-18. Do not invent or "improve" biographical facts, dates, or article text.
- Spotify is intentionally not integrated; the listening note is a placeholder. The résumé is an external Framer-hosted PDF.
- `public/images/pro-wallpaper-portrait.jpg` is stored portrait and rotated to landscape at display time, in both CSS and the screen textures.

## Reference docs

- `README.md`: feature walkthrough and file map.
- `DESIGN.md`: visual direction, palette, and scope (what the scene must not contain).
- `VALIDATION.md`: manual browser checklist and known limitations. Update it when behavior changes.
