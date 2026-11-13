# Windows 11 Replica

A browser-based Windows 11 desktop simulation built with HTML, CSS, and JavaScript. It includes a desktop, Start menu, taskbar, windows, settings, widgets, and a Store for the bundled web apps.

## Run locally

Serve the repository over HTTP on `localhost`, or open the deployed HTTPS site. Do not open the pages directly with `file://`.

## Apps and emulator

- The app catalog is defined in `apps.json`; app files are in `apps/`.
- The Retro Emulator is at `apps/emulator/`. Its catalog is `apps/emulator/games.json`.
- Most systems use EmulatorJS from its CDN. PlayStation 2 uses the self-hosted Play! WebAssembly runtime in `apps/emulator/play/`.
- PS2 and PSP emulation require cross-origin isolation. On compatible secure browsers, the emulator enables it with a service worker on first launch, which may reload the page once.
- Local game files are opened in the browser and are not uploaded by the emulator. Only use game files you own or are authorized to distribute.

## GitHub Pages

This is a static site and can be deployed with GitHub Pages. Keep the root `.nojekyll` file so GitHub Pages publishes bundled assets and app directories as-is. The site does not require a build step.
