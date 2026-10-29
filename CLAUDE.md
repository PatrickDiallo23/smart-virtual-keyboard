# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run check     # validates manifest references, JS syntax (node --check), and web_accessible_resources coverage
npm run package   # check + `git archive HEAD` -> dist/smart-virtual-keyboard-<version>.zip (only COMMITTED files are packaged)
```

No build step, bundler, linter, or test suite. To run: `chrome://extensions` -> Developer mode -> Load unpacked -> select repo root, then reload the extension after edits. `test.html` is a manual test page. Files not needed at runtime are excluded from the zip via `.gitattributes` (`export-ignore`).

## Architecture

Manifest V3 Chrome extension, vanilla ES modules, no dependencies.

- **`content.js`** is a tiny classic-script loader (the only content script, plus `styles.css`). It bails on non-http(s)/file pages, waits for `extensionEnabled` in `chrome.storage.sync`, then dynamically `import()`s `src/core/VirtualKeyboard.js` via `chrome.runtime.getURL`. It also owns the `Ctrl/Cmd+Shift+K` toggle and re-calls `vk.loadSettings()` on storage changes. Runs in the isolated world so page scripts can't reach settings or the AI key.
- **`background.js`** (service worker) only seeds default settings on install and proxies OpenAI calls (`action: 'openai'` message). The API key lives in `chrome.storage.local` and is read only here, never in the page.
- **`src/core/VirtualKeyboard.js`** is the composition root: constructs `KeyboardState` (single shared mutable state object), services, features, input handlers, UI and panels, wiring them together by passing `state` into constructors. `EventBus` exists in `src/utils/`.
- Layers under `src/`: `core/` (state, config, layouts), `services/` (chrome.storage wrappers — `sync` for settings, `local` for history/secrets), `input/` (`FieldDetector` decides which fields get the keyboard; `KeyHandler` inserts text), `features/` (AutoComplete, Snippets, Clipboard, AI, AutoFill), `ui/` (`KeyboardUI` + `panels/`), `utils/DOMHelpers.js`.
- **`src/popup/`** and **`src/options/`** are normal extension pages (not content-script modules) and are exempt from the web-accessible check.

## Gotchas

- **Every module imported by the content script must be listed in `web_accessible_resources`** in `manifest.json` (currently globs `src/core|ui|ui/panels|input|features|services|utils/*.js` plus `common_words.txt`). A new directory under `src/` needs a new glob entry; `npm run check` fails with `not web_accessible: <file>` otherwise. The check's glob matcher supports only one `*` per pattern.
- OpenAI host permission is limited to `https://api.openai.com/*`; changing the endpoint requires updating `host_permissions` (and `PRIVACY.md`).
- Bump `version` in `manifest.json` (not just `package.json`) — `package` names the zip from it.
- Secure input: the keyboard must not attach to password fields by default (`secureInput` setting) — keep that behavior in `FieldDetector` when editing it.
