# Fredy's workspace

A local Next.js portfolio with an interactive 3D desk, adjustable ambient lighting, and a macOS-inspired desktop. The application lives directly in this project root.

## Run locally

```sh
pnpm install
pnpm dev
```

Open http://127.0.0.1:3000. Node.js 22 or newer is recommended. The project uses pnpm (`brew install pnpm` on macOS); the exact version is pinned under `packageManager` in `package.json`.

```sh
pnpm typecheck
pnpm build
pnpm start
```

## The experience

- An animated fm. preloader covers scene loading, followed by a four-second camera glide and monitor wake-up. Skip is always available; reduced motion and repeat visits bypass the glide.
- Drag the desk to look around, or reset the camera. Raise/lower the standing desk.
- Drag “Set the mood” from daylight through warm amber to after hours. The range input supports keyboard controls and three preset buttons.
- Hide the side panel with the toggle beside the title: the identity, introduction, toolbar, and mood slider ease out to the left (upward on phones) and the desk glides to the center; the docked toggle at the left edge brings them back.
- Click the monitor or “Explore my desktop” to enter.
- Open About, Projects, Experience, Writing, and Contact from desktop files, the Dock, or Finder's sidebar.
- Drag windows by their title bars. Close, minimize, and maximize with the traffic lights; restore minimized windows from the Dock.
- Search with the menu button or Command/Ctrl + K. Escape dismisses search or the active window.
- Use Display settings for light/dark desktop appearance.
- Click the AirPods or the music control for the listening-corner note. Spotify playback is not connected yet.
- `/portfolio` is the independent server-rendered portfolio. The HTML desktop also works when WebGL fails.

## Main files

- `src/lib/content.ts`: profile, projects, verified experience, and résumé URL.
- `src/lib/writing.json`: four complete imported articles, with publication dates and source URLs.
- `src/components/Notes.tsx` and `ArticleBody.tsx`: internal Notes navigation and shared article rendering.
- `src/lib/ambience.ts`: lighting palettes, interpolation, and text contrast.
- `src/components/DeskObjects.tsx`: original desk, chair, laptop, monitor, headphones, bottle, coffee mug, and procedural textures.
- `src/components/StudioScene.tsx`: lighting, reflections, camera choreography, rendering readiness, and failure boundary.
- `src/components/Workspace.tsx`: preloader, arrival states, ambient controls, and desktop transitions.
- `src/components/Desktop.tsx`: window management, Dock, menus, search, and appearance.
- `src/components/PortfolioContent.tsx`: portfolio window contents.
- `src/app/portfolio/page.tsx`: readable portfolio without a 3D dependency.
- `public/images/pro-wallpaper-portrait.jpg`: original 1200 × 2596 user wallpaper, rotated in CSS and Three.js to landscape.
- `public/images/fredy-portrait.png`: user-supplied portrait for About.
- `src/app/writing/[slug]/page.tsx`: static, shareable article pages that also work without JavaScript.
- `DESIGN.md`: current visual direction and scope.
- `VALIDATION.md`: verified checks and remaining limitations.

## Content and assets

Profile and employment history were verified against the user's LinkedIn profile on 2026-10-18. The five roles now include Próspera and preserve the displayed job titles and month-level dates (including Próspera's Aug–Oct 2026 dates). About reflects the verified founder role, degree, and scholarship.

All four published blog posts were imported from fredymaldonado.com on 2026-10-18. Notes opens the full articles internally; the readable portfolio links to local `/writing/[slug]` pages. Article text was checked against the downloaded source. Framer wrappers, scripts, styles, and empty code widgets were discarded; the original prose and semantic formatting are preserved. Source URLs are retained as provenance, not runtime dependencies.

The new portrait and wallpaper are copied unchanged. The wallpaper rotates clockwise at display time, and the screen textures crop to preserve its proportions. The résumé still points to the existing Framer-hosted PDF.

The hardware is original procedural geometry, not manufacturer CAD or copied portfolio assets. The contact action opens the visitor's email client. No database, email service, Spotify integration, production deployment, or domain changes are configured.
