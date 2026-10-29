# Privacy Policy – Smart Virtual Keyboard Pro

Smart Virtual Keyboard Pro does not collect, sell or share personal data, and has no analytics or telemetry.

## Data stored on your device
- **Settings, snippets, auto-fill details, blocked sites** – `chrome.storage.sync` (synced by Chrome to your Google account if you have sync enabled).
- **OpenAI API key and clipboard history** – `chrome.storage.local` only. They never leave your device through Chrome sync.
- Clipboard history can be turned off in Settings and cleared at any time. Password fields are ignored by default (Secure Input).

## Network requests
The only request the extension makes is to `https://api.openai.com`, and only when you press an AI button (Proofread, Continue, Suggest). It sends the text of the field you are editing, using your own API key, and is governed by [OpenAI's privacy policy](https://openai.com/policies/privacy-policy). Nothing is sent otherwise. The word list for auto-complete is bundled with the extension.

## Permissions
- `storage` – save your settings locally.
- Access to all sites (content script) – show the keyboard on any page with a text field.
- `https://api.openai.com/*` – optional AI features.

## Contact
Open an issue at the project's GitHub repository.
