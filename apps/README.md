# apps/

Each web app lives in its own folder here and is opened in a window via `apps.json`.

Bundled (static WebAssembly builds from GitHub Releases, all MIT OR Apache-2.0):
- wordcraft 0.16.0, gridcraft 0.17.0, deckcraft 0.16.0, pdfcraft 0.19.0, photocraft 0.21.0, lightcraft 0.19.0,
  vectorcraft 0.22.0, designcraft 0.18.0, effectcraft 0.22.0, filmcraft 0.18.0, soundcraft 0.18.0, cadcraft 0.18.0
- emulator/  - Retro Emulator front end using EmulatorJS (GPL-3.0) loaded from its CDN
- channel-atlas/ - Worldwide TV directory with in-app playback for HTTPS HLS streams hosted on the listed broadcaster's own domain; excludes geo-blocked and custom-header streams
- cloud-stream/ (Net Mirror) - IMDb movie and TV metadata search via the linked project's public CORS proxy; queries are sent to IMDb and that proxy. No playback.

## Add another app
1. Copy a static build into `apps/<name>/` (it must contain an `index.html` and use relative URLs).
2. Add one entry to `../apps.json`:
   `{"id":"myapp","name":"My App","icon":"🧩","type":"web","cat":"Utilities","desc":"What it does","url":"apps/myapp/index.html","w":900,"h":600}`
3. Reload. It shows up in the Store.

Other ArtCraft apps (DeckCraft, PhotoCraft, PdfCraft...) publish `<app>-web-<version>.zip` on their GitHub Releases page.
Apps that need a server (databases, ONLYOFFICE, etc.) cannot run on GitHub Pages.
