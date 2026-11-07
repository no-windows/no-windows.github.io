# apps/

Each web app lives in its own folder here and is opened in a window via `apps.json`.

Bundled (static WebAssembly builds from GitHub Releases):
- `wordcraft/`  - storytold/wordcraft v0.16.0  (MIT OR Apache-2.0)
- `gridcraft/`  - storytold/gridcraft v0.17.0  (MIT OR Apache-2.0)

## Add another app
1. Copy a static build into `apps/<name>/` (it must contain an `index.html` and use relative URLs).
2. Add one entry to `../apps.json`:
   `{"id":"myapp","name":"My App","icon":"🧩","type":"web","cat":"Utilities","desc":"What it does","url":"apps/myapp/index.html","w":900,"h":600}`
3. Reload. It shows up in the Store.

Other ArtCraft apps (DeckCraft, PhotoCraft, PdfCraft...) publish `<app>-web-<version>.zip` on their GitHub Releases page.
Apps that need a server (databases, ONLYOFFICE, etc.) cannot run on GitHub Pages.
