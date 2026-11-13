# Windows 11 Replica (HTML / CSS / JS)

Files: index.html, style.css, script.js, apps.json, apps/ (bundled web apps)

Run locally:
    python serve.py      then open http://127.0.0.1:8765

The local server sets the COOP/COEP headers and HTTP byte-range support required by the PSP and PlayStation 2 emulator cores. Play! is self-hosted from its official browser runtime (`apps/emulator/play/Play.js` and `Play.wasm`); its license and source link are included there.
GitHub Pages does not support custom response headers, so PSP and PS2 emulation are unavailable there.

Deploy: push everything to a GitHub Pages repo (keep .nojekyll). wordcraft's .wasm is ~57 MB;
GitHub warns above 50 MB per file and blocks above 100 MB.

The Store reads apps.json. Install state and custom apps are saved in the browser (localStorage).
Third-party licenses are in apps/<app>/ (LICENSE-MIT, LICENSE-APACHE, NOTICE, ATTRIBUTION.md).
