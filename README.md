# Fredy's workspace

A Next.js portfolio with an interactive 3D desk, adjustable ambient lighting, and a macOS-inspired desktop, live at https://fredymaldonado.com. The application lives directly in this project root.

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

- A minimal fm. mark covers scene loading: the letters rise in with a short stagger, the period breathes while the desk loads, and when it is ready the mark flies into the header's own wordmark, followed by a four-second camera glide and monitor wake-up. Reduced motion and repeat visits in the same session skip the motion.
- The monitor in the room shows a sharp painting of the desktop exactly as it opens (About window, files, Dock, menubar), repainted when the mood crosses the dark threshold or the language changes.
- Drag the desk to look around, or reset the camera. Open the desk controller (from the toolbar, or by clicking the small controller under the desk's front-right edge) to set the standing desk's height: hold the arrows to run the motor, tap them for 1 cm, or use the three presets (press S, then a number, to store the current height). Drag the keypad out of the way; the camera stays wherever you were looking from while the desk moves.
- Drag “Set the mood” from daylight through warm amber to after hours. The range input supports keyboard controls and three preset buttons.
- Hide the side panel with the toggle beside the title: the identity, introduction, toolbar, and mood slider ease out to the left (upward on phones) and the desk glides to the center; the docked toggle at the left edge brings them back.
- Click the monitor or “Explore my desktop” to enter. The monitor's screen and the desk controller's LED brighten slightly under the pointer, and pulse once on your first arrival so you know they do something.
- Open About, Projects, Experience, Writing, and Contact from desktop files, the Dock, or Finder's sidebar.
- Drag windows by their title bars. Close, minimize, and maximize with the traffic lights; restore minimized windows from the Dock. Desktop files can be dragged anywhere on the desktop with mouse or touch (a tap still opens them), and the About panel drags by its top strip.
- Search with the menu button or Command/Ctrl + K. Escape dismisses search or the active window.
- Use the Display dropdown for light/dark appearance and for the language. In dark appearance the icons switch to a Tahoe-style dark set (dark glass tiles with coloured glyphs, graphite folders, dark paper documents), crossfading over a third of a second.
- Click the Apple mark for "About this workspace": the project's stack (Next.js, React, TypeScript, three.js, React Three Fiber, drei, plain CSS, pnpm, Vercel) and the models used (Fable 5.1, GPT-6 Astra), with a link to the source.
- Switch between English and Spanish with the EN/ES toggle at the top-right of the room or in the Display dropdown; the choice is remembered, and the copy crossfades. The four essays stay in English.
- The Dock's Finder face opens a Finder window with every item; the house at the left of the Dock returns to the studio.
- The HTML desktop also works when WebGL fails. There is no separate readable page; without JavaScript the home page shows a short notice.

## Main files

- `src/lib/content.ts`: profile, social links, projects, verified experience, and the résumé path (`public/Fredy-Maldonado-CV.pdf`).
- `next.config.ts`: permanent redirects from the previous site's `/blog/<slug>` URLs to the `/writing/<slug>` pages, and the security headers.
- `src/lib/seo.ts`, `src/app/robots.ts`, `src/app/sitemap.ts`, `src/app/opengraph-image.tsx`, `src/components/JsonLd.tsx`: what search engines and link previews read (canonical URL, titles and snippets, `robots.txt`, `sitemap.xml`, the share card, schema.org data).
- `src/lib/transitions.ts`: timings and easing for entering and leaving the desktop.
- `src/lib/i18n.tsx`, `src/lib/strings.ts`, `src/components/LanguageToggle.tsx`: locale provider and hook, room/keypad strings in both languages, and the EN/ES toggle.
- `src/lib/writing.json`: four complete imported articles, with publication dates and source URLs.
- `src/components/Notes.tsx` and `ArticleBody.tsx`: internal Notes navigation and shared article rendering.
- `src/lib/ambience.ts`: lighting palettes, interpolation, and text contrast.
- `src/components/DeskObjects.tsx`: original desk, chair, monitor, headphones, bottle, coffee mug, and procedural textures.
- `src/components/desk/`: shared primitives, the Magic Keyboard with Touch ID, the Magic Mouse, the MacBook Pro (lid logo, keyed keyboard, trackpad, hinge), the AirPods Max, the Owala bottle, the desk-height controller (a miniature of the keypad with a live LED), and `screenTexture.ts`, which paints the monitor's screen from the desktop's own strings and content.
- `src/components/StudioScene.tsx`: lighting, reflections, camera choreography, rendering readiness, and failure boundary.
- `src/components/Workspace.tsx`: preloader, arrival states, ambient controls, and desktop transitions.
- `src/components/Desktop.tsx`: window management (including the Finder window), Dock, menus, search, appearance, language, and its own chrome strings.
- `src/components/PortfolioContent.tsx`: portfolio window contents.
- `public/images/pro-wallpaper-portrait.jpg`: original 1200 × 2596 user wallpaper, rotated in CSS and Three.js to landscape on larger screens and shown upright on phones.
- `public/images/fredy-portrait.png`: user-supplied portrait for About.
- `src/app/writing/[slug]/page.tsx`: static, shareable article pages that also work without JavaScript.
- `DESIGN.md`: current visual direction and scope.
- `VALIDATION.md`: verified checks and remaining limitations.
- `LICENSE`: MIT, for the code.

## Content and assets

Profile and employment history were verified against the user's LinkedIn profile on 2026-10-18. The five roles now include Próspera and preserve the displayed job titles and month-level dates (including Próspera's Aug–Oct 2026 dates). About reflects the verified founder role, degree, and scholarship.

All four published blog posts were imported from fredymaldonado.com on 2026-10-18. Notes opens the full articles internally, and each one also has a static `/writing/[slug]` page that links back to the workspace. Article text was checked against the downloaded source. Framer wrappers, scripts, styles, and empty code widgets were discarded; the original prose and semantic formatting are preserved. Source URLs are retained as provenance, not runtime dependencies.

The new portrait and wallpaper are copied unchanged. The wallpaper rotates clockwise at display time on screens wider than 720px (phones show it upright), and the screen textures crop to preserve its proportions. The résumé is served locally from `public/Fredy-Maldonado-CV.pdf`.

The hardware is original procedural geometry, not manufacturer CAD or copied portfolio assets. The contact action opens the visitor's email client. No database, email service, or Spotify integration is configured.

## Deployment

Production is deployed on Vercel from `main` and served at https://fredymaldonado.com; `www.fredymaldonado.com` redirects to it. The domain moved from the previous Framer site on 2026-10-23, and the four essays' old `/blog/<slug>` URLs redirect permanently to their `/writing/<slug>` pages. Vercel Web Analytics (page views and visitors, no cookies) is mounted in the root layout and reports only from Vercel deployments.

The repository is public. `main` is protected by a ruleset (no deletion or force-push, and the CI check must pass before a merge), secret scanning with push protection is on, Dependabot sends grouped minor and patch updates, and vulnerabilities can be reported privately (see `SECURITY.md`).

For search engines the site serves `robots.txt` and `sitemap.xml` (the home page and the four essays), every page carries a canonical URL, Open Graph and X card tags, and a generated share image, the home page describes its owner with schema.org `Person` and `WebSite` data, and each essay page is a `BlogPosting`. Each note in the desktop links to its own `/writing/<slug>` page, so crawlers can reach the essays from the home page.

## License

The code is released under the MIT License (see `LICENSE`). The content is not: the essays in `src/lib/writing.json`, the profile and project copy in `src/lib/content.ts`, the portrait, the wallpaper, and the résumé remain © Fredy Maldonado, all rights reserved.
