# Windows 11 Replica (HTML / CSS / JS)

Files: index.html, style.css, script.js, apps.json, apps/ (bundled web apps)

Run locally (needed so apps.json and the WASM apps can load):
    python3 -m http.server 8080      then open http://localhost:8080

Deploy: push everything to a GitHub Pages repo (keep .nojekyll). wordcraft's .wasm is ~57 MB;
GitHub warns above 50 MB per file and blocks above 100 MB.

The Store reads apps.json. Install state and custom apps are saved in the browser (localStorage).
Third-party licenses are in apps/<app>/ (LICENSE-MIT, LICENSE-APACHE, NOTICE, ATTRIBUTION.md).
