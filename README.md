# Fredy's workspace

A local Next.js portfolio with an interactive 3D desk, adjustable ambient lighting, and a macOS-inspired desktop. The application lives directly in this project root.

## Run locally

```sh
npm install
npm run dev
```

Open http://127.0.0.1:3000. Node.js 22 or newer is recommended.

```sh
npm run typecheck
npm run build
npm start
```

## The experience

- An animated fm. preloader covers scene loading, followed by a four-second camera glide and monitor wake-up. Skip is always available; reduced motion and repeat visits bypass the glide.
- Drag the desk to look around, or reset the camera. Raise/lower the standing desk.
- Drag “Set the mood” from daylight through warm amber to after hours. The range input supports keyboard controls and three preset buttons.
- Click the monitor or “Explore my desktop” to enter.
- Open About, Projects, Experience, Writing, and Contact from desktop files, the Dock, or Finder's sidebar.
- Drag windows by their title bars. Close, minimize, and maximize with the traffic lights; restore minimized windows from the Dock.
- Search with the menu button or Command/Ctrl + K. Escape dismisses search or the active window.
- Use Display settings for light/dark desktop appearance.
- Click the AirPods or the music control for the listening-corner note. Spotify playback is not connected yet.
- `/portfolio` is the independent server-rendered portfolio. The HTML desktop also works when WebGL fails.

## Main files

- `src/lib/content.ts`: profile, projects, experience, article links, and résumé URL.
- `src/lib/ambience.ts`: lighting palettes, interpolation, and text contrast.
- `src/components/DeskObjects.tsx`: original desk, chair, laptop, monitor, headphones, bottle, and procedural textures.
- `src/components/StudioScene.tsx`: lighting, reflections, camera choreography, rendering readiness, and failure boundary.
- `src/components/Workspace.tsx`: preloader, arrival states, ambient controls, and desktop transitions.
- `src/components/Desktop.tsx`: window management, Dock, menus, search, and appearance.
- `src/components/PortfolioContent.tsx`: portfolio window contents.
- `src/app/portfolio/page.tsx`: readable portfolio without a 3D dependency.
- `public/images/black-wallpaper.png`: user-supplied wallpaper; currently the low-resolution reference.
- `DESIGN.md`: current visual direction and scope.
- `VALIDATION.md`: verified checks and remaining limitations.

## Content and assets

The initial content was sourced from https://fredymaldonado.com/. A public LinkedIn review on 2026-10-18 corrected the AI Text Summarizer and Resume Keyword Matcher years to 2025. The full About and employment history still need the user's profile export or pasted text; no new job titles or employment dates were guessed.

The wallpaper needs a full-resolution replacement. The current file is 235 × 152. Article links and résumé currently point to the existing website/Framer-hosted assets and must be migrated before replacing the production domain.

The hardware is original procedural geometry, not manufacturer CAD or copied portfolio assets. The contact action opens the visitor's email client. No database, email service, Spotify integration, production deployment, or domain changes are configured.
