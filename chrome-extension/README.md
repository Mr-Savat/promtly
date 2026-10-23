# Promptly Chrome Extension (architecture MVP)

This folder contains the Chrome extension architecture for Promptly. It is
**intentionally separate** from the website and is NOT part of the Vite build.
It exists to demonstrate how the extension will communicate with the same
backend service layer, and how it stays non-intrusive and privacy-first.

## Design principles

1. **Only activate on supported input fields.** The content script does not
   read or process text on every page. It waits for supported AI text fields
   (ChatGPT, Claude, Gemini) to appear.
2. **Only process text when the user interacts with Promptly.** A small
   Promptly button is injected next to supported fields. Analysis runs only
   when the user clicks it — never automatically.
3. **Share the backend, not the UI.** The extension reuses the same service
   layer (`analyzePrompt`, `generateQuestions`, `improvePrompt`) via HTTP calls
   to the Promptly edge function, never by duplicating AI logic in the popup.
4. **Be small and non-intrusive.** The popup is a compact card, not a full
   dashboard.

## Files

- `manifest.json` — Manifest V3 declaration (MV3, service worker).
- `content-script.js` — Detects supported text fields, injects the Promptly
  button, and renders the floating suggestion popup on click.
- `popup/popup.html` + `popup.js` — The extension toolbar popup for sign-in
  and quick access.
- `service-worker.js` — Background service worker for messaging and auth
  state.
- `README.md` — This file.

## Communication flow

```
Content script
    ↓
Detect supported text input
    ↓
Inject Promptly button
    ↓ (user clicks)
Read field text + send to background
    ↓
Background → Promptly backend (analyzePrompt / generateQuestions / improvePrompt)
    ↓
Floating suggestion popup
    ↓
Improve / Ask
    ↓
Insert improved prompt into the field
```

## Privacy

- No text is read until the user clicks the Promptly button.
- No full-page scanning. No background keylogging. No telemetry from
  unsupported sites.
- The content script only activates on a short allowlist of hosts.

This is the MVP extension experience. The same backend service that powers the
website editor powers the extension.
