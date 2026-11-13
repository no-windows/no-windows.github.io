# Windows 11 Replica

A browser-based Windows 11 desktop simulation built with HTML, CSS, and JavaScript. It includes a desktop, Start menu, taskbar, windows, settings, widgets, and a Store for the bundled web apps.

## Run locally

Requires Python 3. From the repository directory, run:

```powershell
python serve.py
```

Then open <http://127.0.0.1:8765>. The local server binds to loopback and provides the isolation headers and byte-range responses required by the emulators.

## Apps and emulator

- The app catalog is defined in `apps.json`; app files are in `apps/`.
- The Retro Emulator is at `apps/emulator/`. Its catalog is `apps/emulator/games.json`.
- Most systems use EmulatorJS from its CDN. PlayStation 2 uses the self-hosted Play! WebAssembly runtime in `apps/emulator/play/`.
- PS2 emulation requires cross-origin isolation. On GitHub Pages, the emulator uses a service worker to add the required headers on compatible secure browsers; the first PS2 launch may reload the page once. If that is unavailable, run the site locally with `python serve.py`.
- PSP emulation also requires cross-origin isolation. Use the local server because GitHub Pages does not allow custom response headers for PSP.
- Local game files are opened in the browser and are not uploaded by the emulator. Only use game files you own or are authorized to distribute.

## GitHub Pages

This is a static site and can be deployed with GitHub Pages. Keep the root `.nojekyll` file so GitHub Pages publishes bundled assets and app directories as-is. The site does not require a build step.
