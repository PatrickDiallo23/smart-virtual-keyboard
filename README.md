# Smart Virtual Keyboard Pro

An elegant, draggable, and fully customizable virtual keyboard extension for Google Chrome. Enhance your typing experience with smart features like AI assistance, clipboard history, and auto-complete.

## Features

-   **Draggable & Resizable Interface**: Position the keyboard anywhere on the screen and adjust its size to your preference.
-   **Multiple Layouts**: Support for QWERTY, AZERTY, German, and specialized Symbol layouts.
-   **Smart Auto-Complete**: Suggests words based on common English vocabulary.
-   **Clipboard History**: Access your recent clipboard items with a dedicated panel.
-   **AI Assistant**: Powered by OpenAI (requires API key).
    -   **Proofread**: Correct grammar and spelling instantly.
    -   **Continue**: Generate text continuations based on context.
    -   **Smart Suggestions**: Get AI-powered suggestions for your writing.
-   **Text Snippets**: Create shortcuts for frequently used phrases (e.g., `/email` -> `my.email@example.com`).
-   **Themes**: Choose from Light, Dark, Nature, and Sunset themes.
-   **Auto-Fill**: Save and fill form data securely.
-   **Secure Input**: Option to disable logging for sensitive fields.

## Installation (Developer Mode)

1.  Clone this repository or download the ZIP file.
2.  Open Google Chrome and navigate to `chrome://extensions/`.
3.  Enable **"Developer mode"** in the top right corner.
4.  Click **"Load unpacked"**.
5.  Select the directory where you cloned/downloaded this repository.
6.  The extension should now appear in your list of extensions.

## Usage

1.  Click the extension icon in the toolbar to access settings.
2.  Navigate to any webpage with an input field.
3.  Click into an input field, or press `Ctrl + Shift + K` (or `Cmd + Shift + K` on Mac) to toggle the keyboard.
4.  Use the top bar controls to:
    -   Switch layouts (🌍)
    -   Toggle Auto-complete (🔮)
    -   Open AI Assistant (🤖)
    -   View Clipboard History (📋)
    -   Manage Auto-fill (📝)
    -   Toggle Sound (🔊)
    -   Change Theme (🌙/☀️)
    -   Resize (📏)

## Configuration

### AI Features
To use the AI Assistant:
1.  Open the extension popup (click the icon in the toolbar).
2.  Go to **Settings** -> **AI Configuration**.
3.  Enter your OpenAI API Key.
4.  Select your preferred model (e.g., `gpt-4o-mini`).

### Snippets
1.  Open the extension popup.
2.  Go to **Snippets**.
3.  Add new shortcuts and their corresponding expansion text.

## Tech Stack

-   **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3.
-   **Extension API**: Chrome Extension Manifest V3.
-   **AI Integration**: OpenAI API.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the [MIT](LICENSE) License - see the  file for details.

## Acknowledgements

- [English 30k common words repo](https://github.com/arstgit/high-frequency-vocabulary)
